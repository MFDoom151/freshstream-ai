import { CargoType, RouteWaypoint, AlertSeverity, TelemetryInput, KineticsOutput } from '../types/arrhenius';

export interface CommodityProfile {
  type: CargoType;
  name: string;
  regionalOrigin: string;
  spoilageMechanism: string;
  ea: number;             // J/mol
  a: number;              // 1/h
  lnA: number;
  tRef: number;           // °C
  tOptMin: number;        // °C
  tOptMax: number;        // °C
  tFreeze: number;        // °C
  baselineHours: number;  // hours
  baselineDays: number;   // days
  kRef: number;           // 1/h
  rhOptMin: number;       // %
  rhOptMax: number;       // %
  gammaEth: number;       // ethanol sensitivity factor
  kappaVib: number;       // vibration sensitivity factor
  defaultCargoValueUsd: number; // USD
}

export const COMMODITY_PROFILES: Record<CargoType, CommodityProfile> = {
  beef: {
    type: 'beef',
    name: 'Organic Chilled Beef',
    regionalOrigin: 'KazBeef Kostanay Export',
    spoilageMechanism: 'Psychrotrophic Pseudomonas & Metmyoglobin Oxidation',
    ea: 81500,
    a: 6.7077e12,
    lnA: 29.534,
    tRef: 1.0,
    tOptMin: -1.0,
    tOptMax: 2.0,
    tFreeze: -1.7,
    baselineHours: 504,
    baselineDays: 21,
    kRef: 0.001984,
    rhOptMin: 80,
    rhOptMax: 85,
    gammaEth: 1.8,
    kappaVib: 0.15,
    defaultCargoValueUsd: 68000,
  },
  berries: {
    type: 'berries',
    name: 'Fresh Strawberries & Raspberries',
    regionalOrigin: 'Almaty Agro High-Respiration',
    spoilageMechanism: 'Botrytis cinerea Gray Mold & Rapid Pectin Breakdown',
    ea: 68500,
    a: 4.6784e10,
    lnA: 24.568,
    tRef: 2.0,
    tOptMin: 0.0,
    tOptMax: 3.0,
    tFreeze: -0.8,
    baselineHours: 216,
    baselineDays: 9,
    kRef: 0.004629,
    rhOptMin: 90,
    rhOptMax: 95,
    gammaEth: 1.6,
    kappaVib: 0.60,
    defaultCargoValueUsd: 38000,
  },
  dairy: {
    type: 'dairy',
    name: 'Fresh Pasteurized Dairy',
    regionalOrigin: 'Amiran Regional Creamery',
    spoilageMechanism: 'Psychrotrophic Bacillus Proteolysis & Lactic Acidification',
    ea: 92000,
    a: 6.5101e14,
    lnA: 34.108,
    tRef: 4.0,
    tOptMin: 1.0,
    tOptMax: 4.0,
    tFreeze: -0.5,
    baselineHours: 336,
    baselineDays: 14,
    kRef: 0.002976,
    rhOptMin: 70,
    rhOptMax: 85,
    gammaEth: 1.5,
    kappaVib: 0.20,
    defaultCargoValueUsd: 32000,
  },
  fruits: {
    type: 'fruits',
    name: 'Fresh Tree Fruits & Apples',
    regionalOrigin: 'Zhetysu Aport Orchards',
    spoilageMechanism: 'Climacteric Ethylene Burst & Polygalacturonase Softening',
    ea: 58000,
    a: 1.3000e8,
    lnA: 18.683,
    tRef: 3.0,
    tOptMin: 0.5,
    tOptMax: 4.0,
    tFreeze: -1.5,
    baselineHours: 720,
    baselineDays: 30,
    kRef: 0.001389,
    rhOptMin: 85,
    rhOptMax: 95,
    gammaEth: 1.4,
    kappaVib: 0.35,
    defaultCargoValueUsd: 28000,
  },
  pears: {
    type: 'pears',
    name: 'Asian & Mountain Pears (Pyrus pyrifolia)',
    regionalOrigin: 'Almaty & Foothill Terraces',
    spoilageMechanism: 'Pectin Hydrolysis, Core Browning & Ethylene Softening',
    ea: 72000,
    a: 2.1400e11,
    lnA: 26.09,
    tRef: 0.8,
    tOptMin: -0.5,
    tOptMax: 1.5,
    tFreeze: -1.8,
    baselineHours: 840,
    baselineDays: 35,
    kRef: 0.001190,
    rhOptMin: 90,
    rhOptMax: 95,
    gammaEth: 1.6,
    kappaVib: 0.28,
    defaultCargoValueUsd: 74000,
  },
};

const R = 8.314; // Universal gas constant in J/(mol·K)

export function calculateTemperatureAcceleration(ea: number, tempC: number, tRefC: number): number {
  const tKelvin = tempC + 273.15;
  const tRefKelvin = tRefC + 273.15;
  return Math.exp((ea / R) * (1 / tRefKelvin - 1 / tKelvin));
}

export function calculateFreezingPenalty(tempC: number, tFreezeC: number): number {
  if (tempC < tFreezeC) {
    return 1.0 + 0.5 * (tFreezeC - tempC);
  }
  return 1.0;
}

export function calculateEthanolAcceleration(ethanolPpm: number, gammaEth: number): number {
  if (ethanolPpm > 5.0) {
    return 1.0 + gammaEth * Math.pow((ethanolPpm - 5.0) / 30.0, 1.3);
  }
  return 1.0;
}

export function calculateHumidityAcceleration(rh: number, rhOptMin: number, rhOptMax: number): number {
  if (rh > rhOptMax) {
    return 1.0 + 0.6 * Math.pow((rh - rhOptMax) / (100.0 - rhOptMax), 2);
  }
  if (rh < rhOptMin) {
    return 1.0 + 0.3 * ((rhOptMin - rh) / rhOptMin);
  }
  return 1.0;
}

export function calculateVibrationAcceleration(vibrationG: number, kappaVib: number): number {
  if (vibrationG > 0.4) {
    return 1.0 + kappaVib * Math.pow(vibrationG - 0.4, 1.2);
  }
  return 1.0;
}

export function calculateBHI(
  tempC: number,
  ethanolPpm: number,
  rh: number,
  vibrationG: number,
  profile: CommodityProfile
): {
  bhi: number;
  subScores: { temperature: number; ethanol: number; humidity: number; vibration: number };
} {
  // 1. Temperature Vitality Sub-Index (I_T)
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

  // 2. Biogenic Ethanol Sub-Index (I_E)
  let iE = 1.0;
  if (ethanolPpm <= 5.0) {
    iE = 1.0;
  } else if (ethanolPpm <= 35.0) {
    iE = 1.0 - 0.55 * Math.pow((ethanolPpm - 5.0) / 30.0, 1.1);
  } else {
    iE = Math.max(0.02, 0.45 - 0.43 * Math.pow((ethanolPpm - 35.0) / 65.0, 0.9));
  }

  // 3. Moisture Equilibrium Sub-Index (I_H)
  let iH = 1.0;
  if (rh >= profile.rhOptMin && rh <= profile.rhOptMax) {
    iH = 1.0;
  } else if (rh > profile.rhOptMax) {
    iH = Math.max(0.70, 1.0 - 0.30 * ((rh - profile.rhOptMax) / (100.0 - profile.rhOptMax)));
  } else {
    iH = Math.max(0.60, 1.0 - 0.40 * ((profile.rhOptMin - rh) / profile.rhOptMin));
  }

  // 4. Mechanical Shock Sub-Index (I_V)
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

  return {
    bhi,
    subScores: {
      temperature: Math.round(iT * 100),
      ethanol: Math.round(iE * 100),
      humidity: Math.round(iH * 100),
      vibration: Math.round(iV * 100),
    },
  };
}

export function generateDecayCurve(
  kEff: number,
  kRef: number,
  maxHours = 480,
  stepHours = 20
): Array<{ time_hours: number; quality_remaining: number; baseline_quality: number }> {
  const points = [];
  for (let t = 0; t <= maxHours; t += stepHours) {
    const qActual = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-kEff * t) * 10) / 10));
    const qBase = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-kRef * t) * 10) / 10));
    points.push({
      time_hours: t,
      quality_remaining: qActual,
      baseline_quality: qBase,
    });
  }
  return points;
}

export function calculateKinetics(input: TelemetryInput): KineticsOutput {
  const cargoKey = (input.cargo || 'beef').toLowerCase() as CargoType;
  const profile = COMMODITY_PROFILES[cargoKey] || COMMODITY_PROFILES.beef;

  const temp = typeof input.temperature === 'number' ? input.temperature : profile.tRef;
  const ethanol = typeof input.ethanol === 'number' ? input.ethanol : 4.0;
  const humidity = typeof input.humidity === 'number' ? input.humidity : (profile.rhOptMin + profile.rhOptMax) / 2;
  const vibration = typeof input.vibration === 'number' ? input.vibration : 0.3;
  const cargoVal = typeof input.cargo_value_usd === 'number' ? input.cargo_value_usd : profile.defaultCargoValueUsd;
  const waypoint = (input.waypoint || 'kuryk') as RouteWaypoint;

  // 1. Acceleration factors
  const alphaT = calculateTemperatureAcceleration(profile.ea, temp, profile.tRef);
  const alphaFreeze = calculateFreezingPenalty(temp, profile.tFreeze);
  const phiEth = calculateEthanolAcceleration(ethanol, profile.gammaEth);
  const phiHum = calculateHumidityAcceleration(humidity, profile.rhOptMin, profile.rhOptMax);
  const phiVib = calculateVibrationAcceleration(vibration, profile.kappaVib);

  const alphaTotal = alphaT * alphaFreeze * phiEth * phiHum * phiVib;
  const kEff = profile.kRef * alphaTotal;

  // 2. Remaining Shelf Life
  const slHours = Math.max(0.1, Math.round((profile.baselineHours / alphaTotal) * 10) / 10);
  const slDays = Math.round((slHours / 24.0) * 10) / 10;

  // 3. Biological Health Index
  const { bhi } = calculateBHI(temp, ethanol, humidity, vibration, profile);

  // 4. Critical checks & Rescue Window
  const isEthanolCritical = ethanol > 35.0;
  const isThermalBreach = temp > 15.0;
  const isSubFreezing = temp < profile.tFreeze;

  // 14-Hour Rescue Window calculation
  let rescueWindowHours: number | undefined;
  if (isEthanolCritical || slHours < 36.0) {
    rescueWindowHours = Math.min(14.7, Math.max(2.0, slHours));
  }

  // 5. Alert Severity & Decisions
  let alertSeverity: AlertSeverity = 'OPTIMAL';
  let alertTitle = 'Nominal Cold Chain Integrity Maintained';
  let alertDesc = 'Respiration rates within baseline parameters. Inter-container mesh active.';
  const actions: string[] = [
    `Maintain setpoint ${profile.tRef > 0 ? `+${profile.tRef.toFixed(1)}` : profile.tRef.toFixed(1)}°C`,
    'Continue 15-min LoRaWAN telemetry heartbeat'
  ];

  if (isEthanolCritical) {
    alertSeverity = 'CRITICAL';
    alertTitle = `CRITICAL FERMENTATION DETECTED (${ethanol.toFixed(1)} ppm C₂H₄)`;
    alertDesc = `Active anaerobic cellular respiration detected. Immediate intervention required within ${rescueWindowHours?.toFixed(1)}h rescue window.`;
    actions.length = 0;
    actions.push(`Force cooling override setpoint to ${(profile.tFreeze + 0.3).toFixed(1)}°C`);
    actions.push('Open secondary ethylene exhaust purge');
    actions.push(`Divert to ${waypoint === 'kuryk' ? 'Port Kuryk / Aktau Cold Depot' : 'nearest corridor cold storage'} for blast freezing`);
  } else if (isThermalBreach || ethanol > 20.0) {
    alertSeverity = 'WARNING';
    alertTitle = `Thermal Drift Breach (${temp.toFixed(1)}°C)`;
    alertDesc = 'Internal compartment temperature elevated above safe envelope. Microbial proliferation accelerating.';
    actions.length = 0;
    actions.push('Activate auxiliary evaporator fan high-speed circulation');
    actions.push('Pre-cool container prior to Caspian Sea ferry hold embarkation');
  } else if (isSubFreezing) {
    alertSeverity = 'WARNING';
    alertTitle = `Sub-Freezing Chilling Injury (${temp.toFixed(1)}°C)`;
    alertDesc = `Temperature below critical freezing point (${profile.tFreeze}°C). Ice crystal tissue formation imminent.`;
    actions.length = 0;
    actions.push('Cycle electric defrost heaters to raise pulp temp above +0.5°C');
  } else if (vibration > 1.8) {
    alertSeverity = 'WARNING';
    alertTitle = `Excessive Mechanical Shock (${vibration.toFixed(1)} G)`;
    alertDesc = 'Severe road or rail impact detected. High risk of fruit bruising and cellular leakage.';
    actions.length = 0;
    actions.push('Alert transport operator to reduce speed over rough rail track');
  } else if (humidity > profile.rhOptMax + 5) {
    alertSeverity = 'WARNING';
    alertTitle = `Condensation & Mold Risk (${Math.round(humidity)}% RH)`;
    alertDesc = 'High relative humidity detected. Condensation risk on packaging surface.';
    actions.length = 0;
    actions.push('Activate dehumidification pulse cycle');
  }

  // 6. Saved Value Calculation
  const atRiskVal = cargoVal * (1.0 - bhi / 100.0);
  const salvageEfficiency = 0.78;
  const operationalCost = 1200;
  const savedValue = bhi < 85 ? Math.max(0, Math.round(atRiskVal * salvageEfficiency - operationalCost)) : 0;

  // 7. Generate Decay Curve
  const decayCurve = generateDecayCurve(kEff, profile.kRef, 480, 20);

  return {
    shelf_life_hours: slHours,
    shelf_life_days: slDays,
    health_index: bhi,
    acceleration_factor: Math.round(alphaTotal * 100) / 100,
    k_rate: Number(kEff.toFixed(6)),
    is_ethanol_critical: isEthanolCritical,
    rescue_window_hours: rescueWindowHours,
    alert_severity: alertSeverity,
    alert_title: alertTitle,
    alert_description: alertDesc,
    recommended_actions: actions,
    saved_value_usd: savedValue,
    decay_curve: decayCurve,
  };
}
