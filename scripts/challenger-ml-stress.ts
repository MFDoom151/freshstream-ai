/**
 * FreshStream AI - Challenger 1 ML Stress Testing & Edge Cases Suite
 * 
 * Tests:
 * 1. Boundary & Extreme Values (Freezing -50C..0C, Extreme Heat 25C..100C, Humidity 0%..100%, Ethanol 0..500ppm)
 * 2. Invariant Verification (RUL >= 0, Health Index in [0, 100]%, Finite numbers)
 * 3. Alert Generation Matrix (Critical vs Warning vs Optimal)
 * 4. Payloads & Sequence Lengths (0, 1, 5, 10, 50, 500 steps, nested arrays, object arrays)
 * 5. Corrupted / Fuzzed / Malformed Inputs (Missing fields, nulls, NaNs, strings, huge numbers, empty payloads)
 * 6. High-Concurrency Stress Test (50, 100, 200 concurrent requests, throughput & latency)
 * 7. Live HTTP API Route Verification (GET /api/predict, POST /api/predict, error responses)
 */

import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import {
  runMLInference,
  extractSequence,
  parseTelemetryPoint,
  loadScalerParams,
  resolveModelPath,
  PredictResult
} from '../src/lib/ml/inference';

const PORT = 3088;
const BASE_URL = `http://127.0.0.1:${PORT}`;

interface TestResult {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

const results: TestResult[] = [];

function record(category: string, name: string, passed: boolean, details: string, durationMs: number = 0) {
  results.push({ id: `T${results.length + 1}`, category, name, passed, details, durationMs });
  const icon = passed ? 'PASS [✓]' : 'FAIL [✗]';
  console.log(`  ${icon} [${category}] ${name}: ${details} (${durationMs.toFixed(1)}ms)`);
}

function httpRequest(urlStr: string, options: http.RequestOptions = {}, bodyData: string | null = null): Promise<{ status: number; json: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const reqOptions: http.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: { ...(options.headers || {}) },
      timeout: 10000,
    };

    const headers: Record<string, string | number> = { ...((options.headers as any) || {}) };
    if (bodyData !== null) {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    }
    reqOptions.headers = headers;

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({ status: res.statusCode || 0, json, raw: data });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTP request timed out after 10000ms'));
    });

    if (bodyData !== null) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function waitForServer(port: number, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await httpRequest(`http://127.0.0.1:${port}/api/predict`);
      if (res.status === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function startServer(): Promise<ChildProcess> {
  console.log(`Starting Next.js production server on port ${PORT}...`);
  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const server = spawn(process.execPath, [nextBin, 'start', '-p', String(PORT)], {
    stdio: 'pipe',
  });

  server.stdout?.on('data', (d) => {
    const s = d.toString().trim();
    if (s.includes('Ready') || s.includes('Starting') || s.includes('Local:')) {
      console.log(`  [server stdout]: ${s}`);
    }
  });
  server.stderr?.on('data', (d) => {
    const s = d.toString().trim();
    if (s) console.error(`  [server stderr]: ${s}`);
  });

  const ready = await waitForServer(PORT, 30);
  if (!ready) {
    killProcess(server);
    throw new Error(`Server failed to start on port ${PORT} within 30 seconds.`);
  }
  console.log(`✓ Next.js server ready on port ${PORT}\n`);
  return server;
}

function killProcess(proc: ChildProcess) {
  try {
    if (process.platform === 'win32' && proc.pid) {
      spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], { shell: true });
    } else {
      proc.kill('SIGKILL');
    }
  } catch {}
}

async function main() {
  console.log('================================================================================');
  console.log('   CHALLENGER 1: ML INFERENCE ENGINE & API ADVERSARIAL STRESS TEST SUITE       ');
  console.log('================================================================================\n');

  // --- SUITE 1: Engine Initialization & Scaler Integrity ---
  console.log('--- SUITE 1: Engine Initialization & Scaler Parameters ---');
  try {
    const t0 = performance.now();
    const modelPath = resolveModelPath();
    const scaler = loadScalerParams();
    const dt = performance.now() - t0;

    record('INIT', 'Model Path Resolution', !!modelPath, `Resolved to ${modelPath}`, dt);
    record('INIT', 'Scaler Loading', !!scaler && scaler.features.length === 4, `Features: ${scaler.features.join(', ')}, Window: ${scaler.window_size}`, dt);
    record('INIT', 'Scaler Means & Stds Valid', scaler.mean.every(Number.isFinite) && scaler.std.every(s => s > 0), `Means: ${scaler.mean.map(m=>m.toFixed(2))}, Stds: ${scaler.std.map(s=>s.toFixed(2))}`, dt);
  } catch (err: any) {
    record('INIT', 'Engine Initialization', false, `Failed: ${err.message}`);
  }

  // --- SUITE 2: Boundary & Extreme Values Stress Test ---
  console.log('\n--- SUITE 2: Extreme Sensor Values & Physical Invariants ---');
  const extremeCases = [
    { name: 'Deep Freeze -50°C', input: { temperature: -50, humidity: 80, ethanol: 2, gas: 3 } },
    { name: 'Sub-Zero Freeze -20°C', input: { temperature: -20, humidity: 75, ethanol: 1, gas: 2 } },
    { name: 'Freezing Threshold -5°C', input: { temperature: -5.1, humidity: 85, ethanol: 0.5, gas: 1 } },
    { name: 'Freezing Edge 0°C', input: { temperature: 0, humidity: 80, ethanol: 1, gas: 2 } },
    { name: 'Ideal Cold Chain 4°C', input: { temperature: 4, humidity: 82, ethanol: 2, gas: 3 } },
    { name: 'Cold Ceiling 8°C', input: { temperature: 8.0, humidity: 80, ethanol: 3, gas: 4 } },
    { name: 'Warning Excursion 12°C', input: { temperature: 12.0, humidity: 80, ethanol: 5, gas: 6 } },
    { name: 'Severe Excursion 26°C', input: { temperature: 26.0, humidity: 85, ethanol: 10, gas: 8 } },
    { name: 'Tropical Heat 40°C', input: { temperature: 40.0, humidity: 90, ethanol: 20, gas: 15 } },
    { name: 'Extreme Scalding 60°C', input: { temperature: 60.0, humidity: 95, ethanol: 30, gas: 20 } },
    { name: 'Boiling Boundary 100°C', input: { temperature: 100.0, humidity: 99, ethanol: 40, gas: 25 } },
    { name: 'Absolute Zero Humidity 0%', input: { temperature: 4, humidity: 0, ethanol: 2, gas: 3 } },
    { name: 'Condensing Humidity 100%', input: { temperature: 4, humidity: 100, ethanol: 2, gas: 3 } },
    { name: 'Supersaturated Humidity 150%', input: { temperature: 4, humidity: 150, ethanol: 2, gas: 3 } },
    { name: 'Zero Ethanol 0 ppm', input: { temperature: 4, humidity: 80, ethanol: 0, gas: 3 } },
    { name: 'Sub-threshold Ethanol 15 ppm', input: { temperature: 4, humidity: 80, ethanol: 15, gas: 3 } },
    { name: 'Warning Ethanol 22 ppm', input: { temperature: 4, humidity: 80, ethanol: 22, gas: 3 } },
    { name: 'Critical Ethanol 36 ppm', input: { temperature: 4, humidity: 80, ethanol: 36, gas: 3 } },
    { name: 'High Fermentation 50 ppm', input: { temperature: 4, humidity: 80, ethanol: 50, gas: 3 } },
    { name: 'Lethal Fermentation 150 ppm', input: { temperature: 4, humidity: 80, ethanol: 150, gas: 3 } },
    { name: 'Massive Fermentation Spike 500 ppm', input: { temperature: 4, humidity: 80, ethanol: 500, gas: 3 } },
    { name: 'Zero Gas 0 ppm', input: { temperature: 4, humidity: 80, ethanol: 2, gas: 0 } },
    { name: 'Elevated Volatiles Gas 25 ppm', input: { temperature: 4, humidity: 80, ethanol: 2, gas: 25 } },
    { name: 'Toxic Gas Spike 100 ppm', input: { temperature: 4, humidity: 80, ethanol: 2, gas: 100 } },
  ];

  for (const tc of extremeCases) {
    const t0 = performance.now();
    try {
      const res = await runMLInference(tc.input);
      const dt = performance.now() - t0;

      const rulValid = typeof res.rul_hours === 'number' && Number.isFinite(res.rul_hours) && res.rul_hours >= 0;
      const healthValid = typeof res.health_index === 'number' && Number.isFinite(res.health_index) && res.health_index >= 0 && res.health_index <= 100;
      const statusValid = ['OPTIMAL', 'WARNING', 'CRITICAL'].includes(res.status);
      const alertsValid = Array.isArray(res.alerts);
      const actionsValid = Array.isArray(res.recommended_actions) && res.recommended_actions.length > 0;

      const allValid = rulValid && healthValid && statusValid && alertsValid && actionsValid;
      record(
        'EXTREME_VALS',
        tc.name,
        allValid,
        `RUL=${res.rul_hours}h, Health=${res.health_index}%, Status=${res.status}, Alerts=${res.alerts.length}`,
        dt
      );
    } catch (err: any) {
      record('EXTREME_VALS', tc.name, false, `Threw exception: ${err.message}`);
    }
  }

  // --- SUITE 3: Alert Triggering Matrix Verification ---
  console.log('\n--- SUITE 3: Alert Triggering Matrix Verification ---');
  const alertTestCases = [
    {
      name: 'Critical Fermentation (Ethanol > 35)',
      input: { temperature: 4, humidity: 80, ethanol: 42, gas: 5 },
      expectedSeverity: 'CRITICAL',
      expectedAlertType: 'FERMENTATION_ALERT',
    },
    {
      name: 'Warning Ethanol (18 < Ethanol <= 35)',
      input: { temperature: 4, humidity: 80, ethanol: 25, gas: 5 },
      expectedSeverity: 'WARNING',
      expectedAlertType: 'ETHANOL_WARNING',
    },
    {
      name: 'Critical Temperature Breach (Temp > 25°C)',
      input: { temperature: 28, humidity: 80, ethanol: 5, gas: 5 },
      expectedSeverity: 'CRITICAL',
      expectedAlertType: 'TEMPERATURE_BREACH_CRITICAL',
    },
    {
      name: 'Warning Temperature (8°C < Temp <= 25°C)',
      input: { temperature: 15, humidity: 80, ethanol: 5, gas: 5 },
      expectedSeverity: 'WARNING',
      expectedAlertType: 'TEMPERATURE_WARNING',
    },
    {
      name: 'Freezing Excursion (Temp < -5°C)',
      input: { temperature: -12, humidity: 80, ethanol: 5, gas: 5 },
      expectedSeverity: 'WARNING',
      expectedAlertType: 'FREEZING_EXCURSION',
    },
    {
      name: 'Gas Volatiles Warning (Gas > 20)',
      input: { temperature: 4, humidity: 80, ethanol: 5, gas: 30 },
      expectedSeverity: 'WARNING',
      expectedAlertType: 'GAS_VOLATILES_WARNING',
    },
  ];

  for (const atc of alertTestCases) {
    const t0 = performance.now();
    const res = await runMLInference(atc.input);
    const dt = performance.now() - t0;

    const matchedAlert = res.alerts.find(a => a.type === atc.expectedAlertType);
    const passed = !!matchedAlert && (matchedAlert.severity === atc.expectedSeverity);
    record(
      'ALERT_MATRIX',
      atc.name,
      passed,
      `Alert found: ${!!matchedAlert} (${matchedAlert?.severity}), Overall Status: ${res.status}`,
      dt
    );
  }

  // --- SUITE 4: Sequence Lengths & Shape Adaptations ---
  console.log('\n--- SUITE 4: Sequence Length Variations (0, 1, 5, 10, 50, 100 timesteps) ---');
  const seqCases = [
    {
      name: 'Empty Sequence Array []',
      payload: [],
    },
    {
      name: 'Empty Sequence Object { sequence: [] }',
      payload: { sequence: [] },
    },
    {
      name: 'Single Reading Object (1 timestep)',
      payload: { temperature: 4, humidity: 80, ethanol: 2, gas: 3 },
    },
    {
      name: 'Single Reading Array [1 timestep]',
      payload: [{ temperature: 4, humidity: 80, ethanol: 2, gas: 3 }],
    },
    {
      name: 'Under-length Sequence (3 timesteps - should pad to 10)',
      payload: {
        sequence: [
          { temperature: 4, humidity: 80, ethanol: 2, gas: 3 },
          { temperature: 5, humidity: 81, ethanol: 2.2, gas: 3.1 },
          { temperature: 6, humidity: 82, ethanol: 2.5, gas: 3.3 },
        ],
      },
    },
    {
      name: 'Under-length Sequence (5 timesteps)',
      payload: Array.from({ length: 5 }, (_, i) => ({
        temperature: 4 + i * 0.5,
        humidity: 80 + i,
        ethanol: 2 + i * 0.2,
        gas: 3 + i * 0.3,
      })),
    },
    {
      name: 'Exact Window Length (10 timesteps)',
      payload: Array.from({ length: 10 }, (_, i) => ({
        temperature: 4 + i * 0.2,
        humidity: 80 + i * 0.5,
        ethanol: 2 + i * 0.1,
        gas: 3 + i * 0.2,
      })),
    },
    {
      name: 'Over-length Sequence (25 timesteps - should slice last 10)',
      payload: Array.from({ length: 25 }, (_, i) => ({
        temperature: 4 + i * 0.1,
        humidity: 80 + (i % 5),
        ethanol: 2 + i * 0.05,
        gas: 3 + i * 0.1,
      })),
    },
    {
      name: 'Long Sequence (50 timesteps)',
      payload: {
        telemetry_sequence: Array.from({ length: 50 }, (_, i) => ({
          temperature: 4 + (i * 0.2),
          humidity: 80 + (i % 10),
          ethanol: 2 + (i * 0.5),
          gas: 3 + (i * 0.1),
        })),
      },
    },
    {
      name: 'Massive Sequence (200 timesteps)',
      payload: {
        readings: Array.from({ length: 200 }, (_, i) => ({
          temperature: 5,
          humidity: 80,
          ethanol: 3,
          gas: 4,
        })),
      },
    },
    {
      name: 'Raw Nested Arrays [[4, 80, 2, 3], ...]',
      payload: Array.from({ length: 10 }, (_, i) => [4 + i * 0.1, 80 + i, 2 + i * 0.1, 3 + i * 0.1]),
    },
  ];

  for (const sc of seqCases) {
    const t0 = performance.now();
    try {
      const res = await runMLInference(sc.payload);
      const dt = performance.now() - t0;
      const valid = typeof res.rul_hours === 'number' && Number.isFinite(res.rul_hours) &&
                    typeof res.health_index === 'number' && Number.isFinite(res.health_index);
      record(
        'SEQ_LENGTHS',
        sc.name,
        valid,
        `RUL=${res.rul_hours}h, Health=${res.health_index}%, Status=${res.status}`,
        dt
      );
    } catch (err: any) {
      record('SEQ_LENGTHS', sc.name, false, `Failed: ${err.message}`);
    }
  }

  // --- SUITE 5: Malformed, Missing, and Fuzzed Inputs ---
  console.log('\n--- SUITE 5: Malformed, Missing, and Fuzzed Inputs ---');
  const fuzzCases = [
    { name: 'Empty Payload Object {}', payload: {} },
    { name: 'Null Payload (null)', payload: null },
    { name: 'Undefined Payload (undefined)', payload: undefined },
    { name: 'Primitive String ("temperature=4")', payload: 'temperature=4' },
    { name: 'Primitive Number (12345)', payload: 12345 },
    { name: 'Boolean Payload (true)', payload: true },
    {
      name: 'Missing temperature & humidity',
      payload: { ethanol: 10, gas: 8 },
    },
    {
      name: 'Missing ethanol & gas',
      payload: { temperature: 5, humidity: 75 },
    },
    {
      name: 'All fields null { temp: null, ... }',
      payload: { temperature: null, humidity: null, ethanol: null, gas: null },
    },
    {
      name: 'All fields undefined',
      payload: { temperature: undefined, humidity: undefined, ethanol: undefined, gas: undefined },
    },
    {
      name: 'All fields string types {"temperature": "cold", ...}',
      payload: { temperature: 'cold', humidity: 'damp', ethanol: 'none', gas: 'fresh' },
    },
    {
      name: 'NaN and Infinite values in object',
      payload: { temperature: NaN, humidity: Infinity, ethanol: -Infinity, gas: NaN },
    },
    {
      name: 'Extreme Large Floats (1e20)',
      payload: { temperature: 1e20, humidity: 1e20, ethanol: 1e20, gas: 1e20 },
    },
    {
      name: 'Extreme Negative Floats (-1e20)',
      payload: { temperature: -1e20, humidity: -1e20, ethanol: -1e20, gas: -1e20 },
    },
    {
      name: 'Array of null elements [null, null, null]',
      payload: [null, null, null],
    },
    {
      name: 'Array with strings in nested arrays [["bad", "data"], [null]]',
      payload: [['bad', 'data'], [null, undefined]],
    },
    {
      name: 'Field aliases mixed { temp_c: 4, rh: 80, c2h5oh: 3, air_quality: 5 }',
      payload: { temp_c: 4, rh: 80, c2h5oh: 3, air_quality: 5 },
    },
    {
      name: 'Extra metadata fields { cargo: "beef", vibration: 1.5, location: "Baku" }',
      payload: { temperature: 4, humidity: 80, ethanol: 2, gas: 3, cargo: 'beef', vibration: 1.5, location: 'Baku' },
    },
  ];

  for (const fc of fuzzCases) {
    const t0 = performance.now();
    try {
      const res = await runMLInference(fc.payload);
      const dt = performance.now() - t0;
      const valid = typeof res.rul_hours === 'number' && Number.isFinite(res.rul_hours) &&
                    typeof res.health_index === 'number' && Number.isFinite(res.health_index) &&
                    res.health_index >= 0 && res.health_index <= 100 && res.rul_hours >= 0;
      record(
        'FUZZ_INPUTS',
        fc.name,
        valid,
        `Result: RUL=${res.rul_hours}h, Health=${res.health_index}%, Status=${res.status}`,
        dt
      );
    } catch (err: any) {
      record('FUZZ_INPUTS', fc.name, false, `Engine threw: ${err.message}`);
    }
  }

  // --- SUITE 6: High-Concurrency In-Engine Stress Test ---
  console.log('\n--- SUITE 6: In-Engine Concurrency Stress Test ---');
  const concurrencyLevels = [25, 50, 100, 200];
  for (const c of concurrencyLevels) {
    const t0 = performance.now();
    const tasks = Array.from({ length: c }, (_, i) => {
      const temp = 2 + (i % 30);
      const eth = (i % 50);
      return runMLInference({ temperature: temp, humidity: 80, ethanol: eth, gas: 5 });
    });

    try {
      const startRun = performance.now();
      const resultsConcurrent = await Promise.all(tasks);
      const totalTimeMs = performance.now() - startRun;
      const allValid = resultsConcurrent.every(r =>
        typeof r.rul_hours === 'number' && Number.isFinite(r.rul_hours) && r.rul_hours >= 0 &&
        typeof r.health_index === 'number' && Number.isFinite(r.health_index) && r.health_index >= 0 && r.health_index <= 100
      );
      const avgLatency = (totalTimeMs / c).toFixed(2);
      const qps = ((c / totalTimeMs) * 1000).toFixed(1);
      record(
        'CONCURRENCY_ENGINE',
        `${c} Concurrent Inferences`,
        allValid,
        `Total: ${totalTimeMs.toFixed(1)}ms, Avg Latency: ${avgLatency}ms/req, Throughput: ${qps} inf/sec`,
        totalTimeMs
      );
    } catch (err: any) {
      record('CONCURRENCY_ENGINE', `${c} Concurrent Inferences`, false, `Failed: ${err.message}`);
    }
  }

  // --- SUITE 7: Live HTTP Server API Route Stress & Adversarial Fuzzing ---
  console.log('\n--- SUITE 7: Live HTTP Server API Route Stress & Fuzzing ---');
  let serverProcess: ChildProcess | null = null;
  try {
    const alreadyRunning = await waitForServer(PORT, 2);
    if (!alreadyRunning) {
      serverProcess = await startServer();
    } else {
      console.log(`✓ Detected Next.js production server already running on port ${PORT}\n`);
    }

    // 7.1 GET /api/predict
    {
      const t0 = performance.now();
      const res = await httpRequest(`${BASE_URL}/api/predict`);
      const dt = performance.now() - t0;
      const ok = res.status === 200 && res.json?.status === 'ok' && res.json?.model?.status === 'LOADED_AND_READY';
      record(
        'HTTP_API',
        'GET /api/predict (Metadata Discovery)',
        ok,
        `Status: ${res.status}, Model: ${res.json?.model?.name}, State: ${res.json?.model?.status}`,
        dt
      );
    }

    // 7.2 POST /api/predict Normal
    {
      const t0 = performance.now();
      const payload = JSON.stringify({ temperature: 4, humidity: 82, ethanol: 2, gas: 3 });
      const res = await httpRequest(`${BASE_URL}/api/predict`, { method: 'POST' }, payload);
      const dt = performance.now() - t0;
      const ok = res.status === 200 && res.json?.success === true && res.json?.rul_hours >= 0;
      record(
        'HTTP_API',
        'POST /api/predict Baseline',
        ok,
        `Status: ${res.status}, RUL: ${res.json?.rul_hours}h, Health: ${res.json?.health_index}%, Alerts: ${res.json?.alerts?.length}`,
        dt
      );
    }

    // 7.3 POST /api/predict with Malformed JSON
    {
      const t0 = performance.now();
      const malformedPayload = '{"temperature": 4, "humidity": ';
      const res = await httpRequest(`${BASE_URL}/api/predict`, { method: 'POST' }, malformedPayload);
      const dt = performance.now() - t0;
      const ok = res.status === 400 && res.json?.error_code === 'INVALID_JSON_BODY';
      record(
        'HTTP_API',
        'POST /api/predict Malformed JSON Body -> 400 Bad Request',
        ok,
        `Status: ${res.status}, ErrorCode: ${res.json?.error_code}, Message: ${res.json?.message}`,
        dt
      );
    }

    // 7.4 POST /api/predict with Non-Object Payload (e.g. primitive number/string in JSON)
    {
      const t0 = performance.now();
      const primitivePayload = '"just a plain string"';
      const res = await httpRequest(`${BASE_URL}/api/predict`, { method: 'POST' }, primitivePayload);
      const dt = performance.now() - t0;
      const ok = res.status === 400 && res.json?.error_code === 'INVALID_PAYLOAD';
      record(
        'HTTP_API',
        'POST /api/predict Non-Object JSON Payload -> 400 Bad Request',
        ok,
        `Status: ${res.status}, ErrorCode: ${res.json?.error_code}`,
        dt
      );
    }

    // 7.5 POST /api/predict Sequence Input
    {
      const t0 = performance.now();
      const seqPayload = JSON.stringify({
        sequence: [
          { temperature: 4.0, humidity: 80.0, ethanol: 2.0, gas: 3.0 },
          { temperature: 4.5, humidity: 80.5, ethanol: 2.2, gas: 3.2 },
          { temperature: 5.0, humidity: 81.0, ethanol: 2.5, gas: 3.5 },
        ],
      });
      const res = await httpRequest(`${BASE_URL}/api/predict`, { method: 'POST' }, seqPayload);
      const dt = performance.now() - t0;
      const ok = res.status === 200 && res.json?.success === true && typeof res.json?.rul_hours === 'number';
      record(
        'HTTP_API',
        'POST /api/predict Sequence Payload (3 steps)',
        ok,
        `Status: ${res.status}, RUL: ${res.json?.rul_hours}h, Health: ${res.json?.health_index}%`,
        dt
      );
    }

    // 7.6 POST /api/predict Critical Fermentation Event Trigger
    {
      const t0 = performance.now();
      const critPayload = JSON.stringify({ temperature: 30, humidity: 90, ethanol: 45, gas: 25 });
      const res = await httpRequest(`${BASE_URL}/api/predict`, { method: 'POST' }, critPayload);
      const dt = performance.now() - t0;
      const ok = res.status === 200 && res.json?.status === 'CRITICAL' && res.json?.alerts?.some((a: any) => a.type === 'FERMENTATION_ALERT');
      record(
        'HTTP_API',
        'POST /api/predict Critical Fermentation Alert Triggering',
        ok,
        `Status: ${res.status}, AppStatus: ${res.json?.status}, AlertCount: ${res.json?.alerts?.length}`,
        dt
      );
    }

    // 7.7 HTTP High-Concurrency Stress Test (100 parallel requests)
    {
      console.log('\n--- SUITE 7.7: Live HTTP High-Concurrency Flood (100 parallel HTTP requests) ---');
      const count = 100;
      const latencies: number[] = [];
      const t0 = performance.now();

      const requests = Array.from({ length: count }, async (_, i) => {
        const payload = JSON.stringify({
          temperature: 4 + (i % 25),
          humidity: 80 + (i % 15),
          ethanol: (i % 40),
          gas: 4 + (i % 10),
        });
        const reqStart = performance.now();
        const res = await httpRequest(`${BASE_URL}/api/predict`, { method: 'POST' }, payload);
        const reqDt = performance.now() - reqStart;
        latencies.push(reqDt);
        return res;
      });

      const responses = await Promise.all(requests);
      const totalTimeMs = performance.now() - t0;

      const all200 = responses.every(r => r.status === 200 && r.json?.success === true);
      latencies.sort((a, b) => a - b);
      const minLat = latencies[0].toFixed(1);
      const p50 = latencies[Math.floor(count * 0.50)].toFixed(1);
      const p95 = latencies[Math.floor(count * 0.95)].toFixed(1);
      const p99 = latencies[Math.floor(count * 0.99)].toFixed(1);
      const maxLat = latencies[latencies.length - 1].toFixed(1);
      const qps = ((count / totalTimeMs) * 1000).toFixed(1);

      record(
        'HTTP_CONCURRENCY',
        `100 Parallel HTTP Requests to /api/predict`,
        all200,
        `All 200 OK: ${all200}. Latency: min=${minLat}ms, P50=${p50}ms, P95=${p95}ms, P99=${p99}ms, max=${maxLat}ms. Throughput: ${qps} req/sec`,
        totalTimeMs
      );
    }

  } catch (err: any) {
    record('HTTP_API', 'HTTP Server Error', false, `Failed: ${err.message}`);
  } finally {
    if (serverProcess) {
      console.log('\nTearing down Next.js test server...');
      killProcess(serverProcess);
      console.log('✓ Next.js test server stopped');
    }
  }

  // --- FINAL REPORT & VERDICT SUMMARY ---
  console.log('\n================================================================================');
  console.log('                        SUMMARY & VERDICT TALLY                                 ');
  console.log('================================================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Adversarial Tests: ${total}`);
  console.log(`Passed:                  ${passed} [${((passed / total) * 100).toFixed(1)}%]`);
  console.log(`Failed:                  ${failed} [${((failed / total) * 100).toFixed(1)}%]`);

  if (failed > 0) {
    console.log('\nFAILED TESTS:');
    for (const f of results.filter(r => !r.passed)) {
      console.log(`  ✗ [${f.category}] ${f.name}: ${f.details}`);
    }
    console.log('\nVERDICT: REQUEST_CHANGES');
  } else {
    console.log('\nALL ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS RATE.');
    console.log('VERDICT: APPROVE');
  }
  console.log('================================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
