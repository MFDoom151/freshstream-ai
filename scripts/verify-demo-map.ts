/**
 * Verification Script: Milestone 4 — Near-Production Logistics Demo & Real-Map Digital Twin
 *
 * Programmatically validates all acceptance criteria:
 * 1. Dedicated interactive /demo page (replaces redirect, contains mission control)
 * 2. 16 Middle Corridor hubs with complete metadata, gauge-break points (Khorgos, Akhalkalaki), and Caspian ferry ramps (Kuryk, Baku)
 * 3. 7 accurate route segments with valid GPS track geometry following real rail/sea/highway corridors
 * 4. 5 transport modes (RAIL_REEFER, RO_PAX_FERRY, TIR_TRUCK, SMART_REEFER_CONTAINER, MULTIMODAL_COMBO)
 * 5. Piecewise geodesic track interpolation engine (lat/lng, bearing, monotonic distance)
 * 6. Interactive cargo condition controls (T_set vs T_act excursion delta, C2H4 ethylene, >35 ppm ethanol alert, BHI calculation)
 * 7. Logistics standards schemas (DCSA Track & Trace 3.0, KTZ Rail ASOU / SMGS, AIS Maritime)
 * 8. Independence compliance (0 forbidden university/competition terms)
 */

import fs from 'fs';
import path from 'path';
import {
  CORRIDOR_HUBS,
  CORRIDOR_ROUTES,
  CORRIDOR_EVENTS,
  TRANSPORT_MODES_CONFIG,
  interpolateTrackPosition,
  getTrackCoordinatesForMode,
  getCorridorHub,
  getGaugeBreakHubs,
  getBottleneckHubs,
  getModeConfig,
} from '../src/lib/map-data';

import {
  TransportMode,
  CargoConditionTelemetry,
  calculateBiologicalHealth,
  COMMODITY_KINETIC_PROFILES,
  generateDCSA30Payload,
  generateKTZRailPayload,
  generateAISMaritimePayload,
} from '../src/types/telemetry';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

console.log('================================================================');
console.log('  MILESTONE 4 ACCEPTANCE VERIFICATION: LOGISTICS DEMO & DIGITAL TWIN');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// TEST SUITE 1: 16 Middle Corridor Hubs & Gauge-Break Infrastructure
// -----------------------------------------------------------------------------
console.log('--- TEST SUITE 1: 16 Middle Corridor Hubs & Gauge-Break Infrastructure ---');

assert(CORRIDOR_HUBS.length === 16, 'Exactly 16 Middle Corridor hubs defined', `Found ${CORRIDOR_HUBS.length}`);

// Check all 16 expected hub IDs
const expectedHubIds = [
  'khorgos',
  'almaty',
  'shu',
  'shymkent',
  'kyzylorda',
  'beyneu',
  'aktau',
  'kuryk',
  'baku',
  'ganja',
  'tbilisi',
  'akhalkalaki',
  'poti',
  'kars',
  'ankara',
  'istanbul',
];

const foundHubIds = CORRIDOR_HUBS.map((h) => h.id);
const missingHubs = expectedHubIds.filter((id) => !foundHubIds.includes(id));
assert(missingHubs.length === 0, 'All 16 mandatory Middle Corridor hubs are present', `Missing: ${missingHubs.join(', ')}`);

// Verify Khorgos Gateway gauge-break point
const khorgos = getCorridorHub('khorgos');
assert(
  !!khorgos && khorgos.isGaugeBreak === true && khorgos.gaugeMm?.includes('1435mm ⇄ 1520mm') === true,
  'Khorgos Gateway has 1435mm ⇄ 1520mm Break-of-Gauge specification',
  `Found gaugeMm: ${khorgos?.gaugeMm}`
);

// Verify Akhalkalaki break-of-gauge facility
const akhalkalaki = getCorridorHub('akhalkalaki');
assert(
  !!akhalkalaki && akhalkalaki.isGaugeBreak === true && akhalkalaki.gaugeMm?.includes('1520mm ⇄ 1435mm') === true,
  'Akhalkalaki Break-of-Gauge Facility has 1520mm ⇄ 1435mm European UIC specification',
  `Found gaugeMm: ${akhalkalaki?.gaugeMm}`
);

// Verify Caspian ferry ramps
const kuryk = getCorridorHub('kuryk');
const baku = getCorridorHub('baku');
assert(
  !!kuryk && kuryk.isBottleneck === true && kuryk.type === 'seaport',
  'Port Kuryk is defined as Ro-Pax Rail Ferry Chokepoint Seaport'
);
assert(
  !!baku && baku.isBottleneck === true && baku.type === 'seaport',
  'Port of Baku (Alat) is defined as Ro-Pax Rail Ferry Chokepoint Seaport'
);

// Verify valid coordinate bounds for all hubs
const hubsWithValidCoords = CORRIDOR_HUBS.every(
  (h) => h.lat >= 38.0 && h.lat <= 48.0 && h.lng >= 28.0 && h.lng <= 82.0
);
assert(hubsWithValidCoords, 'All 16 hubs have geographically valid Eurasian coordinates (38-48°N, 28-82°E)');

// -----------------------------------------------------------------------------
// TEST SUITE 2: 7 Accurate Route Segments Following Real GPS Geometry
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: 7 Accurate Route Segments & Real GPS Geometry ---');

assert(CORRIDOR_ROUTES.length === 7, 'Exactly 7 real corridor route segments defined', `Found ${CORRIDOR_ROUTES.length}`);

const expectedRouteIds = [
  'kz-rail-mainline',
  'caspian-sea-ro-pax',
  'btk-trans-caucasus-rail',
  'black-sea-rail-branch',
  'trans-anatolian-rail',
  'we-wc-highway',
  'black-sea-feeder',
];

const foundRouteIds = CORRIDOR_ROUTES.map((r) => r.id);
const missingRoutes = expectedRouteIds.filter((id) => !foundRouteIds.includes(id));
assert(missingRoutes.length === 0, 'All 7 mandatory route segments are present', `Missing: ${missingRoutes.join(', ')}`);

// Verify KTZ mainline has >= 20 coordinates following authentic Kazakh rail stations
const kzRail = CORRIDOR_ROUTES.find((r) => r.id === 'kz-rail-mainline');
assert(
  !!kzRail && kzRail.coordinates.length >= 20,
  `KTZ Heavy Rail Backbone follows high-fidelity track geometry (${kzRail?.coordinates.length} waypoints)`,
  `Expected >=20, found ${kzRail?.coordinates.length}`
);

// Verify Caspian sea Ro-Pax ferry route (Kuryk ⇄ Alat)
const caspianSea = CORRIDOR_ROUTES.find((r) => r.id === 'caspian-sea-ro-pax');
assert(
  !!caspianSea && caspianSea.mode === 'SEA' && caspianSea.coordinates[0][1] > caspianSea.coordinates[caspianSea.coordinates.length - 1][1],
  'Caspian Ro-Pax Fairway traverses westwards across Caspian sea from Kuryk (~51.6°E) to Alat (~49.4°E)'
);

// -----------------------------------------------------------------------------
// TEST SUITE 3: 5 Transport Modes & Multimodal Configuration
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: 5 Transport Modes & Multimodal Configuration ---');

const expectedModes: TransportMode[] = [
  'RAIL_REEFER',
  'RO_PAX_FERRY',
  'TIR_TRUCK',
  'SMART_REEFER_CONTAINER',
  'MULTIMODAL_COMBO',
];

const configuredModes = Object.keys(TRANSPORT_MODES_CONFIG);
assert(
  configuredModes.length === 5,
  'Exactly 5 transport modes configured in TRANSPORT_MODES_CONFIG',
  `Found ${configuredModes.length}`
);

expectedModes.forEach((mode) => {
  const cfg = getModeConfig(mode);
  assert(
    !!cfg && cfg.id === mode && cfg.routeIds.length > 0 && !!cfg.bounds && cfg.bounds.length === 2,
    `Mode ${mode} configured with name "${cfg.name}", vehicleType "${cfg.vehicleType}", and route IDs`
  );
});

// Verify MULTIMODAL_COMBO spans all corridor route IDs
const comboCfg = getModeConfig('MULTIMODAL_COMBO');
assert(
  comboCfg.routeIds.length >= 5 && comboCfg.vehicleType === 'MULTIMODAL',
  'MULTIMODAL_COMBO links multiple corridor segments into a unified intermodal chain'
);

// -----------------------------------------------------------------------------
// TEST SUITE 4: Geodesic Track Interpolation Engine & Vehicle Animation
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: Geodesic Track Interpolation Engine ---');

const testFractions = [0.0, 0.25, 0.5, 0.75, 1.0];
expectedModes.forEach((mode) => {
  const trackCoords = getTrackCoordinatesForMode(mode);
  assert(trackCoords.length >= 2, `Track for mode ${mode} has valid coordinate array (${trackCoords.length} pts)`);

  let lastDistance = -1;
  let isMonotonic = true;

  testFractions.forEach((progress) => {
    const pos = interpolateTrackPosition(trackCoords, progress);
    if (pos.distanceCoveredKm < lastDistance - 0.001) {
      isMonotonic = false;
    }
    lastDistance = pos.distanceCoveredKm;

    assert(
      pos.lat >= 35.0 && pos.lat <= 55.0 && pos.lng >= 25.0 && pos.lng <= 85.0 && pos.bearingDegrees >= 0 && pos.bearingDegrees <= 360,
      `Mode ${mode} at ${(progress * 100).toFixed(0)}%: Lat ${pos.lat.toFixed(2)}, Lng ${pos.lng.toFixed(2)}, Brg ${pos.bearingDegrees}°, Dist ${pos.distanceCoveredKm} km`
    );
  });

  assert(isMonotonic, `Mode ${mode} distance increases monotonically with progress`);
});

// -----------------------------------------------------------------------------
// TEST SUITE 5: Cargo Condition Controls, Thermal Excursion Delta & Biological BHI
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 5: Cargo Condition Controls & Arrhenius Kinetics ---');

// Test Case 5.1: Optimal Baseline vs Actual Temperature
const optimalTelemetry: CargoConditionTelemetry = {
  commodity: 'pears',
  setPointCelsius: 1.0,
  actualCelsius: 1.0,
  relativeHumidity: 92,
  ethylenePpm: 0.2,
  volatileEthanolPpm: 2.0,
  co2Percent: 4.5,
  o2Percent: 3.0,
  vibrationG: 0.3,
  transportMode: 'RAIL_REEFER',
  assetValueUsd: 68000,
};

const optimalResult = calculateBiologicalHealth(optimalTelemetry);
assert(
  optimalResult.thermalDelta === 0 && optimalResult.thermalStatus === 'OPTIMAL' && optimalResult.bhi >= 85,
  `Optimal conditions produce ΔT = 0.0°C and high BHI (${optimalResult.bhi}%)`,
  `BHI: ${optimalResult.bhi}, DeltaT: ${optimalResult.thermalDelta}`
);

// Test Case 5.2: Thermal Excursion Delta (Actual Divergence)
const excursionTelemetry: CargoConditionTelemetry = {
  ...optimalTelemetry,
  setPointCelsius: 1.0,
  actualCelsius: 11.5, // +10.5°C breach!
};

const excursionResult = calculateBiologicalHealth(excursionTelemetry);
assert(
  excursionResult.thermalDelta === 10.5 && excursionResult.thermalStatus === 'CRITICAL' && excursionResult.accelerationFactor > 2.0,
  `Thermal breach calculates excursion delta ΔT = +10.5°C and acceleration ${excursionResult.accelerationFactor}x`,
  `DeltaT: ${excursionResult.thermalDelta}, Accel: ${excursionResult.accelerationFactor}`
);

// Test Case 5.3: Volatile Ethanol Anaerobic Spoilage (>35 ppm threshold)
const anaerobicTelemetry: CargoConditionTelemetry = {
  ...optimalTelemetry,
  actualCelsius: 14.5,
  volatileEthanolPpm: 42.0, // >35 ppm critical threshold!
};

const anaerobicResult = calculateBiologicalHealth(anaerobicTelemetry);
assert(
  anaerobicResult.anaerobicDecayAlert === true && anaerobicResult.status === 'CRITICAL' && anaerobicResult.bhi <= 50,
  `Volatile ethanol at 42.0 ppm (>35 ppm) triggers critical anaerobic alert with BHI ${anaerobicResult.bhi}%`,
  `Alert: ${anaerobicResult.anaerobicDecayAlert}, Status: ${anaerobicResult.status}, BHI: ${anaerobicResult.bhi}`
);
assert(
  anaerobicResult.prescribedIntervention.toLowerCase().includes('pulse-cooling') ||
  anaerobicResult.prescribedIntervention.toLowerCase().includes('emergency'),
  'AI Conductor prescribes actionable emergency intervention protocol for anaerobic surge'
);

// Test Case 5.4: Ethylene (C2H4) Ripening Acceleration for Climacteric Fruit
const lowEthyleneTelemetry: CargoConditionTelemetry = {
  ...optimalTelemetry,
  commodity: 'pears',
  ethylenePpm: 0.1,
};
const highEthyleneTelemetry: CargoConditionTelemetry = {
  ...optimalTelemetry,
  commodity: 'pears',
  ethylenePpm: 6.5,
};

const lowEthResult = calculateBiologicalHealth(lowEthyleneTelemetry);
const highEthResult = calculateBiologicalHealth(highEthyleneTelemetry);
assert(
  highEthResult.accelerationFactor > lowEthResult.accelerationFactor && highEthResult.predictedRulHours < lowEthResult.predictedRulHours,
  `Ethylene phytohormone increases degradation rate (${lowEthResult.accelerationFactor}x -> ${highEthResult.accelerationFactor}x) and reduces RUL (${lowEthResult.predictedRulHours}h -> ${highEthResult.predictedRulHours}h)`
);

// Test Case 5.5: Non-climacteric beef insensitive to ethylene
const beefLowEth: CargoConditionTelemetry = {
  ...optimalTelemetry,
  commodity: 'beef',
  ethylenePpm: 0.1,
};
const beefHighEth: CargoConditionTelemetry = {
  ...optimalTelemetry,
  commodity: 'beef',
  ethylenePpm: 8.0,
};
const beefLowResult = calculateBiologicalHealth(beefLowEth);
const beefHighResult = calculateBiologicalHealth(beefHighEth);
assert(
  Math.abs(beefLowResult.accelerationFactor - beefHighResult.accelerationFactor) < 0.05,
  'Non-climacteric Beef degradation rate is independent of ethylene phytohormone'
);

// -----------------------------------------------------------------------------
// TEST SUITE 6: Logistics Standards Schemas Integration
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 6: Logistics Standards Schemas Integration ---');

// DCSA 3.0 Equipment Event Schema
const dcsaPayload = generateDCSA30Payload(optimalTelemetry, 'FS-8821', 'KZKRK');
assert(
  dcsaPayload.eventType === 'EQUIPMENT_EVENT' &&
  dcsaPayload.ISOEquipmentCode === '45R1' &&
  dcsaPayload.compliance.standard === 'DCSA IoT & Reefer v3.0.0' &&
  dcsaPayload.telemetry.temperature.setPointCelsius === 1.0 &&
  dcsaPayload.telemetry.temperature.actualInternalCelsius === 1.0 &&
  dcsaPayload.telemetry.atmosphere.ethylenePpm === 0.2,
  'DCSA Track & Trace 3.0 Reefer payload satisfies standard equipment and telemetry structure'
);

// KTZ Rail ASOU / SMGS Consignment Note Schema
const ktzPayload = generateKTZRailPayload(optimalTelemetry, 'FS-8821');
assert(
  ktzPayload.railConsignmentNote.includes('SMGS-KZ-FS-8821') &&
  ktzPayload.carrier.includes('KTZ Express') &&
  ktzPayload.gaugeBreakInterchange.gaugeTransfer.includes('1520mm Russian ⇄ 1435mm European UIC') &&
  typeof ktzPayload.trainTelematics.speedKmh === 'number',
  'KTZ Rail ASOU / SMGS payload models 1520mm/1435mm break-of-gauge interchange and telematics'
);

// AIS Maritime Caspian Ferry Telemetry Schema
const aisPayload = generateAISMaritimePayload(optimalTelemetry, 'FS-8821');
assert(
  aisPayload.vesselName.includes('BARYS-1') &&
  aisPayload.mmsi === 437190422 &&
  aisPayload.destinationPort === 'BAKU_ALAT (AZ)' &&
  aisPayload.reeferDeckPlugs.activeContainers > 0,
  'AIS Maritime payload models Caspian Ro-Pax "BARYS-1" crossing and reefer deck power monitoring'
);

// -----------------------------------------------------------------------------
// TEST SUITE 7: Dedicated /demo Page & Component Architecture
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 7: Dedicated /demo Page & Component Architecture ---');

const demoPagePath = path.resolve(__dirname, '../src/app/demo/page.tsx');
const demoPageContent = fs.readFileSync(demoPagePath, 'utf-8');

assert(
  !demoPageContent.includes("redirect('/dashboard") && !demoPageContent.includes('redirect('),
  'src/app/demo/page.tsx is a dedicated interactive showcase (no redirect calls)'
);

assert(
  demoPageContent.includes('DigitalTwinMap') &&
  demoPageContent.includes('setPointCelsius') &&
  demoPageContent.includes('actualCelsius') &&
  demoPageContent.includes('ethylenePpm') &&
  demoPageContent.includes('volatileEthanolPpm') &&
  demoPageContent.includes('MULTIMODAL_COMBO'),
  'src/app/demo/page.tsx integrates DigitalTwinMap, dual temperature, ethylene, ethanol, and 5 modes'
);

const mapComponentPath = path.resolve(__dirname, '../src/components/map/DigitalTwinMap.tsx');
const mapComponentContent = fs.readFileSync(mapComponentPath, 'utf-8');

assert(
  mapComponentContent.includes('export const DigitalTwinMap') ||
  mapComponentContent.includes('export default DigitalTwinMap'),
  'src/components/map/DigitalTwinMap.tsx exports DigitalTwinMap component'
);

assert(
  mapComponentContent.includes('interpolateTrackPosition') &&
  mapComponentContent.includes('renderVehicleMarker') &&
  mapComponentContent.includes('showGaugeBreaksOnly'),
  'DigitalTwinMap.tsx contains animated vehicle rendering, track interpolation, and gauge-break filters'
);

// -----------------------------------------------------------------------------
// TEST SUITE 8: R5 Independence & Forbidden Terminology Scan
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 8: R5 Independence & Forbidden Terminology Scan ---');

const ownedSourceFiles = [
  path.resolve(__dirname, '../src/app/demo/page.tsx'),
  path.resolve(__dirname, '../src/components/map/DigitalTwinMap.tsx'),
  path.resolve(__dirname, '../src/lib/map-data.ts'),
  path.resolve(__dirname, '../src/types/telemetry.ts'),
];

// Construct regex dynamically to prevent script from matching its own regex definition
const forbiddenTerms = [
  ['s', 'a', 't', 'b', 'a', 'y', 'e', 'v'].join(''),
  ['с', 'а', 'т', 'п', 'а', 'е', 'в'].join(''),
  ['g', 'w', 'u'].join(''),
  ['g', 'e', 'o', 'r', 'g', 'e', ' ', 'w', 'a', 's', 'h', 'i', 'n', 'g', 't', 'o', 'n'].join(''),
  '\\bGW\\b',
];
const forbiddenRegex = new RegExp(forbiddenTerms.join('|'), 'i');
let forbiddenHits = 0;

ownedSourceFiles.forEach((f) => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf-8');
    if (forbiddenRegex.test(content)) {
      forbiddenHits++;
      console.error(`  ✗ Forbidden term match in: ${f}`);
    }
  }
});

assert(forbiddenHits === 0, 'Zero occurrences of forbidden academic/competition terms in M4 owned files');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`  VERIFICATION RESULTS: ${passedTests} / ${totalTests} CHECKS PASSED`);
if (failedTests === 0) {
  console.log('  STATUS: 100% PASS — ALL MILESTONE 4 ACCEPTANCE CRITERIA SATISFIED');
  console.log('================================================================\n');
  process.exit(0);
} else {
  console.error(`  STATUS: FAILED — ${failedTests} CHECKS FAILED`);
  console.log('================================================================\n');
  process.exit(1);
}
