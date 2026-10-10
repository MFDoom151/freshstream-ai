/**
 * Challenger 1: Adversarial SSE Telemetry Teardown & Broadcaster Concurrency Stress Test
 *
 * Milestone: M1 Stability & Zero-Hang Telemetry Stream
 *
 * Attack Vectors:
 * 1. Broadcaster Concurrency, Idempotence & Race Conditions (Unit)
 * 2. In-Process Route Handler: 25 Concurrent Streams Abrupt Teardown (Stream Cancel + AbortSignal)
 * 3. In-Process Active Broadcast Collision During Socket Slaughter
 * 4. Out-of-Process Server: 25 Concurrent Raw TCP RST/Destroy (Layer 4 Abrupt Drops)
 * 5. Out-of-Process Server: 25 Concurrent HTTP Abrupt Drops During Response Streaming
 * 6. Out-of-Process Server: Active HTTP Ingestion & SSE Broadcast During Violent Socket Teardown (EPIPE / ECONNRESET Stress)
 * 7. Rapid Sequential Churn (50 Rapid Connect-Abort Cycles)
 * 8. Post-Stress Route Latency & Socket Pool Starvation Audit (All 9 Routes < 5000ms)
 */

import http from 'http';
import net from 'net';
import { spawn, ChildProcess } from 'child_process';
import { broadcaster } from '../src/lib/telemetry/broadcaster';
import { GET as sseRouteHandler } from '../src/app/api/telemetry/stream/route';
import { StreamEventPayload } from '../src/lib/telemetry/stream-types';

const TEST_PORT = 3018;
const MAX_ROUTE_LATENCY_MS = 5000;

interface TestSummary {
  name: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

const summary: TestSummary[] = [];

function recordTest(name: string, passed: boolean, details: string, durationMs: number) {
  summary.push({ name, passed, details, durationMs });
  const badge = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${badge}: ${name} (${durationMs}ms)`);
  if (details) {
    console.log(`         ${details}`);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sample realistic payload for broadcasting
function createMockPayload(shipmentId = 'FS-8821', temp = 4.2): StreamEventPayload {
  return {
    success: true,
    shipmentId,
    timestamp: new Date().toISOString(),
    telemetry: {
      temperature: temp,
      humidity: 85,
      ethanol: 3.5,
      gas: 4.1,
      vibration: 0.2,
      cargo: 'beef',
      location: 'kuryk',
    },
    prediction: {
      success: true,
      status: 'OPTIMAL',
      rul_hours: 320,
      predicted_rul: 320,
      shelf_life_hours: 320,
      shelf_life_days: 13.3,
      health_index: 94.5,
      alerts: [],
      recommended_actions: ['Maintain setpoints'],
      telemetry_summary: {
        temperature: temp,
        humidity: 85,
        ethanol: 3.5,
        gas: 4.1,
      },
      model_metadata: {
        model: 'freshstream_real_rul.onnx',
        architecture: '1D-CNN + LSTM',
        window_size: 10,
        features: ['Temperature', 'Humidity', 'MQ3', 'MQ135'],
        version: '1.0.0',
      },
      timestamp: new Date().toISOString(),
    },
  };
}

// ============================================================================
// PHASE 1: Broadcaster Concurrency, Idempotence & Race Conditions
// ============================================================================
async function runPhase1BroadcasterDirectStress(): Promise<void> {
  const start = Date.now();
  console.log('\n--- Phase 1: Broadcaster Concurrency, Idempotence & Race Conditions ---');

  const initialListeners = broadcaster.getTotalTelemetryListeners();
  if (initialListeners !== 0) {
    throw new Error(`Broadcaster initial listener count dirty: expected 0, got ${initialListeners}`);
  }

  // 1A. High concurrency subscription (100 concurrent listeners across 4 shipments + global)
  const shipments = ['FS-8821', 'FS-9042', 'FS-4103', 'FS-6218', undefined];
  const unsubs: Array<() => void> = [];
  const totalSubscriptions = 100;

  for (let i = 0; i < totalSubscriptions; i++) {
    const sId = shipments[i % shipments.length];
    const unsub = broadcaster.subscribe(() => {}, sId);
    unsubs.push(unsub);
  }

  const listenersAfter = broadcaster.getTotalTelemetryListeners();
  if (listenersAfter !== totalSubscriptions) {
    throw new Error(`Expected ${totalSubscriptions} listeners, got ${listenersAfter}`);
  }

  // 1B. Simultaneous broadcast while unsubscriptions occur concurrently
  let broadcastErrors = 0;
  for (let i = 0; i < 20; i++) {
    try {
      broadcaster.broadcast(createMockPayload('FS-8821', 4.0 + i * 0.1));
    } catch {
      broadcastErrors++;
    }
  }

  // 1C. Rapid unsubscription with multi-call idempotence check
  for (const unsub of unsubs) {
    unsub();
    unsub(); // Idempotency check: 2nd call must be no-op
    unsub(); // 3rd call
  }

  const listenersAfterUnsub = broadcaster.getTotalTelemetryListeners();
  const passed = listenersAfterUnsub === 0 && broadcastErrors === 0;

  recordTest(
    'Phase 1: Broadcaster 100 concurrent subscriptions, broadcast race, & triple-unsub idempotence',
    passed,
    `Initial: 0 -> Subscribed: ${listenersAfter} -> Final: ${listenersAfterUnsub} (Broadcast errors: ${broadcastErrors})`,
    Date.now() - start
  );

  if (!passed) {
    throw new Error(`Broadcaster did not drain listeners back to 0! Current count: ${listenersAfterUnsub}`);
  }
}

// ============================================================================
// PHASE 2: In-Process Route Handler: 25 Concurrent Streams Abrupt Teardown
// ============================================================================
async function runPhase2InProcessRouteAbortStress(): Promise<void> {
  const start = Date.now();
  console.log('\n--- Phase 2: In-Process Route Handler: 25 Concurrent Streams Abrupt Teardown ---');

  const initialListeners = broadcaster.getTotalTelemetryListeners();
  const CONCURRENT_STREAMS = 25;

  const abortControllers: AbortController[] = [];
  const responses: Response[] = [];

  for (let i = 0; i < CONCURRENT_STREAMS; i++) {
    const ac = new AbortController();
    abortControllers.push(ac);
    const req = new Request(`http://localhost/api/telemetry/stream?shipmentId=FS-8821`, {
      signal: ac.signal,
    });
    const res = await sseRouteHandler(req);
    responses.push(res);
  }

  const listenersDuring = broadcaster.getTelemetryListenerCount('FS-8821');
  if (listenersDuring !== CONCURRENT_STREAMS) {
    throw new Error(`Expected ${CONCURRENT_STREAMS} listeners during active streams, found ${listenersDuring}`);
  }

  // Abruptly terminate:
  // First 15: cancel downstream ReadableStream body directly without reading
  for (let i = 0; i < 15; i++) {
    const body = responses[i].body;
    if (body) {
      await body.cancel('adversarial_abrupt_disconnect');
    }
  }

  // Remaining 10: abort via Request AbortController
  for (let i = 15; i < CONCURRENT_STREAMS; i++) {
    abortControllers[i].abort(new Error('adversarial_client_abort'));
  }

  // Allow microtask cycle for event loop resolution
  await delay(50);

  const listenersFinal = broadcaster.getTelemetryListenerCount('FS-8821');
  const totalFinal = broadcaster.getTotalTelemetryListeners();

  const passed = listenersFinal === 0 && totalFinal === 0;

  recordTest(
    'Phase 2: In-Process 25 concurrent streams abrupt teardown (15 stream.cancel + 10 AbortSignal)',
    passed,
    `Listeners: 0 -> Active: ${listenersDuring} -> Teardown: ${listenersFinal} (Total: ${totalFinal})`,
    Date.now() - start
  );

  if (!passed) {
    throw new Error(`In-process streams failed to clean up broadcaster listeners! Remaining: ${listenersFinal}`);
  }
}

// ============================================================================
// PHASE 3: In-Process Active Broadcast Collision During Socket Slaughter
// ============================================================================
async function runPhase3ActiveBroadcastCollision(): Promise<void> {
  const start = Date.now();
  console.log('\n--- Phase 3: In-Process Active Broadcast Collision During Socket Slaughter ---');

  const CONCURRENT_STREAMS = 25;
  const abortControllers: AbortController[] = [];
  const responses: Response[] = [];

  for (let i = 0; i < CONCURRENT_STREAMS; i++) {
    const ac = new AbortController();
    abortControllers.push(ac);
    const req = new Request(`http://localhost/api/telemetry/stream?shipmentId=FS-8821`, {
      signal: ac.signal,
    });
    const res = await sseRouteHandler(req);
    responses.push(res);
  }

  let broadcastExceptions = 0;

  // Concurrently emit broadcasts while violently destroying streams
  const broadcastJob = (async () => {
    for (let i = 0; i < 60; i++) {
      try {
        broadcaster.broadcast(createMockPayload('FS-8821', 3.0 + (i % 10) * 0.5));
      } catch {
        broadcastExceptions++;
      }
      await delay(2);
    }
  })();

  const slaughterJob = (async () => {
    for (let i = 0; i < CONCURRENT_STREAMS; i++) {
      await delay(3);
      if (i % 2 === 0) {
        responses[i].body?.cancel('abrupt_kill');
      } else {
        abortControllers[i].abort();
      }
    }
  })();

  await Promise.all([broadcastJob, slaughterJob]);
  await delay(50);

  const finalListeners = broadcaster.getTelemetryListenerCount('FS-8821');
  const passed = finalListeners === 0 && broadcastExceptions === 0;

  recordTest(
    'Phase 3: Active broadcast bombardment during staggered stream cancellation',
    passed,
    `Broadcast exceptions: ${broadcastExceptions}, Remaining listeners: ${finalListeners}`,
    Date.now() - start
  );

  if (!passed) {
    throw new Error(`Listeners did not drain to 0 after broadcast collision! Count: ${finalListeners}`);
  }
}

// ============================================================================
// OUT-OF-PROCESS SERVER MANAGEMENT & SERVER STDERR ERROR TRAP
// ============================================================================
let serverProcess: ChildProcess | null = null;
const serverErrors: string[] = [];

async function isServerReady(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, { timeout: 1000 }, (res) => {
      res.resume();
      resolve(res.statusCode !== undefined);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServerStarted(port: number): Promise<void> {
  const ready = await isServerReady(port);
  if (ready) {
    console.log(`Reusing active server at http://localhost:${port}`);
    return;
  }

  console.log(`Spawning Next.js production server on port ${port}...`);
  serverProcess = spawn('npx', ['next', 'start', '-p', port.toString()], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    cwd: process.cwd(),
  });

  serverProcess.stdout?.on('data', (chunk) => {
    const msg = chunk.toString();
    if (msg.includes('Ready') || msg.includes('Starting')) {
      console.log(`  [Server stdout]: ${msg.trim()}`);
    }
  });

  serverProcess.stderr?.on('data', (chunk) => {
    const msg = chunk.toString();
    if (msg.includes('EPIPE') || msg.includes('ECONNRESET') || msg.includes('ERR_STREAM_DESTROYED') || msg.includes('UncaughtException')) {
      console.error(`[SERVER STDERR CRITICAL TRAP]: ${msg}`);
      serverErrors.push(msg);
    } else {
      console.log(`  [Server stderr]: ${msg.trim()}`);
      serverErrors.push(msg);
    }
  });

  const timeoutMs = 25000;
  const start = Date.now();
  let up = false;
  while (!up && Date.now() - start < timeoutMs) {
    await delay(500);
    up = await isServerReady(port);
  }

  if (!up) {
    throw new Error(`Failed to bring up Next.js server on port ${port} within ${timeoutMs}ms`);
  }
  console.log(`✓ Server ready on http://localhost:${port}`);
}

function terminateServer(): void {
  if (serverProcess && serverProcess.pid) {
    console.log('Terminating test Next.js server...');
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/T', '/PID', serverProcess.pid.toString()]);
      } else {
        serverProcess.kill('SIGTERM');
      }
    } catch {}
  }
}

// ============================================================================
// PHASE 4: 25 Concurrent Raw TCP RST/Destroy (Layer 4 Abrupt Drops)
// ============================================================================
async function runPhase4RawTcpRstStress(port: number): Promise<void> {
  const start = Date.now();
  console.log('\n--- Phase 4: 25 Concurrent Raw TCP RST/Destroy (Layer 4 Abrupt Drops) ---');

  const CONCURRENCY = 25;
  const initialErrorCount = serverErrors.filter((e) => e.includes('EPIPE') || e.includes('ECONNRESET')).length;

  const tasks = Array.from({ length: CONCURRENCY }, (_, i) => {
    return new Promise<{ id: number; connected: boolean; destroyed: boolean }>((resolve) => {
      const socket = net.connect({ port, host: '127.0.0.1' }, () => {
        // Send raw HTTP request header for SSE
        socket.write(`GET /api/telemetry/stream?shipmentId=FS-8821 HTTP/1.1\r\nHost: localhost:${port}\r\nAccept: text/event-stream\r\nConnection: keep-alive\r\n\r\n`);
        // Immediately violently destroy socket without reading
        socket.destroy();
        resolve({ id: i, connected: true, destroyed: true });
      });

      socket.on('error', () => {
        // Client-side socket errors on immediate destroy are expected
        resolve({ id: i, connected: false, destroyed: true });
      });

      socket.setTimeout(2000, () => {
        socket.destroy();
        resolve({ id: i, connected: false, destroyed: true });
      });
    });
  });

  const results = await Promise.all(tasks);
  await delay(150);

  const newErrors = serverErrors.filter((e) => e.includes('EPIPE') || e.includes('ECONNRESET')).length - initialErrorCount;
  const passed = results.length === CONCURRENCY && newErrors === 0;

  recordTest(
    'Phase 4: 25 concurrent raw TCP connections abruptly destroyed on write without reading',
    passed,
    `Sockets dispatched: ${results.length}, Server uncaught EPIPE/ECONNRESET: ${newErrors}`,
    Date.now() - start
  );

  if (!passed) {
    throw new Error(`Server threw uncaught socket errors during raw TCP termination! Errors: ${newErrors}`);
  }
}

// ============================================================================
// PHASE 5: 25 Concurrent HTTP Abrupt Drops During Response Streaming
// ============================================================================
async function runPhase5HttpStreamingAbruptDrops(port: number): Promise<void> {
  const start = Date.now();
  console.log('\n--- Phase 5: 25 Concurrent HTTP Abrupt Drops During Response Streaming ---');

  const CONCURRENCY = 25;
  const initialErrorCount = serverErrors.filter((e) => e.includes('EPIPE') || e.includes('ECONNRESET')).length;

  const tasks = Array.from({ length: CONCURRENCY }, (_, i) => {
    return new Promise<{ id: number; receivedHeader: boolean; abortedCleanly: boolean }>((resolve) => {
      const req = http.get(`http://localhost:${port}/api/telemetry/stream?shipmentId=FS-8821`, (res) => {
        // As soon as the first byte/chunk is received, destroy client socket immediately
        res.on('data', () => {
          res.destroy();
          req.destroy();
          resolve({ id: i, receivedHeader: true, abortedCleanly: true });
        });

        res.on('error', () => {
          resolve({ id: i, receivedHeader: true, abortedCleanly: true });
        });
      });

      req.on('error', () => {
        resolve({ id: i, receivedHeader: false, abortedCleanly: true });
      });

      req.setTimeout(3000, () => {
        req.destroy();
        resolve({ id: i, receivedHeader: false, abortedCleanly: false });
      });
    });
  });

  const results = await Promise.all(tasks);
  await delay(200);

  const newErrors = serverErrors.filter((e) => e.includes('EPIPE') || e.includes('ECONNRESET')).length - initialErrorCount;
  const allAborted = results.every((r) => r.abortedCleanly);
  const passed = allAborted && newErrors === 0;

  recordTest(
    'Phase 5: 25 concurrent HTTP streaming connections aborted on initial chunk',
    passed,
    `Aborted cleanly: ${results.filter((r) => r.abortedCleanly).length}/${CONCURRENCY}, Server EPIPE/ECONNRESET: ${newErrors}`,
    Date.now() - start
  );

  if (!passed) {
    throw new Error(`HTTP stream drops resulted in server errors or stuck sockets!`);
  }
}

// ============================================================================
// PHASE 6: Active HTTP Ingestion & SSE Broadcast During Violent Socket Teardown
// ============================================================================
async function runPhase6ActiveBroadcastDuringSocketSlaughter(port: number): Promise<void> {
  const start = Date.now();
  console.log('\n--- Phase 6: Active HTTP Ingestion & SSE Broadcast During Violent Socket Teardown ---');

  const CONCURRENCY = 15;
  const initialErrorCount = serverErrors.filter((e) => e.includes('EPIPE') || e.includes('ECONNRESET')).length;

  // 1. Establish 15 active SSE connections
  const activeSockets: http.ClientRequest[] = [];
  const connectionPromises = Array.from({ length: CONCURRENCY }, (_, i) => {
    return new Promise<void>((resolve) => {
      const req = http.get(`http://localhost:${port}/api/telemetry/stream?shipmentId=FS-8821`, (res) => {
        activeSockets.push(req);
        res.once('data', () => {
          resolve();
        });
      });
      req.on('error', () => resolve());
    });
  });

  await Promise.all(connectionPromises);
  await delay(50);

  // 2. Concurrently blast POST /api/telemetry while destroying sockets
  const postPromises = Array.from({ length: 10 }, (_, i) => {
    return new Promise<number>((resolve) => {
      const body = JSON.stringify({
        shipmentId: 'FS-8821',
        temperature: 4.0 + i * 0.2,
        humidity: 85,
        ethanol: 4.0 + i,
        gas: 5.0,
        vibration: 0.3,
        location: 'kuryk',
        cargo: 'beef',
      });

      const req = http.request(
        `http://localhost:${port}/api/telemetry`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          res.resume();
          resolve(res.statusCode || 0);
        }
      );
      req.on('error', () => resolve(0));
      req.write(body);
      req.end();
    });
  });

  // Simultaneously slaughter the 15 active sockets while POST requests broadcast data
  const killPromises = activeSockets.map(async (req, idx) => {
    await delay(idx * 5);
    req.destroy();
  });

  const [postStatuses] = await Promise.all([Promise.all(postPromises), Promise.all(killPromises)]);
  await delay(200);

  const postsSuccessful = postStatuses.filter((s) => s === 200).length;
  const newErrors = serverErrors.filter((e) => e.includes('EPIPE') || e.includes('ECONNRESET')).length - initialErrorCount;

  const passed = postsSuccessful >= 8 && newErrors === 0;

  recordTest(
    'Phase 6: Active telemetry ingestion broadcast during simultaneous socket slaughter',
    passed,
    `Telemetry POSTs 200 OK: ${postsSuccessful}/10, Server EPIPE/ECONNRESET: ${newErrors}`,
    Date.now() - start
  );

  if (!passed) {
    throw new Error(`Phase 6 failed: POSTs successful: ${postsSuccessful}, server socket errors: ${newErrors}`);
  }
}

// ============================================================================
// PHASE 7: Rapid Sequential Churn (50 Rapid Connect-Abort Cycles)
// ============================================================================
async function runPhase7RapidSequentialChurn(port: number): Promise<void> {
  const start = Date.now();
  console.log('\n--- Phase 7: Rapid Sequential Churn (50 Rapid Connect-Abort Cycles) ---');

  const CYCLES = 50;
  let successfulCycles = 0;

  for (let i = 1; i <= CYCLES; i++) {
    const cycleSuccess = await new Promise<boolean>((resolve) => {
      const req = http.get(`http://localhost:${port}/api/telemetry/stream?shipmentId=FS-8821`, (res) => {
        res.once('data', () => {
          res.destroy();
          req.destroy();
          resolve(true);
        });
        res.on('error', () => resolve(true));
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });

    if (cycleSuccess) successfulCycles++;
    await delay(3);
  }

  const passed = successfulCycles === CYCLES;

  recordTest(
    'Phase 7: 50 sequential rapid connect-and-abort cycles (churn resilience)',
    passed,
    `Cycles passed: ${successfulCycles}/${CYCLES}`,
    Date.now() - start
  );

  if (!passed) {
    throw new Error(`Rapid sequential churn failed! Successful: ${successfulCycles}/${CYCLES}`);
  }
}

// ============================================================================
// PHASE 8: Post-Stress Route Latency & Socket Pool Starvation Audit
// ============================================================================
async function runPhase8PostStressNavigationAudit(port: number): Promise<void> {
  const start = Date.now();
  console.log('\n--- Phase 8: Post-Stress Route Latency & Socket Pool Starvation Audit ---');

  // 1. Obtain demo session cookie
  const csrfRes = await new Promise<{ csrfToken?: string; cookie?: string }>((resolve) => {
    http.get(`http://localhost:${port}/api/auth/csrf`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const rawCookies = res.headers['set-cookie'] || [];
          const csrfCookie = rawCookies.find((c) => c.includes('next-auth.csrf-token'))?.split(';')[0];
          resolve({ csrfToken: json.csrfToken, cookie: csrfCookie });
        } catch {
          resolve({});
        }
      });
    }).on('error', () => resolve({}));
  });

  let sessionCookie: string | null = null;
  if (csrfRes.csrfToken) {
    const body = new URLSearchParams({
      csrfToken: csrfRes.csrfToken,
      email: 'operator@freshstream.ai',
      password: 'Password123!',
      json: 'true',
    }).toString();

    sessionCookie = await new Promise<string | null>((resolve) => {
      const req = http.request(
        `http://localhost:${port}/api/auth/callback/credentials`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body),
            Cookie: csrfRes.cookie || '',
          },
        },
        (res) => {
          const rawCookies = res.headers['set-cookie'] || [];
          const cookie = rawCookies.find((c) => c.includes('next-auth.session-token'))?.split(';')[0];
          resolve(cookie || null);
        }
      );
      req.on('error', () => resolve(null));
      req.write(body);
      req.end();
    });
  }

  // 2. Test all 9 mandatory routes
  const mandatoryRoutes = [
    '/',
    '/dashboard',
    '/dashboard/shipments',
    '/dashboard/shipment/FS-8821',
    '/dashboard/analytics',
    '/dashboard/support',
    '/contact',
    '/login',
    '/demo',
  ];

  let routesPassed = 0;
  const routeLatencies: Record<string, number> = {};

  for (const route of mandatoryRoutes) {
    const routeStart = Date.now();
    const res = await new Promise<{ statusCode: number; latencyMs: number }>((resolve) => {
      const headers: Record<string, string> = {};
      if (sessionCookie) headers['Cookie'] = sessionCookie;

      const req = http.get(`http://localhost:${port}${route}`, { headers }, (r) => {
        r.resume();
        r.on('end', () => {
          resolve({ statusCode: r.statusCode || 0, latencyMs: Date.now() - routeStart });
        });
      });
      req.on('error', () => resolve({ statusCode: 0, latencyMs: Date.now() - routeStart }));
      req.setTimeout(MAX_ROUTE_LATENCY_MS, () => {
        req.destroy();
        resolve({ statusCode: 0, latencyMs: Date.now() - routeStart });
      });
    });

    routeLatencies[route] = res.latencyMs;
    const isValidStatus = res.statusCode === 200 || res.statusCode === 307 || res.statusCode === 308;
    const isTimely = res.latencyMs < MAX_ROUTE_LATENCY_MS;

    if (isValidStatus && isTimely) {
      routesPassed++;
      console.log(`    Route [${route}]: Status ${res.statusCode} | Latency ${res.latencyMs}ms (<5000ms threshold)`);
    } else {
      console.error(`    Route [${route}] FAILED: Status ${res.statusCode} | Latency ${res.latencyMs}ms`);
    }
  }

  const passed = routesPassed === mandatoryRoutes.length;

  recordTest(
    'Phase 8: All 9 routes response latency post-stress (<5000ms without socket starvation)',
    passed,
    `Routes verified: ${routesPassed}/${mandatoryRoutes.length} (Max latency: ${Math.max(...Object.values(routeLatencies))}ms)`,
    Date.now() - start
  );

  if (!passed) {
    throw new Error(`Post-stress route verification failed! Passed: ${routesPassed}/${mandatoryRoutes.length}`);
  }
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function main() {
  console.log('======================================================================');
  console.log(' FRESHSTREAM AI: ADVERSARIAL SSE & BROADCASTER STRESS TEST SUITE      ');
  console.log(' Challenger: Challenger 1 (M1 SSE Stress & Socket Challenger)         ');
  console.log('======================================================================');

  try {
    // In-process adversarial suites
    await runPhase1BroadcasterDirectStress();
    await runPhase2InProcessRouteAbortStress();
    await runPhase3ActiveBroadcastCollision();

    // Out-of-process live server adversarial suites
    await ensureServerStarted(TEST_PORT);
    await runPhase4RawTcpRstStress(TEST_PORT);
    await runPhase5HttpStreamingAbruptDrops(TEST_PORT);
    await runPhase6ActiveBroadcastDuringSocketSlaughter(TEST_PORT);
    await runPhase7RapidSequentialChurn(TEST_PORT);
    await runPhase8PostStressNavigationAudit(TEST_PORT);

    console.log('\n======================================================================');
    console.log('               ADVERSARIAL CHALLENGE RESULTS SUMMARY                  ');
    console.log('======================================================================');

    let allPassed = true;
    for (const item of summary) {
      if (!item.passed) allPassed = false;
      console.log(`${item.passed ? '✅' : '❌'} ${item.name} [${item.durationMs}ms]`);
      console.log(`   ${item.details}`);
    }

    console.log('======================================================================');
    if (allPassed) {
      console.log('VERDICT: ALL ADVERSARIAL CHALLENGES SURVIVED WITH 0 HANGS & 0 LEAKS.');
      process.exit(0);
    } else {
      console.error('VERDICT: ADVERSARIAL CHALLENGE REVEALED FAILURES!');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('\n❌ FATAL ADVERSARIAL STRESS FAILURE:', err.message || err);
    process.exit(1);
  } finally {
    terminateServer();
  }
}

main();
