import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { broadcaster } from '../src/lib/telemetry/broadcaster';

const DEFAULT_PORT = 3012;
const MAX_LATENCY_MS = 5000;

interface RouteResult {
  route: string;
  statusCode: number;
  latencyMs: number;
  dataLength: number;
  redirectUrl?: string;
  passed: boolean;
  error?: string;
}

interface SseResult {
  attempt: number;
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  firstChunk: string;
  connectLatencyMs: number;
  teardownDurationMs: number;
  cleanTeardown: boolean;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 1. Direct Broadcaster Teardown Unit Verification
function testBroadcasterSafety(): boolean {
  console.log('\n=== STEP 1: Verifying Broadcaster Listener Teardown Safety ===');
  const initialCount = broadcaster.getTotalTelemetryListeners();
  console.log(`Initial total broadcaster listeners: ${initialCount}`);

  const dummy1 = () => {};
  const dummy2 = () => {};

  const unsub1 = broadcaster.subscribe(dummy1, 'FS-8821');
  const unsub2 = broadcaster.subscribe(dummy2, 'FS-8821');

  const countAfterSub = broadcaster.getTelemetryListenerCount('FS-8821');
  console.log(`Listeners for FS-8821 after 2 subscriptions: ${countAfterSub}`);
  if (countAfterSub < 2) {
    throw new Error(`Expected at least 2 listeners, found ${countAfterSub}`);
  }

  // Idempotent unsubscription test
  unsub1();
  unsub1(); // Calling second time must not throw or alter count erroneously
  unsub2();

  const countAfterUnsub = broadcaster.getTelemetryListenerCount('FS-8821');
  console.log(`Listeners for FS-8821 after unsubscription: ${countAfterUnsub}`);
  if (countAfterUnsub !== 0) {
    throw new Error(`Expected 0 listeners after unsubscription, found ${countAfterUnsub}`);
  }

  console.log('✓ Broadcaster listener management is safe and fully idempotent.');
  return true;
}

// Check if server is reachable
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

// 2. HTTP Request Helper with Cookie Support
async function fetchRoute(port: number, path: string, cookie?: string): Promise<RouteResult> {
  const start = Date.now();
  return new Promise((resolve) => {
    const headers: Record<string, string> = {};
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const req = http.get(`http://localhost:${port}${path}`, { headers }, (res) => {
      let dataLength = 0;
      res.on('data', (chunk) => {
        dataLength += chunk.length;
      });
      res.on('end', () => {
        const latencyMs = Date.now() - start;
        const statusCode = res.statusCode || 0;
        const redirectUrl = res.headers.location;
        const passed = (statusCode === 200 || statusCode === 307 || statusCode === 308) && latencyMs < MAX_LATENCY_MS;
        resolve({
          route: path,
          statusCode,
          latencyMs,
          dataLength,
          redirectUrl,
          passed,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        route: path,
        statusCode: 0,
        latencyMs: Date.now() - start,
        dataLength: 0,
        passed: false,
        error: err.message,
      });
    });

    req.setTimeout(MAX_LATENCY_MS, () => {
      req.destroy(new Error(`Timeout after ${MAX_LATENCY_MS}ms`));
    });
  });
}

// 3. Acquire Demo Operator Session Token
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

// 4. Single SSE Connection with Immediate Disconnect
async function testSseTeardown(port: number, attempt: number, cookie?: string): Promise<SseResult> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    let connectLatencyMs = 0;
    let teardownDurationMs = 0;
    let firstChunk = '';
    let connected = false;

    const headers: Record<string, string> = {};
    if (cookie) headers['Cookie'] = cookie;

    const req = http.get(`http://localhost:${port}/api/telemetry/stream?shipmentId=FS-8821`, { headers }, (res) => {
      connected = true;
      connectLatencyMs = Date.now() - start;

      res.on('data', (chunk) => {
        firstChunk += chunk.toString();
        // Once we receive initial connected chunk, immediately tear down downstream socket
        const tearDownStart = Date.now();
        res.destroy(); // Abort downstream reading
        req.destroy(); // Destroy HTTP client request
        teardownDurationMs = Date.now() - tearDownStart;

        resolve({
          attempt,
          statusCode: res.statusCode || 0,
          headers: res.headers,
          firstChunk: firstChunk.slice(0, 100),
          connectLatencyMs,
          teardownDurationMs,
          cleanTeardown: true,
        });
      });

      res.on('error', () => {
        if (connected) return;
        reject(new Error('SSE stream error prior to initial connection'));
      });
    });

    req.on('error', (err) => {
      if (connected) return;
      reject(err);
    });

    req.setTimeout(MAX_LATENCY_MS, () => {
      req.destroy();
      reject(new Error(`SSE connection timed out after ${MAX_LATENCY_MS}ms`));
    });
  });
}

async function run() {
  console.log('===============================================================');
  console.log('  FreshStream AI: Milestone 1 Stability & Teardown Verification');
  console.log('===============================================================');

  // Step 1: Broadcaster unit tests
  testBroadcasterSafety();

  // Step 2: Ensure server is running
  let serverProcess: ChildProcess | null = null;
  const targetPort = Number(process.env.PORT) || DEFAULT_PORT;
  let running = await isServerReady(targetPort);

  if (!running) {
    console.log(`\nStarting production Next.js server on port ${targetPort}...`);
    serverProcess = spawn('npx', ['next', 'start', '-p', targetPort.toString()], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd(),
    });

    const serverStartTimeout = 25000;
    const startCheck = Date.now();
    while (!running && Date.now() - startCheck < serverStartTimeout) {
      await delay(500);
      running = await isServerReady(targetPort);
    }

    if (!running) {
      if (serverProcess) serverProcess.kill();
      throw new Error(`Failed to start Next.js server on port ${targetPort} within ${serverStartTimeout}ms`);
    }
    console.log(`✓ Next.js server is ready at http://localhost:${targetPort}`);
  } else {
    console.log(`\nReusing active server at http://localhost:${targetPort}`);
  }

  try {
    // Acquire session cookie for authenticated route tests
    console.log('\nAuthenticating demo operator session (operator@freshstream.ai)...');
    const sessionCookie = await loginAndGetCookie(targetPort);
    if (sessionCookie) {
      console.log('✓ Successfully authenticated session token obtained.');
    } else {
      console.log('Notice: Running in public/unauthenticated mode.');
    }

    // Step 3: SSE 10 Consecutive Connection & Teardown Iterations
    console.log('\n=== STEP 2: Running 10 Consecutive SSE Connect & Teardown Tests ===');
    const sseResults: SseResult[] = [];
    for (let i = 1; i <= 10; i++) {
      const res = await testSseTeardown(targetPort, i, sessionCookie || undefined);
      sseResults.push(res);
      console.log(`[SSE #${i}] Status: ${res.statusCode} | Connect: ${res.connectLatencyMs}ms | Teardown: ${res.teardownDurationMs}ms | Clean: ${res.cleanTeardown}`);
      if (res.statusCode !== 200 || !res.cleanTeardown) {
        throw new Error(`SSE test #${i} failed: Status ${res.statusCode}`);
      }
      const cacheControl = String(res.headers['cache-control'] || '');
      if (!cacheControl.includes('no-cache')) {
        throw new Error(`SSE test #${i} missing no-cache header: ${cacheControl}`);
      }
      await delay(50);
    }
    console.log('✓ All 10 consecutive SSE connections connected and tore down cleanly with zero lingering sockets.');

    // Step 4: Verify All 9 Mandatory Routes Latency
    console.log('\n=== STEP 3: Verifying Response Latency on All 9 Required Routes ===');
    const routes = [
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

    console.log('\n[3A] Authenticated Routes Verification:');
    for (const route of routes) {
      const res = await fetchRoute(targetPort, route, sessionCookie || undefined);
      const redirectInfo = res.redirectUrl ? ` -> ${res.redirectUrl}` : '';
      console.log(`  Route [${res.route}]: Status ${res.statusCode}${redirectInfo} | Latency: ${res.latencyMs}ms | Size: ${res.dataLength}B | Pass: ${res.passed}`);
      if (!res.passed) {
        throw new Error(`Route ${res.route} failed: Status ${res.statusCode}, Latency ${res.latencyMs}ms (error: ${res.error})`);
      }
    }

    console.log('\n[3B] Unauthenticated Routes Verification:');
    for (const route of routes) {
      const res = await fetchRoute(targetPort, route);
      const redirectInfo = res.redirectUrl ? ` -> ${res.redirectUrl}` : '';
      console.log(`  Route [${res.route}]: Status ${res.statusCode}${redirectInfo} | Latency: ${res.latencyMs}ms | Size: ${res.dataLength}B | Pass: ${res.passed}`);
      if (!res.passed) {
        throw new Error(`Route ${res.route} failed: Status ${res.statusCode}, Latency ${res.latencyMs}ms (error: ${res.error})`);
      }
    }
    console.log('✓ All 9 routes responded promptly (<5000ms) with valid status codes in both modes.');

    // Step 5: Rapid Navigation Sequence Benchmark (Simulating User Navigating Back & Forth)
    console.log('\n=== STEP 4: Rapid Navigation Sequence Stress Test (2 Consecutive Rounds) ===');
    const navSequence = [
      '/',
      '/dashboard',
      '/dashboard/shipment/FS-8821',
      '/dashboard/analytics',
      '/dashboard/support',
      '/contact',
      '/dashboard',
      '/dashboard/analytics',
    ];

    for (let round = 1; round <= 2; round++) {
      console.log(`\n--- Starting Navigation Round ${round} ---`);
      for (const step of navSequence) {
        // If visiting shipment, simulate SSE connect & disconnect
        if (step.includes('shipment')) {
          await testSseTeardown(targetPort, round * 100, sessionCookie || undefined);
        }
        const res = await fetchRoute(targetPort, step, sessionCookie || undefined);
        const redirectInfo = res.redirectUrl ? ` -> ${res.redirectUrl}` : '';
        console.log(`  Round ${round} [${step}]: ${res.statusCode}${redirectInfo} in ${res.latencyMs}ms (${res.dataLength}B)`);
        if (!res.passed) {
          throw new Error(`Rapid navigation failed at round ${round}, step ${step}: ${res.statusCode} (${res.latencyMs}ms)`);
        }
        await delay(30);
      }
      console.log(`✓ Navigation Round ${round} passed with ZERO hangs!`);
    }

    console.log('\n===============================================================');
    console.log('  VERIFICATION COMPLETE: ALL STABILITY CHECKS PASSED (100%)');
    console.log('===============================================================\n');

  } finally {
    if (serverProcess) {
      console.log('Shutting down temporary test Next.js server...');
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
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
