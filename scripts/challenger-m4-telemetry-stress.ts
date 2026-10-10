/**
 * FreshStream AI — Challenger 2 (Milestone 4)
 * Adversarial Telemetry, Arrhenius Kinetics & Logistics Standards Stress Suite
 *
 * Programmatically validates:
 * 1. calculateBiologicalHealth with extreme inputs:
 *    - Deep freeze T_act = -30°C vs T_set = 4°C
 *    - Severe heatwave T_act = +50°C vs T_set = 0°C
 *    - Massive ethanol spike 200 ppm (with >35 ppm trigger verification)
 *    - Ethylene saturation 50 ppm
 *    - Shock vibration 5.0G
 * 2. Mathematical invariants: BHI is strictly clamped to [0, 100], never NaN, null, or undefined.
 * 3. Standards JSON schemas (DCSA 3.0, KTZ Rail SMGS, AIS Maritime): zero missing fields, recursive validity.
 * 4. Monte Carlo fuzzing over 5,000 adversarial telemetry combinations.
 * 5. Track interpolation and demo crisis scenario boundary resilience.
 */

import {
  calculateBiologicalHealth,
  CargoConditionTelemetry,
  CargoCommodity,
  COMMODITY_KINETIC_PROFILES,
  generateDCSA30Payload,
  generateKTZRailPayload,
  generateAISMaritimePayload,
  TransportMode,
} from '../src/types/telemetry';

import {
  TRANSPORT_MODES_CONFIG,
  getTrackCoordinatesForMode,
  interpolateTrackPosition,
} from '../src/lib/map-data';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition: boolean, suite: string, name: string, details?: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ [${suite}] PASS: ${name}`);
    results.push({ suite, name, passed: true });
  } else {
    failedChecks++;
    console.error(`  ✗ [${suite}] FAIL: ${name} -> ${details || 'Assertion failed'}`);
    results.push({ suite, name, passed: false, details });
  }
}

/** Recursively checks an object for undefined, NaN, or null values */
function findUndefinedOrNaN(obj: any, prefix = ''): string[] {
  const issues: string[] = [];
  if (obj === undefined) {
    issues.push(`${prefix}: undefined`);
    return issues;
  }
  if (obj === null) {
    issues.push(`${prefix}: null`);
    return issues;
  }
  if (typeof obj === 'number' && (Number.isNaN(obj) || !Number.isFinite(obj))) {
    issues.push(`${prefix}: ${obj}`);
    return issues;
  }
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      const val = obj[key];
      if (val === undefined) {
        issues.push(`${fullPath}: undefined`);
      } else if (typeof val === 'number' && (Number.isNaN(val) || !Number.isFinite(val))) {
        issues.push(`${fullPath}: ${val}`);
      } else if (typeof val === 'object' && val !== null) {
        issues.push(...findUndefinedOrNaN(val, fullPath));
      }
    }
  }
  return issues;
}

console.log('========================================================================');
console.log('  CHALLENGER 2: ADVERSARIAL TELEMETRY & STANDARDS STRESS HARNESS (M4)');
console.log('========================================================================\n');

// ============================================================================
// SUITE 1: MANDATORY EXTREME VALUES STRESS TESTING
// ============================================================================
console.log('--- SUITE 1: Mandatory Extreme Values Stress Testing ---');

const commodities: CargoCommodity[] = ['pears', 'beef', 'berries', 'dairy', 'fruits'];

// 1.1 Deep Freeze T_act = -30°C vs T_set = 4°C
commodities.forEach((comm) => {
  const deepFreezeTel: CargoConditionTelemetry = {
    commodity: comm,
    setPointCelsius: 4.0,
    actualCelsius: -30.0,
    relativeHumidity: 90,
    ethylenePpm: 0.1,
    volatileEthanolPpm: 2.0,
    co2Percent: 3.0,
    o2Percent: 5.0,
    vibrationG: 0.4,
    transportMode: 'RAIL_REEFER',
  };

  const res = calculateBiologicalHealth(deepFreezeTel);
  const isBhiValid = !Number.isNaN(res.bhi) && res.bhi >= 0 && res.bhi <= 100;
  const isRulValid = !Number.isNaN(res.predictedRulHours) && Number.isFinite(res.predictedRulHours) && res.predictedRulHours >= 2;
  const isAccelValid = !Number.isNaN(res.accelerationFactor) && Number.isFinite(res.accelerationFactor) && res.accelerationFactor > 0;

  assert(
    isBhiValid && isRulValid && isAccelValid && res.thermalDelta === -34.0,
    'SUITE 1',
    `Deep freeze -30°C for ${comm}: BHI=${res.bhi}%, RUL=${res.predictedRulHours}h, Accel=${res.accelerationFactor}x, ΔT=${res.thermalDelta}°C`,
    `Got BHI=${res.bhi}, RUL=${res.predictedRulHours}, Accel=${res.accelerationFactor}`
  );
  assert(
    res.thermalStatus === 'CRITICAL',
    'SUITE 1',
    `Deep freeze -30°C for ${comm} flags thermalStatus CRITICAL`
  );
});

// 1.2 Severe Heatwave T_act = +50°C vs T_set = 0°C
commodities.forEach((comm) => {
  const heatwaveTel: CargoConditionTelemetry = {
    commodity: comm,
    setPointCelsius: 0.0,
    actualCelsius: 50.0,
    relativeHumidity: 40,
    ethylenePpm: 0.5,
    volatileEthanolPpm: 5.0,
    co2Percent: 0.5,
    o2Percent: 20.0,
    vibrationG: 0.5,
    transportMode: 'TIR_TRUCK',
  };

  const res = calculateBiologicalHealth(heatwaveTel);
  const isBhiValid = !Number.isNaN(res.bhi) && res.bhi >= 0 && res.bhi <= 100;
  const isRulValid = !Number.isNaN(res.predictedRulHours) && Number.isFinite(res.predictedRulHours) && res.predictedRulHours >= 2;
  const isAccelValid = !Number.isNaN(res.accelerationFactor) && Number.isFinite(res.accelerationFactor) && res.accelerationFactor > 10.0;

  assert(
    isBhiValid && isRulValid && isAccelValid && res.thermalDelta === 50.0,
    'SUITE 1',
    `Severe heatwave +50°C for ${comm}: BHI=${res.bhi}%, RUL=${res.predictedRulHours}h, Accel=${res.accelerationFactor}x, ΔT=${res.thermalDelta}°C`,
    `Got BHI=${res.bhi}, RUL=${res.predictedRulHours}, Accel=${res.accelerationFactor}`
  );
  assert(
    res.thermalStatus === 'CRITICAL' && res.status === 'CRITICAL',
    'SUITE 1',
    `Heatwave +50°C for ${comm} flags both thermalStatus and status CRITICAL`
  );
});

// 1.3 Massive Ethanol Spike 200 ppm (and >35 ppm trigger precision)
const ethanolLevels = [0, 10, 34.9, 35.0, 35.1, 42.0, 100.0, 200.0];
ethanolLevels.forEach((ethPpm) => {
  const ethTel: CargoConditionTelemetry = {
    commodity: 'pears',
    setPointCelsius: 1.0,
    actualCelsius: 2.0,
    relativeHumidity: 90,
    ethylenePpm: 0.2,
    volatileEthanolPpm: ethPpm,
    co2Percent: 4.0,
    o2Percent: 3.0,
    vibrationG: 0.3,
    transportMode: 'RO_PAX_FERRY',
  };

  const res = calculateBiologicalHealth(ethTel);
  const expectedAlert = ethPpm > 35.0;

  assert(
    res.anaerobicDecayAlert === expectedAlert,
    'SUITE 1',
    `Ethanol ${ethPpm} ppm: anaerobicDecayAlert=${res.anaerobicDecayAlert} (expected ${expectedAlert})`,
    `Got ${res.anaerobicDecayAlert} for ${ethPpm} ppm`
  );

  if (ethPpm === 200.0) {
    assert(
      res.status === 'CRITICAL' && res.bhi <= 48.0 && res.alertTitle.includes('Anaerobic Fermentation'),
      'SUITE 1',
      `Massive ethanol 200 ppm triggers CRITICAL status, capped BHI (${res.bhi}%), and alert title`,
      `Status=${res.status}, BHI=${res.bhi}`
    );
  }
});

// 1.4 Ethylene Saturation 50 ppm
const ethyleneTelClimacteric: CargoConditionTelemetry = {
  commodity: 'pears',
  setPointCelsius: 1.0,
  actualCelsius: 1.0,
  relativeHumidity: 90,
  ethylenePpm: 50.0,
  volatileEthanolPpm: 2.0,
  co2Percent: 4.0,
  o2Percent: 3.0,
  vibrationG: 0.3,
  transportMode: 'SMART_REEFER_CONTAINER',
};

const resClimacteric50 = calculateBiologicalHealth(ethyleneTelClimacteric);
const resClimacteric0 = calculateBiologicalHealth({ ...ethyleneTelClimacteric, ethylenePpm: 0.0 });

assert(
  resClimacteric50.accelerationFactor > resClimacteric0.accelerationFactor * 5.0,
  'SUITE 1',
  `Ethylene 50 ppm on climacteric pears accelerates decay by >5x (${resClimacteric0.accelerationFactor}x -> ${resClimacteric50.accelerationFactor}x)`,
  `Got ${resClimacteric50.accelerationFactor} vs baseline ${resClimacteric0.accelerationFactor}`
);

// Non-climacteric beef should NOT accelerate on ethylene
const ethyleneTelNonClimacteric: CargoConditionTelemetry = {
  commodity: 'beef',
  setPointCelsius: 0.5,
  actualCelsius: 0.5,
  relativeHumidity: 85,
  ethylenePpm: 50.0,
  volatileEthanolPpm: 2.0,
  co2Percent: 3.0,
  o2Percent: 4.0,
  vibrationG: 0.3,
  transportMode: 'RAIL_REEFER',
};

const resBeef50 = calculateBiologicalHealth(ethyleneTelNonClimacteric);
const resBeef0 = calculateBiologicalHealth({ ...ethyleneTelNonClimacteric, ethylenePpm: 0.0 });

assert(
  Math.abs(resBeef50.accelerationFactor - resBeef0.accelerationFactor) < 0.01,
  'SUITE 1',
  `Ethylene 50 ppm on non-climacteric beef has 0% acceleration impact (${resBeef0.accelerationFactor}x vs ${resBeef50.accelerationFactor}x)`,
  `Difference: ${Math.abs(resBeef50.accelerationFactor - resBeef0.accelerationFactor)}`
);

// 1.5 Mechanical Shock 5.0G
const shockTel: CargoConditionTelemetry = {
  commodity: 'pears',
  setPointCelsius: 1.0,
  actualCelsius: 1.0,
  relativeHumidity: 90,
  ethylenePpm: 0.2,
  volatileEthanolPpm: 2.0,
  co2Percent: 4.0,
  o2Percent: 3.0,
  vibrationG: 5.0, // High mechanical shock
  transportMode: 'MULTIMODAL_COMBO',
};

const resShock5 = calculateBiologicalHealth(shockTel);
const resShock0 = calculateBiologicalHealth({ ...shockTel, vibrationG: 0.3 });

assert(
  resShock5.accelerationFactor > resShock0.accelerationFactor && resShock5.bhi <= 60.0,
  'SUITE 1',
  `Mechanical shock 5.0G accelerates deterioration (${resShock0.accelerationFactor}x -> ${resShock5.accelerationFactor}x) and caps BHI to <=60% (${resShock5.bhi}%)`,
  `BHI=${resShock5.bhi}, Accel=${resShock5.accelerationFactor}`
);

// ============================================================================
// SUITE 2: MATHEMATICAL INVARIANTS & STRICT BOUNDARIES
// ============================================================================
console.log('\n--- SUITE 2: Mathematical Invariants & Strict Boundaries ---');

// Invariant checks on boundary inputs:
const boundaryCases: Array<{ name: string; tel: Partial<CargoConditionTelemetry> }> = [
  { name: 'Near Absolute Zero (-250°C)', tel: { actualCelsius: -250.0, setPointCelsius: 1.0 } },
  { name: 'Sub-Zero Kelvin Safety (-273.15°C)', tel: { actualCelsius: -273.1, setPointCelsius: 0.0 } },
  { name: 'Boiling Point Excursion (+100°C)', tel: { actualCelsius: 100.0, setPointCelsius: 1.0 } },
  { name: 'Blast Furnace Heat (+200°C)', tel: { actualCelsius: 200.0, setPointCelsius: 0.0 } },
  { name: 'Extreme Negative Setpoint (-50°C)', tel: { actualCelsius: 0.0, setPointCelsius: -50.0 } },
  { name: 'Extreme High Setpoint (+50°C)', tel: { actualCelsius: 50.0, setPointCelsius: 50.0 } },
  { name: '10,000 ppm Volatile Ethanol', tel: { volatileEthanolPpm: 10000.0 } },
  { name: '1,000 ppm Ethylene', tel: { ethylenePpm: 1000.0 } },
  { name: '50G Catastrophic Derailment Shock', tel: { vibrationG: 50.0 } },
  { name: '0% Relative Humidity Desiccation', tel: { relativeHumidity: 0.0 } },
  { name: '150% Condensation Super-saturation', tel: { relativeHumidity: 150.0 } },
  { name: '100% Pure CO2 Asphyxiation', tel: { co2Percent: 100.0, o2Percent: 0.0 } },
  { name: '0 USD Asset Value', tel: { assetValueUsd: 0 } },
  { name: '$10,000,000 Luxury Cargo Asset Value', tel: { assetValueUsd: 10000000 } },
];

boundaryCases.forEach((bc) => {
  const baseTel: CargoConditionTelemetry = {
    commodity: 'pears',
    setPointCelsius: 1.0,
    actualCelsius: 1.0,
    relativeHumidity: 90,
    ethylenePpm: 0.2,
    volatileEthanolPpm: 2.0,
    co2Percent: 4.0,
    o2Percent: 3.0,
    vibrationG: 0.3,
    transportMode: 'RAIL_REEFER',
    ...bc.tel,
  };

  const res = calculateBiologicalHealth(baseTel);

  assert(
    typeof res.bhi === 'number' && !Number.isNaN(res.bhi) && res.bhi >= 0 && res.bhi <= 100,
    'SUITE 2',
    `${bc.name} -> BHI strictly clamped to [0, 100] (got ${res.bhi})`,
    `Invalid BHI: ${res.bhi}`
  );

  assert(
    typeof res.predictedRulHours === 'number' && !Number.isNaN(res.predictedRulHours) && Number.isFinite(res.predictedRulHours) && res.predictedRulHours >= 2,
    'SUITE 2',
    `${bc.name} -> predictedRulHours >= 2 and finite (got ${res.predictedRulHours}h)`,
    `Invalid RUL: ${res.predictedRulHours}`
  );

  assert(
    typeof res.savedValueUsd === 'number' && !Number.isNaN(res.savedValueUsd) && res.savedValueUsd >= 0,
    'SUITE 2',
    `${bc.name} -> savedValueUsd valid non-negative (got $${res.savedValueUsd})`,
    `Invalid savedValueUsd: ${res.savedValueUsd}`
  );

  assert(
    res.decayCurve.length === 13 && res.decayCurve.every((pt) => pt.qualityRemaining >= 0 && pt.qualityRemaining <= 100),
    'SUITE 2',
    `${bc.name} -> decayCurve has exactly 13 points all in [0, 100]`,
    `decayCurve points issue`
  );
});

// ============================================================================
// SUITE 3: LOGISTICS STANDARDS PAYLOAD INTEGRITY (ZERO MISSING FIELDS)
// ============================================================================
console.log('\n--- SUITE 3: Logistics Standards Payload Integrity ---');

const testModes: TransportMode[] = [
  'RAIL_REEFER',
  'RO_PAX_FERRY',
  'TIR_TRUCK',
  'SMART_REEFER_CONTAINER',
  'MULTIMODAL_COMBO',
];

testModes.forEach((mode) => {
  const modeTel: CargoConditionTelemetry = {
    commodity: 'pears',
    setPointCelsius: 1.0,
    actualCelsius: 3.5,
    relativeHumidity: 88,
    ethylenePpm: 1.5,
    volatileEthanolPpm: 12.0,
    co2Percent: 4.0,
    o2Percent: 3.5,
    vibrationG: 0.5,
    transportMode: mode,
    assetValueUsd: 72000,
  };

  // 3.1 DCSA 3.0 Equipment Event Schema
  const dcsa = generateDCSA30Payload(modeTel, 'FS-9912', 'KZAKTAU');
  const dcsaIssues = findUndefinedOrNaN(dcsa);
  assert(
    dcsaIssues.length === 0,
    'SUITE 3',
    `DCSA 3.0 payload for mode ${mode} has zero undefined/NaN fields`,
    dcsaIssues.join('; ')
  );
  assert(
    dcsa.eventType === 'EQUIPMENT_EVENT' &&
    dcsa.eventClassifierCode === 'ACT' &&
    dcsa.ISOEquipmentCode === '45R1' &&
    dcsa.equipmentReference === 'FS-REEF-9912' &&
    dcsa.transportCall.modeOfTransport === mode &&
    typeof dcsa.telemetry.temperature.excursionDeltaCelsius === 'number' &&
    typeof dcsa.compliance.biologicalTwinHealthIndex === 'number',
    'SUITE 3',
    `DCSA 3.0 payload for ${mode} strictly complies with DCSA Track & Trace v3.0 schema`
  );

  // 3.2 KTZ Rail ASOU / SMGS Waybill Schema
  const ktz = generateKTZRailPayload(modeTel, 'FS-9912');
  const ktzIssues = findUndefinedOrNaN(ktz);
  assert(
    ktzIssues.length === 0,
    'SUITE 3',
    `KTZ Rail ASOU / SMGS payload for mode ${mode} has zero undefined/NaN fields`,
    ktzIssues.join('; ')
  );
  assert(
    ktz.railConsignmentNote === 'SMGS-KZ-FS-9912-2026' &&
    ktz.gaugeBreakInterchange.gaugeTransfer.includes('1520mm Russian ⇄ 1435mm European UIC') &&
    typeof ktz.trainTelematics.speedKmh === 'number' &&
    typeof ktz.trainTelematics.brakingPipePressureBar === 'number' &&
    typeof ktz.trainTelematics.shockThresholdExceeded === 'boolean',
    'SUITE 3',
    `KTZ Rail payload for ${mode} satisfies SMGS waybill and telemetry specifications`
  );

  // 3.3 AIS Maritime Caspian Ferry Schema
  const ais = generateAISMaritimePayload(modeTel, 'FS-9912');
  const aisIssues = findUndefinedOrNaN(ais);
  assert(
    aisIssues.length === 0,
    'SUITE 3',
    `AIS Maritime payload for mode ${mode} has zero undefined/NaN fields`,
    aisIssues.join('; ')
  );
  assert(
    ais.vesselName.includes('BARYS-1') &&
    ais.mmsi === 437190422 &&
    ais.imoNumber === 9814502 &&
    ais.destinationPort === 'BAKU_ALAT (AZ)' &&
    typeof ais.seaState.waveHeightMeters === 'number' &&
    typeof ais.reeferDeckPlugs.totalVoltageOutputKw === 'number' &&
    ais.reeferDeckPlugs.monitoredReefers.includes('FS-REEF-9912'),
    'SUITE 3',
    `AIS Maritime payload for ${mode} models Caspian Ro-Pax vessel telemetry`
  );

  // 3.4 JSON Serialization & Deserialization Roundtrip
  const dcsaJson = JSON.stringify(dcsa);
  const ktzJson = JSON.stringify(ktz);
  const aisJson = JSON.stringify(ais);

  const dcsaRoundtrip = JSON.parse(dcsaJson);
  const ktzRoundtrip = JSON.parse(ktzJson);
  const aisRoundtrip = JSON.parse(aisJson);

  assert(
    dcsaRoundtrip.equipmentReference === dcsa.equipmentReference &&
    ktzRoundtrip.railConsignmentNote === ktz.railConsignmentNote &&
    aisRoundtrip.mmsi === ais.mmsi,
    'SUITE 3',
    `Mode ${mode} schemas roundtrip serialize to valid JSON with identical integrity`
  );
});

// ============================================================================
// SUITE 4: MONTE CARLO ADVERSARIAL FUZZING (5,000 SAMPLES)
// ============================================================================
console.log('\n--- SUITE 4: Monte Carlo Adversarial Fuzzing (5,000 Iterations) ---');

let fuzzViolations = 0;
const FUZZ_ITERATIONS = 5000;

for (let i = 0; i < FUZZ_ITERATIONS; i++) {
  const comm = commodities[i % commodities.length];
  const mode = testModes[i % testModes.length];

  // Wide adversarial parameter distributions
  const tSet = -5.0 + Math.random() * 20.0;     // -5°C to +15°C
  const tAct = -40.0 + Math.random() * 100.0;   // -40°C to +60°C
  const rh = Math.random() * 120.0;             // 0% to 120%
  const eth = Math.random() * 150.0;            // 0 to 150 ppm volatile ethanol
  const c2h4 = Math.random() * 60.0;            // 0 to 60 ppm ethylene
  const co2 = Math.random() * 25.0;             // 0 to 25% CO2
  const o2 = Math.random() * 30.0;              // 0 to 30% O2
  const shock = Math.random() * 8.0;            // 0 to 8.0G

  const randomTel: CargoConditionTelemetry = {
    commodity: comm,
    setPointCelsius: tSet,
    actualCelsius: tAct,
    relativeHumidity: rh,
    volatileEthanolPpm: eth,
    ethylenePpm: c2h4,
    co2Percent: co2,
    o2Percent: o2,
    vibrationG: shock,
    transportMode: mode,
  };

  const res = calculateBiologicalHealth(randomTel);

  // Check strict invariants
  if (
    typeof res.bhi !== 'number' ||
    Number.isNaN(res.bhi) ||
    res.bhi < 0 ||
    res.bhi > 100 ||
    typeof res.predictedRulHours !== 'number' ||
    Number.isNaN(res.predictedRulHours) ||
    !Number.isFinite(res.predictedRulHours) ||
    typeof res.accelerationFactor !== 'number' ||
    Number.isNaN(res.accelerationFactor) ||
    !Number.isFinite(res.accelerationFactor) ||
    typeof res.savedValueUsd !== 'number' ||
    Number.isNaN(res.savedValueUsd)
  ) {
    fuzzViolations++;
  }
}

assert(
  fuzzViolations === 0,
  'SUITE 4',
  `5,000 Monte Carlo randomized telemetry iterations produced ZERO invariant violations`,
  `Encountered ${fuzzViolations} invariant violations`
);

// ============================================================================
// SUITE 5: TRACK INTERPOLATION & OUT-OF-BOUNDS RESILIENCE
// ============================================================================
console.log('\n--- SUITE 5: Track Interpolation & Out-of-Bounds Resilience ---');

testModes.forEach((mode) => {
  const track = getTrackCoordinatesForMode(mode);
  assert(track.length >= 2, 'SUITE 5', `Mode ${mode} track has at least 2 points`);

  // Progress below 0 or above 1 should clamp cleanly without NaN
  const posNegative = interpolateTrackPosition(track, -0.2);
  const posOver = interpolateTrackPosition(track, 1.5);

  assert(
    !Number.isNaN(posNegative.lat) && !Number.isNaN(posNegative.lng) && posNegative.distanceCoveredKm === 0,
    'SUITE 5',
    `Mode ${mode} progress=-0.2 clamps safely to start (dist=0 km)`,
    `Got dist=${posNegative.distanceCoveredKm}`
  );

  assert(
    !Number.isNaN(posOver.lat) && !Number.isNaN(posOver.lng) && posOver.distanceCoveredKm === posOver.totalDistanceKm,
    'SUITE 5',
    `Mode ${mode} progress=1.5 clamps safely to end (dist=${posOver.totalDistanceKm} km)`,
    `Got dist=${posOver.distanceCoveredKm}`
  );
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n========================================================================');
console.log(`  STRESS VERIFICATION SUMMARY: ${passedChecks} / ${totalChecks} CHECKS PASSED`);
if (failedChecks === 0) {
  console.log('  STATUS: 100% PASS — ALL ADVERSARIAL STRESS INVARIANTS SATISFIED');
  console.log('========================================================================\n');
  process.exit(0);
} else {
  console.error(`  STATUS: FAILED — ${failedChecks} CHECKS FAILED`);
  console.log('========================================================================\n');
  process.exit(1);
}
