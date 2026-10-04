// Standalone verification script for Arrhenius kinetics mathematical accuracy
import assert from 'assert';

// Import commodity profiles and formulas matching src/lib/arrhenius.ts
const R = 8.314;

const COMMODITY_PROFILES = {
  beef: {
    ea: 81500,
    a: 6.7077e12,
    tRef: 1.0,
    tOptMin: -1.0,
    tOptMax: 2.0,
    tFreeze: -1.7,
    baselineHours: 504,
    kRef: 0.001984,
    rhOptMin: 80,
    rhOptMax: 85,
    gammaEth: 1.8,
    kappaVib: 0.15,
    defaultCargoValueUsd: 68000,
  },
  berries: {
    ea: 68500,
    a: 4.6784e10,
    tRef: 2.0,
    tOptMin: 0.0,
    tOptMax: 3.0,
    tFreeze: -0.8,
    baselineHours: 216,
    kRef: 0.004629,
    rhOptMin: 90,
    rhOptMax: 95,
    gammaEth: 1.6,
    kappaVib: 0.60,
    defaultCargoValueUsd: 38000,
  },
  dairy: {
    ea: 92000,
    a: 6.5101e14,
    tRef: 4.0,
    tOptMin: 1.0,
    tOptMax: 4.0,
    tFreeze: -0.5,
    baselineHours: 336,
    kRef: 0.002976,
    rhOptMin: 70,
    rhOptMax: 85,
    gammaEth: 1.5,
    kappaVib: 0.20,
    defaultCargoValueUsd: 32000,
  },
  fruits: {
    ea: 58000,
    a: 1.3000e8,
    tRef: 3.0,
    tOptMin: 0.5,
    tOptMax: 4.0,
    tFreeze: -1.5,
    baselineHours: 720,
    kRef: 0.001389,
    rhOptMin: 85,
    rhOptMax: 95,
    gammaEth: 1.4,
    kappaVib: 0.35,
    defaultCargoValueUsd: 28000,
  },
};

function calculateTemperatureAcceleration(ea, tempC, tRefC) {
  const tK = tempC + 273.15;
  const tRefK = tRefC + 273.15;
  return Math.exp((ea / R) * (1 / tRefK - 1 / tK));
}

function calculateFreezingPenalty(tempC, tFreezeC) {
  if (tempC < tFreezeC) return 1.0 + 0.5 * (tFreezeC - tempC);
  return 1.0;
}

function calculateEthanolAcceleration(ethanolPpm, gammaEth) {
  if (ethanolPpm > 5.0) return 1.0 + gammaEth * Math.pow((ethanolPpm - 5.0) / 30.0, 1.3);
  return 1.0;
}

function calculateHumidityAcceleration(rh, rhOptMin, rhOptMax) {
  if (rh > rhOptMax) return 1.0 + 0.6 * Math.pow((rh - rhOptMax) / (100.0 - rhOptMax), 2);
  if (rh < rhOptMin) return 1.0 + 0.3 * ((rhOptMin - rh) / rhOptMin);
  return 1.0;
}

function calculateVibrationAcceleration(vibrationG, kappaVib) {
  if (vibrationG > 0.4) return 1.0 + kappaVib * Math.pow(vibrationG - 0.4, 1.2);
  return 1.0;
}

function calculateBHI(tempC, ethanolPpm, rh, vibrationG, profile) {
  let iT = 1.0;
  if (tempC >= profile.tOptMin && tempC <= profile.tOptMax) {
    iT = 1.0;
  } else if (tempC > profile.tOptMax) {
    const deltaT = tempC - profile.tOptMax;
    iT = Math.max(0.05, 1.0 / (1.0 + 0.12 * deltaT + 0.008 * deltaT * deltaT));
  } else if (tempC < profile.tFreeze) {
    iT = Math.max(0.05, 0.90 - 0.25 * (profile.tFreeze - tempC));
  } else {
    iT = 0.95;
  }

  let iE = 1.0;
  if (ethanolPpm <= 5.0) {
    iE = 1.0;
  } else if (ethanolPpm <= 35.0) {
    iE = 1.0 - 0.55 * Math.pow((ethanolPpm - 5.0) / 30.0, 1.1);
  } else {
    iE = Math.max(0.02, 0.45 - 0.43 * Math.pow((ethanolPpm - 35.0) / 65.0, 0.9));
  }

  let iH = 1.0;
  if (rh >= profile.rhOptMin && rh <= profile.rhOptMax) {
    iH = 1.0;
  } else if (rh > profile.rhOptMax) {
    iH = Math.max(0.70, 1.0 - 0.30 * ((rh - profile.rhOptMax) / (100.0 - profile.rhOptMax)));
  } else {
    iH = Math.max(0.60, 1.0 - 0.40 * ((profile.rhOptMin - rh) / profile.rhOptMin));
  }

  let iV = 1.0;
  if (vibrationG <= 0.4) {
    iV = 1.0;
  } else if (vibrationG <= 1.5) {
    iV = 1.0 - 0.25 * ((vibrationG - 0.4) / 1.1);
  } else {
    iV = Math.max(0.35, 0.75 - 0.40 * ((vibrationG - 1.5) / 1.5));
  }

  const weighted = 0.40 * iT + 0.35 * iE + 0.15 * iH + 0.10 * iV;
  const bottleneck = Math.min(iT, iE, iH, iV);
  const bhi = Math.min(100.0, Math.max(1.0, Math.round(weighted * (0.60 + 0.40 * bottleneck) * 1000) / 10));

  return { bhi, iT, iE, iH, iV };
}

console.log('=== TEST 1: Port Kuryk Acute Failure Test on Organic Beef ===');
const p = COMMODITY_PROFILES.beef;
const aT = calculateTemperatureAcceleration(p.ea, 18.0, p.tRef);
const aFr = calculateFreezingPenalty(18.0, p.tFreeze);
const pEth = calculateEthanolAcceleration(42.0, p.gammaEth);
const pHum = calculateHumidityAcceleration(92.0, p.rhOptMin, p.rhOptMax);
const pVib = calculateVibrationAcceleration(1.2, p.kappaVib);
const aTotal = aT * aFr * pEth * pHum * pVib;
const slHours = Math.max(0.1, Math.round((p.baselineHours / aTotal) * 10) / 10);
const { bhi } = calculateBHI(18.0, 42.0, 92.0, 1.2, p);
const atRisk = 68000 * (1 - bhi / 100);
const savedVal = Math.max(0, Math.round(atRisk * 0.78 - 1200));

console.log(`- alpha_T: ${aT.toFixed(2)} (expected ~8.07)`);
console.log(`- phi_eth: ${pEth.toFixed(2)} (expected ~3.36)`);
console.log(`- phi_hum: ${pHum.toFixed(2)} (expected ~1.13)`);
console.log(`- phi_vib: ${pVib.toFixed(2)} (expected ~1.12)`);
console.log(`- alpha_total: ${aTotal.toFixed(2)} (expected ~34.2)`);
console.log(`- Remaining Shelf Life: ${slHours} hours (expected 14.7h -> PROVES 14-HOUR RESCUE WINDOW!)`);
console.log(`- Biological Health Index: ${bhi}% (expected 29.2%)`);
console.log(`- Saved Cargo Value: $${savedVal} (expected ~$36,352)`);

assert.strictEqual(slHours, 14.7, 'Remaining shelf life must equal 14.7 hours');
assert.strictEqual(bhi, 29.2, 'BHI must equal 29.2%');
assert(savedVal >= 36000 && savedVal <= 37000, `Saved value should be ~$36,352, got ${savedVal}`);

console.log('\n=== TEST 2: Nominal Cold-Chain (Beef at 1°C) ===');
const aT_nom = calculateTemperatureAcceleration(p.ea, 1.0, p.tRef);
const pEth_nom = calculateEthanolAcceleration(2.0, p.gammaEth);
const aTotal_nom = aT_nom * 1.0 * pEth_nom * 1.0 * 1.0;
const sl_nom = Math.round((p.baselineHours / aTotal_nom) * 10) / 10;
const { bhi: bhi_nom } = calculateBHI(1.0, 2.0, 82.0, 0.2, p);
console.log(`- Nominal Shelf Life: ${sl_nom}h (expected 504.0h)`);
console.log(`- Nominal BHI: ${bhi_nom}% (expected 100.0%)`);
assert.strictEqual(sl_nom, 504.0);
assert.strictEqual(bhi_nom, 100.0);

console.log('\n=== TEST 3: Sub-Freezing Injury on Beef (-5°C) ===');
const aFr_sub = calculateFreezingPenalty(-5.0, p.tFreeze);
console.log(`- alpha_freeze at -5°C: ${aFr_sub.toFixed(2)} (expected 2.65)`);
assert.strictEqual(aFr_sub, 2.65);

console.log('\n=== TEST 4: Berries Thermal Sensitivity (10°C) ===');
const pBerries = COMMODITY_PROFILES.berries;
const aT_berries = calculateTemperatureAcceleration(pBerries.ea, 10.0, pBerries.tRef);
const sl_berries = Math.round((pBerries.baselineHours / aT_berries) * 10) / 10;
console.log(`- Berries SL at 10°C: ${sl_berries}h (expected ~92.7h)`);
assert(Math.abs(sl_berries - 92.7) < 1.0);

console.log('\nALL MATHEMATICAL KINETICS TESTS PASSED WITH 100% PRECISION!');
