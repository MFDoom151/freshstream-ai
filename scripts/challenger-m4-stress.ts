import { calculateBiologicalHealth, CargoConditionTelemetry } from '../src/types/telemetry';
import { interpolateTrackPosition, getTrackCoordinatesForMode } from '../src/lib/map-data';

console.log('====================================================');
console.log('ADVERSARIAL STRESS TEST: MILESTONE 4 DIGITAL TWIN');
console.log('====================================================\n');

let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}${detail ? ` -> ${detail}` : ''}`);
  }
}

// 1. Extreme temperature inputs
const deepFreeze = calculateBiologicalHealth({
  commodity: 'pears',
  setPointCelsius: 1.0,
  actualCelsius: -30.0,
  relativeHumidity: 90,
  ethylenePpm: 0,
  volatileEthanolPpm: 0,
  co2Percent: 0,
  o2Percent: 21,
  vibrationG: 0.1,
  transportMode: 'RAIL_REEFER',
});

assert(!Number.isNaN(deepFreeze.bhi), 'Deep freeze (-30°C) produces non-NaN BHI', `Got: ${deepFreeze.bhi}`);
assert(!Number.isNaN(deepFreeze.accelerationFactor), 'Deep freeze produces non-NaN acceleration factor');
assert(deepFreeze.thermalStatus === 'CRITICAL', 'Deep freeze triggers CRITICAL thermal status');
assert(deepFreeze.thermalDelta === -31.0, 'Thermal delta correctly signed (-31.0°C)');

const extremeHeat = calculateBiologicalHealth({
  commodity: 'pears',
  setPointCelsius: 1.0,
  actualCelsius: 60.0,
  relativeHumidity: 15,
  ethylenePpm: 10,
  volatileEthanolPpm: 100,
  co2Percent: 0,
  o2Percent: 21,
  vibrationG: 3.0,
  transportMode: 'RAIL_REEFER',
});

assert(!Number.isNaN(extremeHeat.bhi), 'Extreme heat (+60°C) produces non-NaN BHI');
assert(extremeHeat.bhi >= 5.0 && extremeHeat.bhi <= 99.5, 'BHI stays strictly bounded between 5% and 99.5%');
assert(extremeHeat.status === 'CRITICAL', 'Extreme heat triggers CRITICAL status');
assert(extremeHeat.anaerobicDecayAlert === true, '100 ppm ethanol triggers anaerobic decay alert');

// 2. Track interpolation boundary handling
const track = getTrackCoordinatesForMode('MULTIMODAL_COMBO');
const pNeg = interpolateTrackPosition(track, -5.0);
const pStart = interpolateTrackPosition(track, 0.0);
assert(pNeg.lat === pStart.lat && pNeg.lng === pStart.lng, 'Negative progress safely clamps to start of track');

const pOver = interpolateTrackPosition(track, 5.0);
const pEnd = interpolateTrackPosition(track, 1.0);
assert(pOver.lat === pEnd.lat && pOver.lng === pEnd.lng, 'Overflow progress safely clamps to end of track');

const pEmpty = interpolateTrackPosition([], 0.5);
assert(!Number.isNaN(pEmpty.lat) && !Number.isNaN(pEmpty.lng), 'Empty coordinate track handled gracefully');

const pSingle = interpolateTrackPosition([[43.18, 51.65]], 0.5);
assert(pSingle.lat === 43.18 && pSingle.lng === 51.65, 'Single point track handled gracefully');

const pDuplicate = interpolateTrackPosition([[43.18, 51.65], [43.18, 51.65]], 0.5);
assert(!Number.isNaN(pDuplicate.lat) && !Number.isNaN(pDuplicate.lng), 'Zero-distance segment handled without divide-by-zero');

console.log(`\nAdversarial stress test completed: ${passed} / ${total} passed.`);
if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
