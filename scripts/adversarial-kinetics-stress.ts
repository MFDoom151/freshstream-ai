import { calculateKinetics, COMMODITY_PROFILES, calculateTemperatureAcceleration, calculateFreezingPenalty, calculateEthanolAcceleration, calculateHumidityAcceleration, calculateVibrationAcceleration, calculateBHI, generateDecayCurve } from '../src/lib/arrhenius';
import { CargoType, RouteWaypoint } from '../src/types/arrhenius';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, details: string) {
  results.push({ name, passed, details });
  const mark = passed ? 'PASS [✓]' : 'FAIL [✗]';
  console.log(`${mark} ${name}: ${details}`);
}

console.log('================================================================');
console.log('   FRESHSTREAM AI — ADVERSARIAL KINETICS ENGINE STRESS SUITE    ');
console.log('================================================================\n');

// ============================================================================
// 1. FREEZING POINT DISCONTINUITY & PENALTY CHECKS
// ============================================================================
console.log('--- 1. Freezing Point Boundary Tests ---');
const commodities: Array<{ type: CargoType; tFreeze: number }> = [
  { type: 'berries', tFreeze: -0.8 },
  { type: 'beef', tFreeze: -1.7 },
  { type: 'dairy', tFreeze: -0.5 },
  { type: 'fruits', tFreeze: -1.5 },
];

for (const comm of commodities) {
  const profile = COMMODITY_PROFILES[comm.type];
  const tJustAbove = comm.tFreeze + 0.05;
  const tExact = comm.tFreeze;
  const tJustBelow = comm.tFreeze - 0.05;
  const tDeepFreeze = -5.0;

  const penAbove = calculateFreezingPenalty(tJustAbove, comm.tFreeze);
  const penExact = calculateFreezingPenalty(tExact, comm.tFreeze);
  const penBelow = calculateFreezingPenalty(tJustBelow, comm.tFreeze);
  const penDeep = calculateFreezingPenalty(tDeepFreeze, comm.tFreeze);

  const expectedDeep = 1.0 + 0.5 * (comm.tFreeze - (-5.0));

  record(
    `Freezing point penalty for ${comm.type} (${comm.tFreeze}°C)`,
    penAbove === 1.0 && penExact === 1.0 && penBelow > 1.0 && Math.abs(penDeep - expectedDeep) < 1e-6,
    `T=${tJustAbove}°C -> ${penAbove}, T=${tExact}°C -> ${penExact}, T=${tJustBelow}°C -> ${penBelow}, T=-5°C -> ${penDeep} (expected ${expectedDeep})`
  );
}

// ============================================================================
// 2. BIOGENIC ETHANOL CRITICAL THRESHOLD (35 PPM CLIFF EDGE)
// ============================================================================
console.log('\n--- 2. Biogenic Ethanol Surge Tests ---');
const ethBelow = calculateKinetics({ cargo: 'beef', temperature: 1.0, ethanol: 35.0, humidity: 82.0, vibration: 0.2 });
const ethAbove = calculateKinetics({ cargo: 'beef', temperature: 1.0, ethanol: 35.1, humidity: 82.0, vibration: 0.2 });
const ethZero = calculateKinetics({ cargo: 'beef', temperature: 1.0, ethanol: 0.0, humidity: 82.0, vibration: 0.2 });
const ethHigh = calculateKinetics({ cargo: 'beef', temperature: 1.0, ethanol: 100.0, humidity: 82.0, vibration: 0.2 });

record(
  'Ethanol exactly at 35.0 ppm boundary',
  ethBelow.is_ethanol_critical === false,
  `is_ethanol_critical: ${ethBelow.is_ethanol_critical} (expected false), alert: ${ethBelow.alert_severity}`
);

record(
  'Ethanol at 35.1 ppm (>35.0 ppm critical cliff)',
  ethAbove.is_ethanol_critical === true && ethAbove.alert_severity === 'CRITICAL' && typeof ethAbove.rescue_window_hours === 'number',
  `is_ethanol_critical: ${ethAbove.is_ethanol_critical}, alert: ${ethAbove.alert_severity}, rescue_window: ${ethAbove.rescue_window_hours}h`
);

record(
  'Ethanol at 0.0 ppm baseline',
  calculateEthanolAcceleration(0.0, 1.8) === 1.0 && ethZero.is_ethanol_critical === false,
  `phi_eth(0): ${calculateEthanolAcceleration(0.0, 1.8)}, alert: ${ethZero.alert_severity}`
);

record(
  'Ethanol at extreme 100.0 ppm surge',
  ethHigh.is_ethanol_critical === true && ethHigh.shelf_life_hours > 0 && !isNaN(ethHigh.shelf_life_hours) && ethHigh.health_index >= 1.0,
  `SL: ${ethHigh.shelf_life_hours}h, BHI: ${ethHigh.health_index}%, alert: ${ethHigh.alert_severity}`
);

// ============================================================================
// 3. PORT KURYK REEFER FAILURE CANONICAL SCENARIO
// ============================================================================
console.log('\n--- 3. Port Kuryk Reefer Failure Test ---');
const kuryk = calculateKinetics({
  cargo: 'beef',
  temperature: 18.0,
  ethanol: 42.0,
  humidity: 92.0,
  vibration: 1.2,
  waypoint: 'kuryk',
  cargo_value_usd: 68000,
});

record(
  'Port Kuryk remaining shelf life ~14.7h',
  Math.abs(kuryk.shelf_life_hours - 14.7) <= 0.1,
  `shelf_life_hours = ${kuryk.shelf_life_hours}h (expected 14.7h)`
);

record(
  'Port Kuryk BHI ~29.2%',
  Math.abs(kuryk.health_index - 29.2) <= 0.1,
  `health_index = ${kuryk.health_index}% (expected 29.2%)`
);

record(
  'Port Kuryk saved value ~$36,352',
  kuryk.saved_value_usd >= 36000 && kuryk.saved_value_usd <= 37000,
  `saved_value_usd = $${kuryk.saved_value_usd} (expected $36,352)`
);

record(
  'Port Kuryk critical alert flags',
  kuryk.is_ethanol_critical === true && kuryk.alert_severity === 'CRITICAL' && kuryk.recommended_actions.length > 0,
  `is_ethanol_critical=${kuryk.is_ethanol_critical}, severity=${kuryk.alert_severity}, actions count=${kuryk.recommended_actions.length}`
);

// ============================================================================
// 4. COMBINATORIAL STRESS & DECAY CURVE SANITY
// ============================================================================
console.log('\n--- 4. Combinatorial Extremes & Decay Curve Sanity ---');
const testTemps = [-5.0, -1.7, 0.0, 1.0, 4.0, 15.0, 18.0, 35.0, 50.0];
const testEth = [0.0, 2.0, 5.0, 20.0, 35.0, 42.0, 100.0, 200.0];
const testHum = [10.0, 20.0, 70.0, 85.0, 92.0, 100.0];
const testVib = [0.1, 0.4, 1.2, 1.8, 3.0, 10.0];
const testCargos: CargoType[] = ['berries', 'beef', 'dairy', 'fruits'];

let allDecayValid = true;
let monotonicFails = 0;
let nanOrNegativeFails = 0;
let totalScenariosTested = 0;

for (const c of testCargos) {
  for (const t of testTemps) {
    for (const e of testEth) {
      for (const h of testHum) {
        for (const v of testVib) {
          totalScenariosTested++;
          const out = calculateKinetics({
            cargo: c,
            temperature: t,
            ethanol: e,
            humidity: h,
            vibration: v,
          });

          // Check main outputs
          if (
            isNaN(out.shelf_life_hours) ||
            out.shelf_life_hours <= 0 ||
            isNaN(out.health_index) ||
            out.health_index < 0 ||
            out.health_index > 100 ||
            isNaN(out.acceleration_factor) ||
            out.acceleration_factor <= 0 ||
            isNaN(out.saved_value_usd) ||
            out.saved_value_usd < 0
          ) {
            nanOrNegativeFails++;
            allDecayValid = false;
          }

          // Check decay curve points
          let prevQ = 100.1;
          for (const pt of out.decay_curve) {
            if (
              isNaN(pt.quality_remaining) ||
              isNaN(pt.baseline_quality) ||
              pt.quality_remaining < 0 ||
              pt.quality_remaining > 100 ||
              pt.baseline_quality < 0 ||
              pt.baseline_quality > 100
            ) {
              nanOrNegativeFails++;
              allDecayValid = false;
            }
            if (pt.quality_remaining > prevQ + 1e-6) {
              monotonicFails++;
              allDecayValid = false;
            }
            prevQ = pt.quality_remaining;
          }
        }
      }
    }
  }
}

record(
  `Combinatorial matrix stability (${totalScenariosTested} combinations)`,
  nanOrNegativeFails === 0 && monotonicFails === 0 && allDecayValid,
  `Tested ${totalScenariosTested} parameter combos across 4 commodities. NaN/Negative fails: ${nanOrNegativeFails}, Monotonicity violations: ${monotonicFails}`
);

// ============================================================================
// 5. DEFENSIVE FUZZING DIRECTLY ON calculateKinetics
// ============================================================================
console.log('\n--- 5. Defensive Fuzzing on calculateKinetics Input Handling ---');

// Fuzz 5.1: Missing / null / undefined fields
try {
  const emptyRes = calculateKinetics({} as any);
  record(
    'Fuzz: Empty object input {}',
    !isNaN(emptyRes.shelf_life_hours) && emptyRes.shelf_life_hours > 0 && !isNaN(emptyRes.health_index),
    `SL=${emptyRes.shelf_life_hours}h, BHI=${emptyRes.health_index}%, alert=${emptyRes.alert_severity}`
  );
} catch (e: any) {
  record('Fuzz: Empty object input {}', false, `Threw exception: ${e.message}`);
}

// Fuzz 5.2: Non-standard cargo names
const upperBeef = calculateKinetics({ cargo: 'BEEF' as any, temperature: 1.0, ethanol: 2.0, humidity: 80.0, vibration: 0.2 });
const unknownCargo = calculateKinetics({ cargo: 'unknown_grain' as any, temperature: 1.0, ethanol: 2.0, humidity: 80.0, vibration: 0.2 });
record(
  'Fuzz: Case insensitivity ("BEEF")',
  upperBeef.shelf_life_hours === 504.0,
  `Upper case BEEF handled: SL=${upperBeef.shelf_life_hours}h`
);
record(
  'Fuzz: Unknown cargo fallback',
  unknownCargo.shelf_life_hours === 504.0,
  `Unknown cargo fell back safely: SL=${unknownCargo.shelf_life_hours}h`
);

// Fuzz 5.3: NaN as input numbers
const nanTemp = calculateKinetics({ cargo: 'beef', temperature: NaN, ethanol: 2.0, humidity: 80.0, vibration: 0.2 });
const nanEthanol = calculateKinetics({ cargo: 'beef', temperature: 1.0, ethanol: NaN, humidity: 80.0, vibration: 0.2 });
record(
  'Fuzz: NaN temperature behavior in calculateKinetics',
  !isNaN(nanTemp.shelf_life_hours),
  `NaN temp -> shelf_life_hours=${nanTemp.shelf_life_hours}, BHI=${nanTemp.health_index}`
);
record(
  'Fuzz: NaN ethanol behavior in calculateKinetics',
  !isNaN(nanEthanol.shelf_life_hours),
  `NaN ethanol -> shelf_life_hours=${nanEthanol.shelf_life_hours}, BHI=${nanEthanol.health_index}`
);

// Fuzz 5.4: Sub-absolute zero temperature (-300°C)
const subAbsZero = calculateKinetics({ cargo: 'beef', temperature: -300.0, ethanol: 2.0, humidity: 80.0, vibration: 0.2 });
record(
  'Fuzz: Sub-absolute zero temperature (-300°C)',
  !isNaN(subAbsZero.shelf_life_hours) && subAbsZero.shelf_life_hours > 0,
  `SL=${subAbsZero.shelf_life_hours}h, BHI=${subAbsZero.health_index}%`
);

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n================================================================');
const total = results.length;
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================\n');

if (failed > 0) {
  console.error(`FAILURE: ${failed} tests failed!`);
  process.exit(1);
} else {
  console.log('SUCCESS: All mathematical and boundary stress tests PASSED!');
  process.exit(0);
}
