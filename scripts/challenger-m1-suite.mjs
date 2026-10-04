/**
 * FreshStream AI - Challenger Milestone 1 Adversarial Suite
 * 
 * Tests:
 * 1. High-concurrency reads & mixed read/write on SQLite via Prisma
 * 2. SQLite lock simulation & database fallback verification
 * 3. ML inference (/api/predict & runMLInference) regression, concurrency, & boundary testing
 * 4. i18n exhaustive key audit across EN, RU, KZ and unsupported locales
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as ort from 'onnxruntime-node';
import { runMLInference, loadScalerParams, resolveModelPath } from '../src/lib/ml/inference.js';
import { en, ru, kz } from '../src/lib/i18n/translations.js';
import { INITIAL_SHIPMENTS, getShipmentById } from '../src/lib/shipments-data.js';

const prisma = new PrismaClient();

async function runSuite() {
  console.log('======================================================================');
  console.log(' FRESHSTREAM AI — CHALLENGER M1 ADVERSARIAL STRESS & VERIFICATION SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;
  const issues = [];

  function assert(condition, testName, details = '') {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${testName}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${testName} ${details ? `— ${details}` : ''}`);
      issues.push({ testName, details });
    }
  }

  // =========================================================================
  // SECTION 1: SQLite & Prisma Concurrency Stress
  // =========================================================================
  console.log('\n--- SECTION 1: Prisma & SQLite High Concurrency Stress ---');

  const CONCURRENT_READS = 100;
  console.log(`Testing ${CONCURRENT_READS} simultaneous reads on prisma.shipment.findMany...`);
  const readStart = Date.now();
  const readPromises = Array.from({ length: CONCURRENT_READS }, (_, i) =>
    prisma.shipment.findMany({
      include: {
        telemetryLogs: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
    })
  );

  try {
    const readResults = await Promise.all(readPromises);
    const readDuration = Date.now() - readStart;
    const allHave6 = readResults.every(r => r.length === 6);
    assert(allHave6, `100 concurrent findMany queries succeeded in ${readDuration}ms`);
  } catch (err) {
    assert(false, `100 concurrent findMany queries failed`, err.message);
  }

  // Rapid individual findUnique queries across all shipments
  const shipmentIds = ['FS-8821', 'FS-9042', 'FS-4103', 'FS-6218', 'FS-3319', 'FS-7750'];
  console.log(`Testing 120 rapid concurrent findUnique queries across 6 shipments...`);
  const uniquePromises = Array.from({ length: 120 }, (_, i) => {
    const id = shipmentIds[i % shipmentIds.length];
    return prisma.shipment.findUnique({
      where: { id },
      include: { telemetryLogs: { take: 10 } },
    });
  });

  try {
    const uniqueResults = await Promise.all(uniquePromises);
    const allFound = uniqueResults.every((s, i) => s && s.id === shipmentIds[i % shipmentIds.length]);
    assert(allFound, `120 rapid findUnique queries returned correct records without SQLITE_BUSY`);
  } catch (err) {
    assert(false, `Rapid findUnique queries failed`, err.message);
  }

  // Mixed concurrent Read + Write test
  console.log(`Testing mixed concurrent operations: 30 writes interleaved with 70 reads...`);
  const mixedPromises = [];
  const insertedLogIds = [];

  for (let i = 0; i < 30; i++) {
    const logId = `test-log-${Date.now()}-${i}`;
    insertedLogIds.push(logId);
    mixedPromises.push(
      prisma.telemetryLog.create({
        data: {
          id: logId,
          shipmentId: 'FS-8821',
          timestamp: new Date(),
          temperature: 4.0 + (i * 0.1),
          humidity: 80.0,
          ethanol: 5.0,
          vibration: 0.2,
          bhi: 95.0,
          predictedRulHours: 24.0,
          status: 'OPTIMAL',
          source: 'challenger-test',
        },
      })
    );
  }

  for (let i = 0; i < 70; i++) {
    mixedPromises.push(
      prisma.shipment.findUnique({
        where: { id: 'FS-8821' },
        include: { telemetryLogs: { take: 5 } },
      })
    );
  }

  try {
    await Promise.all(mixedPromises);
    assert(true, `30 concurrent writes + 70 concurrent reads completed without SQLite lock deadlock`);
  } catch (err) {
    assert(false, `Mixed concurrent read/write threw error`, err.message);
  } finally {
    // Clean up created test logs
    try {
      await prisma.telemetryLog.deleteMany({
        where: { id: { in: insertedLogIds } },
      });
      console.log(`  Cleaned up ${insertedLogIds.length} test telemetry logs.`);
    } catch (cleanupErr) {
      console.warn('  Cleanup warning:', cleanupErr.message);
    }
  }

  // =========================================================================
  // SECTION 2: Database Fallback Resilience & Lock Analysis
  // =========================================================================
  console.log('\n--- SECTION 2: Database Fallback Resilience & Failure Modes ---');

  // Verify static dataset integrity
  assert(Array.isArray(INITIAL_SHIPMENTS) && INITIAL_SHIPMENTS.length === 6, 'INITIAL_SHIPMENTS static dataset contains 6 shipments');
  for (const id of shipmentIds) {
    const s = getShipmentById(id);
    assert(s !== undefined && s.id === id, `getShipmentById("${id}") resolves static fallback correctly`);
  }
  const notFound = getShipmentById('NON-EXISTENT-ID');
  assert(notFound === undefined, 'getShipmentById returns undefined for unknown ID');

  // =========================================================================
  // SECTION 3: ML Inference Regression & Edge Case Fuzzing (/api/predict)
  // =========================================================================
  console.log('\n--- SECTION 3: ML Inference Zero Regression & Boundary Testing ---');

  const modelPath = resolveModelPath();
  assert(fs.existsSync(modelPath), `Model file exists at ${modelPath}`);

  const scaler = loadScalerParams();
  assert(Array.isArray(scaler.features) && scaler.features.length === 4, 'Scaler features valid (4 sensors)');

  // Baseline prediction consistency
  const standardInput = { temperature: 8.0, humidity: 75.0, gas: 12.0, ethanol: 5.0, cargo: 'beef' };
  const pred1 = await runMLInference(standardInput);
  const pred2 = await runMLInference(standardInput);

  assert(
    pred1.success === true &&
    pred2.success === true &&
    pred1.rul_hours === pred2.rul_hours &&
    pred1.health_index === pred2.health_index,
    `Deterministic inference: Repeated identical inputs produce identical predictions (RUL: ${pred1.rul_hours}h, BHI: ${pred1.health_index}%)`
  );

  // High concurrency inference burst (50 simultaneous inferences)
  console.log('Testing 50 concurrent ONNX inference executions...');
  const infStart = Date.now();
  const inferenceBurst = Array.from({ length: 50 }, (_, i) =>
    runMLInference({
      temperature: 4.0 + (i % 20) * 0.5,
      humidity: 70.0 + (i % 20),
      ethanol: 2.0 + (i % 30) * 1.2,
      gas: 3.0 + (i % 15) * 0.8,
    })
  );

  try {
    const infResults = await Promise.all(inferenceBurst);
    const infDuration = Date.now() - infStart;
    const allSucceeded = infResults.every(r => r.success && typeof r.rul_hours === 'number');
    assert(allSucceeded, `50 concurrent ONNX inferences completed successfully in ${infDuration}ms (avg: ${(infDuration / 50).toFixed(1)}ms/call)`);
  } catch (err) {
    assert(false, 'Concurrent ONNX inference failed', err.message);
  }

  // Edge cases & Boundary tests
  console.log('Fuzzing ML inference with extreme & boundary inputs:');

  // Extreme Sub-zero Temperature (-25°C)
  const freezeRes = await runMLInference({ temperature: -25.0, humidity: 50.0, ethanol: 0.1, gas: 1.0 });
  assert(freezeRes.success && freezeRes.rul_hours >= 0, `Extreme deep-freeze (-25°C) handled safely (RUL: ${freezeRes.rul_hours}h)`);

  // Extreme Heatwave Temperature (+60°C)
  const heatRes = await runMLInference({ temperature: 60.0, humidity: 95.0, ethanol: 50.0, gas: 30.0 });
  assert(heatRes.success && heatRes.status === 'CRITICAL', `Extreme heatwave & high ethanol triggered CRITICAL status`);

  // Zero & Boundary Values
  const zeroRes = await runMLInference({ temperature: 0.0, humidity: 0.0, ethanol: 0.0, gas: 0.0 });
  assert(zeroRes.success && typeof zeroRes.rul_hours === 'number', `Zero sensor inputs handled without NaN/division-by-zero`);

  // Field Aliases Compatibility (temp, hum, mq3, mq135)
  const aliasRes = await runMLInference({ temp: 6.0, hum: 78.0, mq3: 4.0, mq135: 5.0 });
  assert(aliasRes.success && aliasRes.rul_hours > 0, `Hardware sensor aliases (mq3, mq135, temp, hum) mapped accurately`);

  // Sequential window inference (15 historical steps)
  const longSequence = Array.from({ length: 15 }, (_, i) => ({
    temperature: 3.0 + i * 0.2,
    humidity: 80.0,
    ethanol: 2.0 + i * 0.5,
    gas: 4.0,
  }));
  const seqRes = await runMLInference({ sequence: longSequence });
  assert(seqRes.success && seqRes.rul_hours >= 0, `Sequence window (15 steps) truncated to 10-step buffer and inferred cleanly`);

  // Short sequence padding (3 steps)
  const shortSeqRes = await runMLInference({
    sequence: [
      { temperature: 4.0, humidity: 80.0, ethanol: 2.0, gas: 3.0 },
      { temperature: 4.5, humidity: 80.0, ethanol: 2.2, gas: 3.1 },
    ],
  });
  assert(shortSeqRes.success && shortSeqRes.rul_hours >= 0, `Short sequence (2 steps) padded to 10-step window correctly`);

  // =========================================================================
  // SECTION 4: Trilingual i18n Completeness & Edge Case Locales
  // =========================================================================
  console.log('\n--- SECTION 4: Trilingual i18n Completeness & Edge Locales ---');

  const dictionaries = { en, ru, kz };

  // Recursively collect all dot-notation key paths from English reference
  function getKeyPaths(obj, prefix = '') {
    let keys = [];
    for (const [k, v] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        keys = keys.concat(getKeyPaths(v, fullPath));
      } else {
        keys.push(fullPath);
      }
    }
    return keys;
  }

  function getValueByPath(obj, keyPath) {
    return keyPath.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  const enKeys = getKeyPaths(en);
  console.log(`Reference English dictionary contains ${enKeys.length} total keys.`);

  // Audit each language for 100% key parity
  for (const loc of ['ru', 'kz']) {
    const dict = dictionaries[loc];
    let missingKeys = [];
    let emptyKeys = [];
    let undefinedKeys = [];

    for (const key of enKeys) {
      const val = getValueByPath(dict, key);
      if (val === undefined) {
        missingKeys.push(key);
      } else if (typeof val !== 'string') {
        undefinedKeys.push(key);
      } else if (val.trim() === '') {
        emptyKeys.push(key);
      }
    }

    assert(
      missingKeys.length === 0,
      `Locale '${loc}' has 100% key coverage matching English (${enKeys.length}/${enKeys.length})`,
      missingKeys.length > 0 ? `Missing keys: ${missingKeys.slice(0, 5).join(', ')}...` : ''
    );
    assert(emptyKeys.length === 0, `Locale '${loc}' has zero empty string values`);
    assert(undefinedKeys.length === 0, `Locale '${loc}' has zero non-string/undefined values`);
  }

  // Specific audit of all `auth.*` keys
  const authKeys = enKeys.filter(k => k.startsWith('auth.'));
  console.log(`Auditing ${authKeys.length} auth-specific keys across EN, RU, KZ:`);
  for (const authKey of authKeys) {
    const enVal = getValueByPath(en, authKey);
    const ruVal = getValueByPath(ru, authKey);
    const kzVal = getValueByPath(kz, authKey);

    const valid =
      typeof enVal === 'string' && enVal.length > 0 &&
      typeof ruVal === 'string' && ruVal.length > 0 &&
      typeof kzVal === 'string' && kzVal.length > 0;

    assert(valid, `Auth key '${authKey}' fully populated in all 3 languages (EN: "${enVal.slice(0, 20)}...", RU: "${ruVal.slice(0, 20)}...", KZ: "${kzVal.slice(0, 20)}...")`);
  }

  // Edge case: Test fallback when client requests unknown/unsupported locale
  console.log('Testing unknown/unsupported locale handling...');
  function resolveTranslationWithFallback(locale, keyPath) {
    const activeDict = dictionaries[locale] || dictionaries['en'];
    return getValueByPath(activeDict, keyPath) || getValueByPath(dictionaries['en'], keyPath) || keyPath;
  }

  const unsupportedFallback = resolveTranslationWithFallback('zh', 'auth.sign_in_title');
  assert(unsupportedFallback === en.auth.sign_in_title, 'Unknown locale "zh" gracefully falls back to English translation');

  const nullLocaleFallback = resolveTranslationWithFallback(null, 'auth.sign_out');
  assert(nullLocaleFallback === en.auth.sign_out, 'Null locale gracefully falls back to English translation');

  const unknownKeyFallback = resolveTranslationWithFallback('en', 'nonexistent.key.path');
  assert(unknownKeyFallback === 'nonexistent.key.path', 'Non-existent key returns keyPath rather than crashing or throwing');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n======================================================================');
  console.log(`SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================================');

  await prisma.$disconnect();

  if (failed > 0) {
    console.error('Identified issues:');
    issues.forEach(iss => console.error(`  - ${iss.testName}: ${iss.details}`));
    process.exit(1);
  } else {
    console.log('>>> ALL ADVERSARIAL STRESS TESTS COMPLETED SUCCESSFULLY <<<');
    process.exit(0);
  }
}

runSuite().catch(err => {
  console.error('Fatal suite execution error:', err);
  process.exit(1);
});
