/**
 * FreshStream AI — Challenger 2 Adversarial Navigation Stress Suite
 * 
 * Objective:
 * Adversarially challenge route response latencies across repeated navigation cycles
 * (at least 5 cycles across all routes) under active telemetry load.
 * Assert all resolve in <5.0 seconds.
 * Verify active telemetry streams do not block subsequent page requests in HTTP/1.1.
 */

import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { broadcaster } from '../src/lib/telemetry/broadcaster';

const DEFAULT_PORT = 3015;
const MAX_ALLOWED_LATENCY_MS = 5000;

interface RouteMetric {
  cycle: number;
  step: number;
  route: string;
  statusCode: number;
  latencyMs: number;
  dataLength: number;
  redirectUrl?: string;
  hasMainContent: boolean;
  passed: boolean;
  error?: string;
}

interface SseHandle {
  shipmentId: string;
  connected: boolean;
  chunksReceived: number;
  connectLatencyMs: number;
  close: () => Promise<number>;
  req: http.ClientRequest;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to check if server is responsive
async function isServerReady(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, { timeout: 1500 }, (res) => {
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

// NextAuth Authentication Helper
async function loginAndGetCookie(port: number): Promise<string | null> {
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

  if (!csrfRes.csrfToken) return null;

  const body = new URLSearchParams({
    csrfToken: csrfRes.csrfToken,
    email: 'operator@freshstream.ai',
    password: 'Password123!',
    json: 'true',
  }).toString();

  return new Promise<string | null>((resolve) => {
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
        const sessionCookie = rawCookies.find((c) => c.includes('next-auth.session-token'))?.split(';')[0];
        resolve(sessionCookie || null);
      }
    );
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

// Route Fetcher with content inspection
async function fetchRoute(
  port: number,
  path: string,
  cycle: number,
  step: number,
  cookie?: string
): Promise<RouteMetric> {
  const start = Date.now();
  return new Promise((resolve) => {
    const headers: Record<string, string> = {
      'User-Agent': 'Challenger-Nav-Stress-Agent/2.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    };
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const req = http.get(`http://localhost:${port}${path}`, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const latencyMs = Date.now() - start;
        const statusCode = res.statusCode || 0;
        const redirectUrl = res.headers.location;
        const isSuccessOrRedirect = statusCode === 200 || statusCode === 307 || statusCode === 308 || statusCode === 302;
        
        // Assert main content exists: if 200, must have HTML content; if 307, must have Location header
        const hasMainContent = statusCode === 200 ? (data.length > 200 && (data.includes('<!DOCTYPE html>') || data.includes('<html') || data.includes('<body') || data.includes('FreshStream'))) : Boolean(redirectUrl);
        const passed = isSuccessOrRedirect && latencyMs < MAX_ALLOWED_LATENCY_MS && hasMainContent;

        resolve({
          cycle,
          step,
          route: path,
          statusCode,
          latencyMs,
          dataLength: data.length,
          redirectUrl,
          hasMainContent,
          passed,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        cycle,
        step,
        route: path,
        statusCode: 0,
        latencyMs: Date.now() - start,
        dataLength: 0,
        hasMainContent: false,
        passed: false,
        error: err.message,
      });
    });

    req.setTimeout(MAX_ALLOWED_LATENCY_MS, () => {
      req.destroy(new Error(`Timeout after ${MAX_ALLOWED_LATENCY_MS}ms`));
    });
  });
}

// Start an SSE Telemetry Stream connection
function startTelemetryStream(port: number, shipmentId: string, cookie?: string): Promise<SseHandle> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    };
    if (cookie) headers['Cookie'] = cookie;

    const req = http.get(
      `http://localhost:${port}/api/telemetry/stream?shipmentId=${shipmentId}`,
      { headers },
      (res) => {
        let chunksReceived = 0;
        let resolved = false;

        const handle: SseHandle = {
          shipmentId,
          connected: false,
          chunksReceived: 0,
          connectLatencyMs: 0,
          req,
          close: () => {
            const tearDownStart = Date.now();
            return new Promise<number>((done) => {
              res.destroy();
              req.destroy();
              done(Date.now() - tearDownStart);
            });
          },
        };

        res.on('data', (_chunk) => {
          chunksReceived++;
          handle.chunksReceived = chunksReceived;
          if (!resolved) {
            resolved = true;
            handle.connected = true;
            handle.connectLatencyMs = Date.now() - start;
            resolve(handle);
          }
        });

        res.on('error', (err) => {
          if (!resolved) {
            resolved = true;
            reject(err);
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(MAX_ALLOWED_LATENCY_MS, () => {
      req.destroy(new Error(`SSE connection timeout after ${MAX_ALLOWED_LATENCY_MS}ms`));
    });
  });
}

async function run() {
  console.log('========================================================================');
  console.log(' FRESHSTREAM AI — CHALLENGER 2: ADVERSARIAL ROUTE LATENCY STRESS SUITE');
  console.log(' Objective: 5+ Repeated Navigation Cycles under Active Telemetry Load');
  console.log(' Hard Constraint: Every route must resolve with main content < 5.0s');
  console.log('========================================================================\n');

  const targetPort = Number(process.env.PORT) || DEFAULT_PORT;
  let serverProcess: ChildProcess | null = null;
  let running = await isServerReady(targetPort);

  if (!running) {
    console.log(`Starting production Next.js server on port ${targetPort}...`);
    serverProcess = spawn('npx', ['next', 'start', '-p', targetPort.toString()], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd(),
    });

    const timeout = 30000;
    const start = Date.now();
    while (!running && Date.now() - start < timeout) {
      await delay(500);
      running = await isServerReady(targetPort);
    }

    if (!running) {
      if (serverProcess) serverProcess.kill();
      throw new Error(`Failed to start server on port ${targetPort} within ${timeout}ms`);
    }
    console.log(`✓ Production server listening at http://localhost:${targetPort}\n`);
  } else {
    console.log(`Reusing active server at http://localhost:${targetPort}\n`);
  }

  const allMetrics: RouteMetric[] = [];
  const failures: RouteMetric[] = [];

  try {
    // Phase 0: Authenticate
    console.log('--- Phase 0: Authenticating Session ---');
    const sessionCookie = await loginAndGetCookie(targetPort);
    if (!sessionCookie) {
      throw new Error('Failed to obtain authenticated session cookie for operator@freshstream.ai');
    }
    console.log('✓ Successfully authenticated session token obtained.');
    console.log(`Initial Broadcaster Listener Count: ${broadcaster.getTotalTelemetryListeners()}`);

    // Navigation sequence to test per cycle:
    // Home -> Dashboard -> Shipments -> Shipment Detail -> Analytics -> Support -> Contact -> Dashboard -> Analytics
    const navSequence = [
      '/',
      '/dashboard',
      '/dashboard/shipments',
      '/dashboard/shipment/FS-8821',
      '/dashboard/analytics',
      '/dashboard/support',
      '/contact',
      '/dashboard',
      '/dashboard/analytics',
    ];

    console.log('\n--- Beginning 5 Adversarial Navigation Cycles ---\n');

    // -------------------------------------------------------------------------
    // CYCLE 1: Baseline Navigation with Full Handshake & Clean Teardown
    // -------------------------------------------------------------------------
    console.log('>>> CYCLE 1: Standard Navigation with Live SSE Handshake & Teardown <<<');
    for (let i = 0; i < navSequence.length; i++) {
      const route = navSequence[i];
      let sseHandle: SseHandle | null = null;

      if (route.includes('shipment')) {
        // Connect SSE telemetry stream
        sseHandle = await startTelemetryStream(targetPort, 'FS-8821', sessionCookie);
        console.log(`   [SSE] Connected to FS-8821 stream in ${sseHandle.connectLatencyMs}ms`);
        // Hold open for 400ms to receive active data
        await delay(400);
        const teardownMs = await sseHandle.close();
        console.log(`   [SSE] Cleanly closed stream in ${teardownMs}ms`);
      }

      const metric = await fetchRoute(targetPort, route, 1, i + 1, sessionCookie);
      allMetrics.push(metric);
      if (!metric.passed) failures.push(metric);

      const statusNote = metric.redirectUrl ? ` -> ${metric.redirectUrl}` : '';
      console.log(`  [C1-S${i + 1}] ${route} => ${metric.statusCode}${statusNote} in ${metric.latencyMs}ms (${metric.dataLength}B) [Pass: ${metric.passed}]`);
      await delay(50);
    }
    console.log(`Cycle 1 complete. Broadcaster listeners: ${broadcaster.getTotalTelemetryListeners()}\n`);

    // -------------------------------------------------------------------------
    // CYCLE 2: Active Telemetry Overlap (Navigating While Stream Is Left Active)
    // -------------------------------------------------------------------------
    console.log('>>> CYCLE 2: Active Telemetry Overlap (Navigating While Stream Stays Active) <<<');
    let activeStreamCycle2: SseHandle | null = null;
    for (let i = 0; i < navSequence.length; i++) {
      const route = navSequence[i];

      if (route.includes('shipment')) {
        // Open stream and intentionally KEEP IT ACTIVE across subsequent navigations
        activeStreamCycle2 = await startTelemetryStream(targetPort, 'FS-8821', sessionCookie);
        console.log(`   [SSE] Opened PERSISTENT active stream for FS-8821 (${activeStreamCycle2.connectLatencyMs}ms)`);
      }

      const metric = await fetchRoute(targetPort, route, 2, i + 1, sessionCookie);
      allMetrics.push(metric);
      if (!metric.passed) failures.push(metric);

      const statusNote = metric.redirectUrl ? ` -> ${metric.redirectUrl}` : '';
      console.log(`  [C2-S${i + 1}] ${route} => ${metric.statusCode}${statusNote} in ${metric.latencyMs}ms (${metric.dataLength}B) [Pass: ${metric.passed}]`);

      // Once we pass analytics and support under active streaming load, tear it down
      if (route === '/dashboard/support' && activeStreamCycle2) {
        const td = await activeStreamCycle2.close();
        console.log(`   [SSE] Closed persistent stream after testing concurrent page loads in ${td}ms`);
        activeStreamCycle2 = null;
      }
      await delay(50);
    }
    if (activeStreamCycle2) await activeStreamCycle2.close();
    console.log(`Cycle 2 complete. Broadcaster listeners: ${broadcaster.getTotalTelemetryListeners()}\n`);

    // -------------------------------------------------------------------------
    // CYCLE 3: Multi-Shipment Concurrent Telemetry Load (3 Parallel SSE Streams)
    // -------------------------------------------------------------------------
    console.log('>>> CYCLE 3: Multi-Shipment Telemetry Load (3 Parallel Live Streams) <<<');
    console.log('   Spawning 3 concurrent background SSE streams: FS-8821, FS-9042, FS-4103...');
    const bgStream1 = await startTelemetryStream(targetPort, 'FS-8821', sessionCookie);
    const bgStream2 = await startTelemetryStream(targetPort, 'FS-9042', sessionCookie);
    const bgStream3 = await startTelemetryStream(targetPort, 'FS-4103', sessionCookie);
    console.log(`   All 3 streams active! Broadcaster listeners: ${broadcaster.getTotalTelemetryListeners()}`);

    for (let i = 0; i < navSequence.length; i++) {
      const route = navSequence[i];
      const metric = await fetchRoute(targetPort, route, 3, i + 1, sessionCookie);
      allMetrics.push(metric);
      if (!metric.passed) failures.push(metric);

      const statusNote = metric.redirectUrl ? ` -> ${metric.redirectUrl}` : '';
      console.log(`  [C3-S${i + 1}] ${route} => ${metric.statusCode}${statusNote} in ${metric.latencyMs}ms (${metric.dataLength}B) [Pass: ${metric.passed}]`);
      await delay(30);
    }

    console.log('   Tearing down 3 background streams...');
    await Promise.all([bgStream1.close(), bgStream2.close(), bgStream3.close()]);
    await delay(100);
    console.log(`Cycle 3 complete. Broadcaster listeners: ${broadcaster.getTotalTelemetryListeners()}\n`);

    // -------------------------------------------------------------------------
    // CYCLE 4: Abrupt Client Disconnections / Severed TCP Sockets
    // -------------------------------------------------------------------------
    console.log('>>> CYCLE 4: Abrupt Client Disconnections & Rapid Re-navigation <<<');
    for (let i = 0; i < navSequence.length; i++) {
      const route = navSequence[i];

      if (route.includes('shipment')) {
        // Connect SSE and instantly sever TCP socket abruptly
        const abruptHandle = await startTelemetryStream(targetPort, 'FS-8821', sessionCookie);
        // Abrupt destroy without polite close
        abruptHandle.req.destroy();
        console.log('   [SSE] Abruptly destroyed client socket mid-stream to simulate harsh disconnect');
        await delay(50);
      }

      const metric = await fetchRoute(targetPort, route, 4, i + 1, sessionCookie);
      allMetrics.push(metric);
      if (!metric.passed) failures.push(metric);

      const statusNote = metric.redirectUrl ? ` -> ${metric.redirectUrl}` : '';
      console.log(`  [C4-S${i + 1}] ${route} => ${metric.statusCode}${statusNote} in ${metric.latencyMs}ms (${metric.dataLength}B) [Pass: ${metric.passed}]`);
      await delay(20);
    }
    console.log(`Cycle 4 complete. Broadcaster listeners: ${broadcaster.getTotalTelemetryListeners()}\n`);

    // -------------------------------------------------------------------------
    // CYCLE 5: High-Speed Rapid Navigation Loop (Zero Artificial Delay)
    // -------------------------------------------------------------------------
    console.log('>>> CYCLE 5: High-Speed Rapid Navigation Loop (Back-to-Back) <<<');
    for (let i = 0; i < navSequence.length; i++) {
      const route = navSequence[i];

      if (route.includes('shipment')) {
        const stream = await startTelemetryStream(targetPort, 'FS-8821', sessionCookie);
        await stream.close();
      }

      const metric = await fetchRoute(targetPort, route, 5, i + 1, sessionCookie);
      allMetrics.push(metric);
      if (!metric.passed) failures.push(metric);

      const statusNote = metric.redirectUrl ? ` -> ${metric.redirectUrl}` : '';
      console.log(`  [C5-S${i + 1}] ${route} => ${metric.statusCode}${statusNote} in ${metric.latencyMs}ms (${metric.dataLength}B) [Pass: ${metric.passed}]`);
    }
    console.log(`Cycle 5 complete. Broadcaster listeners: ${broadcaster.getTotalTelemetryListeners()}\n`);

    // -------------------------------------------------------------------------
    // BONUS ADVERSARIAL STRESS: Public / Unauthenticated Navigation Verification
    // -------------------------------------------------------------------------
    console.log('>>> BONUS: Unauthenticated Navigation Verification Across All Routes <<<');
    for (let i = 0; i < navSequence.length; i++) {
      const route = navSequence[i];
      const metric = await fetchRoute(targetPort, route, 6, i + 1, undefined);
      allMetrics.push(metric);
      if (!metric.passed) failures.push(metric);

      const statusNote = metric.redirectUrl ? ` -> ${metric.redirectUrl}` : '';
      console.log(`  [Unauth-S${i + 1}] ${route} => ${metric.statusCode}${statusNote} in ${metric.latencyMs}ms (${metric.dataLength}B) [Pass: ${metric.passed}]`);
    }

    // -------------------------------------------------------------------------
    // STATISTICAL ANALYSIS & EMPIRICAL REPORT
    // -------------------------------------------------------------------------
    const totalRequests = allMetrics.length;
    const latencies = allMetrics.map((m) => m.latencyMs).sort((a, b) => a - b);
    const minLatency = latencies[0];
    const maxLatency = latencies[latencies.length - 1];
    const meanLatency = (latencies.reduce((sum, val) => sum + val, 0) / latencies.length).toFixed(1);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log('\n========================================================================');
    console.log(' EMPIRICAL TEST RESULTS SUMMARY');
    console.log('========================================================================');
    console.log(`Total Requests Evaluated:  ${totalRequests}`);
    console.log(`Successful (<5.0s, valid):  ${totalRequests - failures.length} / ${totalRequests}`);
    console.log(`Failures (>=5.0s, hang):    ${failures.length}`);
    console.log(`Min Latency:               ${minLatency} ms`);
    console.log(`Max Latency:               ${maxLatency} ms`);
    console.log(`Mean Latency:              ${meanLatency} ms`);
    console.log(`P50 Latency:               ${p50} ms`);
    console.log(`P95 Latency:               ${p95} ms`);
    console.log(`P99 Latency:               ${p99} ms`);
    console.log(`Final Broadcaster Listeners:${broadcaster.getTotalTelemetryListeners()}`);

    const verdict = failures.length === 0 && maxLatency < MAX_ALLOWED_LATENCY_MS ? 'APPROVE' : 'REJECT';
    console.log(`\nFINAL VERDICT:             ${verdict}`);
    console.log('========================================================================\n');

    if (failures.length > 0) {
      console.error('Failed requests:');
      console.error(failures);
      process.exit(1);
    }
  } finally {
    if (serverProcess) {
      console.log('Terminating Next.js test server process...');
      try {
        if (process.platform === 'win32' && serverProcess.pid) {
          spawn('taskkill', ['/F', '/T', '/PID', serverProcess.pid.toString()]);
        } else {
          serverProcess.kill('SIGTERM');
        }
      } catch {}
    }
  }
}

run().catch((err) => {
  console.error('\n❌ Challenger 2 Suite Crashed:', err);
  process.exit(1);
});
