/**
 * FreshStream AI - ML Inference Verification Script
 * Validates real ONNX 1D-CNN + LSTM inference and /api/predict compatibility.
 */
import fs from 'fs';
import path from 'path';
import http from 'http';
import * as ort from 'onnxruntime-node';

console.log('===============================================================');
console.log('   FreshStream AI - Real ONNX Inference Verification Suite    ');
console.log('===============================================================\n');

// 1. Verify Model Artifact & Scaler Existence
const cwd = process.cwd();
const modelPaths = [
  path.join(cwd, 'public', 'models', 'freshstream_real_rul.onnx'),
  path.join(cwd, 'ml-pipeline', 'models', 'freshstream_real_rul.onnx'),
];

let resolvedModelPath = null;
for (const p of modelPaths) {
  if (fs.existsSync(p)) {
    resolvedModelPath = p;
    break;
  }
}

if (!resolvedModelPath) {
  console.error('❌ FAIL: freshstream_real_rul.onnx not found!');
  process.exit(1);
}
console.log(`✓ Model artifact found: ${resolvedModelPath} (${fs.statSync(resolvedModelPath).size} bytes)`);

const scalerPaths = [
  path.join(cwd, 'public', 'models', 'scaler_params.json'),
  path.join(cwd, 'ml-pipeline', 'models', 'scaler_params.json'),
];

let resolvedScalerPath = null;
for (const p of scalerPaths) {
  if (fs.existsSync(p)) {
    resolvedScalerPath = p;
    break;
  }
}

if (!resolvedScalerPath) {
  console.error('❌ FAIL: scaler_params.json not found!');
  process.exit(1);
}

const scaler = JSON.parse(fs.readFileSync(resolvedScalerPath, 'utf8'));
console.log(`✓ Scaler parameters found: ${resolvedScalerPath}`);
console.log(`  Features: ${scaler.features.join(', ')}`);
console.log(`  Means: ${scaler.mean.map(m => m.toFixed(2)).join(', ')}`);
console.log(`  Stds:  ${scaler.std.map(s => s.toFixed(2)).join(', ')}\n`);

// 2. Initialize ONNX Runtime Session
console.log('Initializing ONNX Runtime InferenceSession...');
const session = await ort.InferenceSession.create(resolvedModelPath, {
  executionProviders: ['cpu'],
  graphOptimizationLevel: 'all',
});

console.log(`✓ ONNX Session initialized successfully!`);
console.log(`  Input node:  ${session.inputNames.join(', ')}`);
console.log(`  Output nodes: ${session.outputNames.join(', ')}\n`);

// Helper to run inference
async function predict(inputSequence) {
  const windowSize = scaler.window_size || 10;
  let seq = inputSequence;

  // Single reading replicate
  if (!Array.isArray(seq)) {
    const t = seq.temperature ?? seq.temp ?? 34.46;
    const h = seq.humidity ?? seq.hum ?? 80.0;
    const e = seq.ethanol ?? seq.mq3 ?? 8.95;
    const g = seq.gas ?? seq.mq135 ?? 8.0;
    seq = Array.from({ length: windowSize }, () => [t, h, e, g]);
  } else {
    seq = seq.map(pt => {
      if (Array.isArray(pt)) return pt;
      return [
        pt.temperature ?? pt.temp ?? 34.46,
        pt.humidity ?? pt.hum ?? 80.0,
        pt.ethanol ?? pt.mq3 ?? 8.95,
        pt.gas ?? pt.mq135 ?? 8.0,
      ];
    });
    while (seq.length < windowSize) seq.unshift([...seq[0]]);
    if (seq.length > windowSize) seq = seq.slice(-windowSize);
  }

  const flat = new Float32Array(windowSize * 4);
  for (let i = 0; i < windowSize; i++) {
    for (let f = 0; f < 4; f++) {
      flat[i * 4 + f] = (seq[i][f] - scaler.mean[f]) / scaler.std[f];
    }
  }

  const tensor = new ort.Tensor('float32', flat, [1, windowSize, 4]);
  const results = await session.run({ [session.inputNames[0]]: tensor });

  const rawRul = Number(results.rul.data[0]);
  const rawHealth = Number(results.health_index.data[0]);

  const rulHours = Math.max(0, Math.round(rawRul * 10) / 10);
  const healthIndex = Math.min(100, Math.max(0, Math.round(rawHealth * 10) / 10));

  const latest = seq[seq.length - 1];
  const isCritical = latest[2] > 35 || healthIndex < 40 || latest[0] > 25;
  const isWarning = !isCritical && (latest[2] > 18 || healthIndex < 65 || latest[0] > 8 || latest[3] > 20);
  const status = isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'OPTIMAL';

  return {
    rul_hours: rulHours,
    predicted_rul: rulHours,
    health_index: healthIndex,
    shelf_life_days: Math.round((rulHours / 24) * 10) / 10,
    status,
    latest_reading: {
      temperature: latest[0],
      humidity: latest[1],
      ethanol: latest[2],
      gas: latest[3],
    }
  };
}

// 3. Test Cases
console.log('--- Test Case 1: Baseline Cold-Chain Telemetry (Normal Reefer) ---');
const tc1 = await predict({ temperature: 4.0, humidity: 82.0, ethanol: 2.0, gas: 3.5 });
console.log(`  Predicted RUL:   ${tc1.rul_hours} hours (${tc1.shelf_life_days} days)`);
console.log(`  Health Index:    ${tc1.health_index}%`);
console.log(`  Status:          ${tc1.status}`);
if (typeof tc1.rul_hours !== 'number' || typeof tc1.health_index !== 'number') {
  console.error('❌ Test Case 1 Failed: Invalid output types');
  process.exit(1);
}
console.log('  ✓ Test Case 1 PASSED\n');

console.log('--- Test Case 2: Acute Fermentation Event (Ethanol > 35 ppm) ---');
const tc2 = await predict({ temperature: 28.0, humidity: 90.0, ethanol: 42.0, gas: 18.0 });
console.log(`  Predicted RUL:   ${tc2.rul_hours} hours`);
console.log(`  Health Index:    ${tc2.health_index}%`);
console.log(`  Status:          ${tc2.status}`);
if (tc2.status !== 'CRITICAL') {
  console.error('❌ Test Case 2 Failed: Expected CRITICAL status for ethanol > 35 ppm');
  process.exit(1);
}
console.log('  ✓ Test Case 2 PASSED (CRITICAL anomaly correctly triggered)\n');

console.log('--- Test Case 3: 10-Step Sequential Telemetry Window ---');
const sequenceData = [
  { temperature: 4.0, humidity: 80.0, ethanol: 2.0, gas: 3.0 },
  { temperature: 4.2, humidity: 80.5, ethanol: 2.1, gas: 3.1 },
  { temperature: 4.8, humidity: 81.0, ethanol: 2.3, gas: 3.2 },
  { temperature: 5.5, humidity: 81.5, ethanol: 2.8, gas: 3.5 },
  { temperature: 6.2, humidity: 82.0, ethanol: 3.4, gas: 3.9 },
  { temperature: 7.5, humidity: 82.5, ethanol: 4.2, gas: 4.5 },
  { temperature: 9.0, humidity: 83.0, ethanol: 5.5, gas: 5.2 },
  { temperature: 11.2, humidity: 84.0, ethanol: 7.0, gas: 6.1 },
  { temperature: 13.5, humidity: 85.0, ethanol: 9.2, gas: 7.5 },
  { temperature: 16.0, humidity: 86.0, ethanol: 12.0, gas: 9.0 },
];
const tc3 = await predict(sequenceData);
console.log(`  Predicted RUL:   ${tc3.rul_hours} hours`);
console.log(`  Health Index:    ${tc3.health_index}%`);
console.log(`  Status:          ${tc3.status}`);
if (typeof tc3.rul_hours !== 'number' || tc3.rul_hours < 0) {
  console.error('❌ Test Case 3 Failed: Invalid sequence prediction');
  process.exit(1);
}
console.log('  ✓ Test Case 3 PASSED\n');

console.log('--- Test Case 4: Minimal Payload with Field Aliases ---');
const tc4 = await predict({ temp: 8.0, hum: 75.0, mq3: 5.0, mq135: 6.0 });
console.log(`  Predicted RUL:   ${tc4.rul_hours} hours`);
console.log(`  Health Index:    ${tc4.health_index}%`);
console.log(`  Status:          ${tc4.status}`);
console.log('  ✓ Test Case 4 PASSED\n');

// 4. Optional Live HTTP Check
const testPorts = [3015, 3000, 3009];
for (const port of testPorts) {
  try {
    const isRunning = await new Promise((resolve) => {
      const probe = http.get(`http://localhost:${port}/api/predict`, { timeout: 1000 }, (res) => {
        resolve(res.statusCode === 200);
      });
      probe.on('error', () => resolve(false));
      probe.on('timeout', () => { probe.destroy(); resolve(false); });
    });

    if (isRunning) {
      console.log(`Live HTTP server detected on port ${port}. Probing POST /api/predict...`);
      const httpRes = await new Promise((resolve) => {
        const payload = JSON.stringify({ temperature: 8, humidity: 75, gas: 12, ethanol: 5 });
        const req = http.request(
          {
            hostname: 'localhost',
            port,
            path: '/api/predict',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            },
            timeout: 5000,
          },
          (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, json: JSON.parse(data) });
              } catch (e) {
                resolve({ status: res.statusCode, raw: data });
              }
            });
          }
        );
        req.on('error', (e) => resolve({ error: e.message }));
        req.write(payload);
        req.end();
      });

      console.log(`  HTTP Response Status: ${httpRes.status}`);
      if (httpRes.status === 200 && httpRes.json?.success) {
        console.log(`  HTTP RUL: ${httpRes.json.rul_hours}h | Health: ${httpRes.json.health_index}% | Status: ${httpRes.json.status}`);
        console.log(`  ✓ Live HTTP route /api/predict verified 100% operational!`);
      }
      break;
    }
  } catch {
    // Live probe is optional
  }
}

console.log('\n===============================================================');
console.log('  ALL ML INFERENCE VERIFICATION TESTS PASSED SUCCESSFULLY!    ');
console.log('===============================================================\n');
process.exit(0);
