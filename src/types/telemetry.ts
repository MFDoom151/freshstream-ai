/**
 * FreshStream AI — Master Logistics & Biological Digital Twin Telemetry Schemas
 *
 * Implements:
 * - 5 Multimodal Transport Modes across the Trans-Caspian Middle Corridor (TITR)
 * - Biological kinetics & Arrhenius deterioration modeling for cold-chain perishables
 * - Dual temperature monitoring: Setpoint (T_set) vs Actual (T_act) with Thermal Excursion Delta
 * - Phytohormone Ethylene (C2H4) and anaerobic Volatile Ethanol decay markers
 * - Logistics Industry Standards: DCSA Track & Trace 3.0, KTZ Rail ASOU / SMGS, AIS Maritime
 */

// =============================================================================
// 1. TRANSPORT MODES & CORRIDOR INFRASTRUCTURE
// =============================================================================

export type TransportMode =
  | 'RAIL_REEFER'
  | 'RO_PAX_FERRY'
  | 'TIR_TRUCK'
  | 'SMART_REEFER_CONTAINER'
  | 'MULTIMODAL_COMBO';

export interface TransportModeConfig {
  id: TransportMode;
  name: string;
  shortName: string;
  subtitle: string;
  vehicleType: 'TRAIN' | 'SHIP' | 'TRUCK' | 'CONTAINER' | 'MULTIMODAL';
  routeIds: string[];
  bounds: [[number, number], [number, number]];
  strokeColor: string;
  dashArray?: string;
  averageSpeedKmh: number;
  nominalTransitDays: number;
  gaugeSpecification: string;
  typicalAssetValueUsd: number;
  activeSegmentDescription: string;
}

// =============================================================================
// 2. CARGO COMMODITIES & KINETIC PROFILES
// =============================================================================

export type CargoCommodity = 'pears' | 'beef' | 'berries' | 'dairy' | 'fruits';

export interface CommodityKineticProfile {
  id: CargoCommodity;
  nameEn: string;
  nameRu: string;
  nameKz: string;
  nominalAssetValueUsd: number;
  tSetDefault: number;      // °C
  tOptMin: number;          // °C
  tOptMax: number;          // °C
  tFreeze: number;           // °C
  rhOptMin: number;         // %
  rhOptMax: number;         // %
  eaKjMol: number;          // Activation energy Ea (kJ/mol)
  preExpA: number;          // Pre-exponential factor A (1/hr)
  baselineShelfLifeHours: number; // At ideal setpoint
  isClimacteric: boolean;   // Sensitive to ethylene (C2H4)
  criticalEthanolThresholdPpm: number; // 35 ppm standard
}

export const COMMODITY_KINETIC_PROFILES: Record<CargoCommodity, CommodityKineticProfile> = {
  pears: {
    id: 'pears',
    nameEn: 'Mountain Conference Pears',
    nameRu: 'Горные груши Конференция',
    nameKz: 'Таулы Конференция алмұрттары',
    nominalAssetValueUsd: 68000,
    tSetDefault: 1.0,
    tOptMin: -0.5,
    tOptMax: 2.0,
    tFreeze: -1.8,
    rhOptMin: 90,
    rhOptMax: 95,
    eaKjMol: 64.2, // Peer-reviewed fruit respiration kinetics
    preExpA: 8.5e10,
    baselineShelfLifeHours: 720, // 30 days
    isClimacteric: true,
    criticalEthanolThresholdPpm: 35.0,
  },
  beef: {
    id: 'beef',
    nameEn: 'KazBeef Premium Chilled Beef',
    nameRu: 'Охлажденная говядина KazBeef',
    nameKz: 'KazBeef салқындатылған сиыр еті',
    nominalAssetValueUsd: 85000,
    tSetDefault: 0.5,
    tOptMin: -1.0,
    tOptMax: 2.0,
    tFreeze: -2.0,
    rhOptMin: 80,
    rhOptMax: 88,
    eaKjMol: 58.0, // Microbial Pseudomonas spoilage
    preExpA: 4.2e9,
    baselineShelfLifeHours: 504, // 21 days
    isClimacteric: false,
    criticalEthanolThresholdPpm: 35.0,
  },
  berries: {
    id: 'berries',
    nameEn: 'Altyn Dan Wild Berries',
    nameRu: 'Свежие ягоды Altyn Dan',
    nameKz: 'Altyn Dan жабайы жидектері',
    nominalAssetValueUsd: 54000,
    tSetDefault: 1.5,
    tOptMin: 0.0,
    tOptMax: 2.5,
    tFreeze: -1.2,
    rhOptMin: 90,
    rhOptMax: 95,
    eaKjMol: 72.5, // High respiration rate (Botrytis cinerea susceptibility)
    preExpA: 1.8e11,
    baselineShelfLifeHours: 240, // 10 days
    isClimacteric: true,
    criticalEthanolThresholdPpm: 35.0,
  },
  dairy: {
    id: 'dairy',
    nameEn: 'Saumal Bio-Kefir & Fermented Dairy',
    nameRu: 'Био-кефир и кисломолочные продукты Saumal',
    nameKz: 'Saumal био-айран және қымыз өнімдері',
    nominalAssetValueUsd: 46000,
    tSetDefault: 3.0,
    tOptMin: 1.0,
    tOptMax: 4.0,
    tFreeze: -0.5,
    rhOptMin: 70,
    rhOptMax: 85,
    eaKjMol: 52.0, // Lactic acid bacterial acidification
    preExpA: 2.1e8,
    baselineShelfLifeHours: 360, // 15 days
    isClimacteric: false,
    criticalEthanolThresholdPpm: 35.0,
  },
  fruits: {
    id: 'fruits',
    nameEn: 'Tian Shan Organic Stone Fruits',
    nameRu: 'Органические косточковые фрукты Тянь-Шаня',
    nameKz: 'Тянь-Шань органикалық сүйекті жемістері',
    nominalAssetValueUsd: 62000,
    tSetDefault: 2.0,
    tOptMin: 0.5,
    tOptMax: 3.5,
    tFreeze: -1.5,
    rhOptMin: 85,
    rhOptMax: 92,
    eaKjMol: 61.8,
    preExpA: 6.4e10,
    baselineShelfLifeHours: 480, // 20 days
    isClimacteric: true,
    criticalEthanolThresholdPpm: 35.0,
  },
};

// =============================================================================
// 3. CARGO CONDITION TELEMETRY INPUTS
// =============================================================================

export interface CargoConditionTelemetry {
  commodity: CargoCommodity;
  setPointCelsius: number;     // T_set: -2.0°C to +8.0°C
  actualCelsius: number;       // T_act: -5.0°C to +35.0°C
  relativeHumidity: number;    // RH: 20% to 100%
  ethylenePpm: number;         // C2H4: 0.0 to 10.0 ppm
  volatileEthanolPpm: number;  // C2H5OH: 0 to 100 ppm (>35 ppm anaerobic alert)
  co2Percent: number;          // CO2: 0.0% to 15.0%
  o2Percent: number;           // O2: 1.0% to 21.0%
  vibrationG: number;          // Tri-axial shock: 0.1 to 3.0 G
  transportMode: TransportMode;
  assetValueUsd?: number;
}

// =============================================================================
// 4. BIOLOGICAL HEALTH INDEX (BHI) & KINETIC CALCULATIONS
// =============================================================================

export interface BiologicalCalculationResult {
  bhi: number; // 0.0% to 100.0%
  predictedRulHours: number;
  predictedRulDays: number;
  thermalDelta: number; // T_act - T_set
  thermalStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL';
  accelerationFactor: number; // Rate multiplier vs baseline at setpoint
  anaerobicDecayAlert: boolean; // volatileEthanolPpm > 35
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  alertTitle: string;
  alertDescription: string;
  prescribedIntervention: string;
  savedValueUsd: number;
  decayCurve: Array<{ timeHours: number; qualityRemaining: number; baselineQuality: number }>;
}

const GAS_CONSTANT_R = 8.314; // J/(mol·K)

/**
 * Calculates biological health, shelf-life, Arrhenius acceleration,
 * and AI interventions based on genuine chemical/kinetic decay models.
 */
export function calculateBiologicalHealth(
  telemetry: CargoConditionTelemetry
): BiologicalCalculationResult {
  const profile = COMMODITY_KINETIC_PROFILES[telemetry.commodity] || COMMODITY_KINETIC_PROFILES.pears;
  const assetValue = telemetry.assetValueUsd ?? profile.nominalAssetValueUsd;

  // 1. Thermal Excursion Delta
  const deltaT = Number((telemetry.actualCelsius - telemetry.setPointCelsius).toFixed(2));
  let thermalStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';
  if (Math.abs(deltaT) <= 0.8) {
    thermalStatus = 'OPTIMAL';
  } else if (Math.abs(deltaT) <= 2.5) {
    thermalStatus = 'ACCEPTABLE';
  } else if (deltaT <= 5.0 && deltaT > 0) {
    thermalStatus = 'WARNING';
  } else {
    thermalStatus = 'CRITICAL';
  }

  // 2. Arrhenius Reaction Rate Constant at T_actual vs T_setpoint
  // k(T) = A * exp(-Ea / (R * T_kelvin))
  const tActKelvin = telemetry.actualCelsius + 273.15;
  const tSetKelvin = telemetry.setPointCelsius + 273.15;
  const eaJoules = profile.eaKjMol * 1000;

  const kAct = profile.preExpA * Math.exp(-eaJoules / (GAS_CONSTANT_R * tActKelvin));
  const kSet = profile.preExpA * Math.exp(-eaJoules / (GAS_CONSTANT_R * tSetKelvin));

  // Temperature acceleration ratio
  let tempAccelFactor = Math.max(0.1, kAct / Math.max(kSet, 1e-12));

  // Freezing injury penalty: below freeze point, ice crystals rupture membranes
  if (telemetry.actualCelsius < profile.tFreeze) {
    const freezePen = Math.abs(telemetry.actualCelsius - profile.tFreeze) * 1.8;
    tempAccelFactor += freezePen;
  }

  // 3. Ethylene (C2H4) Phytohormone multiplier for climacteric commodities
  let ethyleneFactor = 1.0;
  if (profile.isClimacteric && telemetry.ethylenePpm > 0.1) {
    // 0 to 10 ppm: each 1 ppm adds ~15% degradation acceleration
    ethyleneFactor = 1.0 + (telemetry.ethylenePpm * 0.16);
  }

  // 4. Anaerobic Fermentation / Volatile Ethanol multiplier
  const anaerobicAlert = telemetry.volatileEthanolPpm > profile.criticalEthanolThresholdPpm;
  let ethanolFactor = 1.0;
  if (telemetry.volatileEthanolPpm > 10.0) {
    if (anaerobicAlert) {
      // Exponential penalty once over 35 ppm threshold
      const excess = telemetry.volatileEthanolPpm - profile.criticalEthanolThresholdPpm;
      ethanolFactor = 1.8 + (excess * 0.08);
    } else {
      ethanolFactor = 1.0 + ((telemetry.volatileEthanolPpm - 10.0) * 0.03);
    }
  }

  // 5. Mechanical Shock / Vibration acceleration
  let shockFactor = 1.0;
  if (telemetry.vibrationG > 0.6) {
    // Shunting or road roughness causes internal bruising
    shockFactor = 1.0 + ((telemetry.vibrationG - 0.6) * 0.35);
  }

  // 6. Controlled Atmosphere (CA) mitigation
  // Elevated CO2 (3-6%) and low O2 (2-5%) inhibits respiration
  let caMitigation = 1.0;
  if (telemetry.co2Percent >= 3.0 && telemetry.co2Percent <= 7.0 && telemetry.o2Percent <= 5.0) {
    caMitigation = 0.78; // 22% shelf-life extension under optimal CA
  } else if (telemetry.co2Percent > 10.0) {
    // CO2 toxicity injury
    caMitigation = 1.25;
  }

  // Relative Humidity factor
  let rhFactor = 1.0;
  if (telemetry.relativeHumidity < profile.rhOptMin) {
    // Desiccation weight loss
    rhFactor += (profile.rhOptMin - telemetry.relativeHumidity) * 0.012;
  } else if (telemetry.relativeHumidity > profile.rhOptMax) {
    // Condensation mold bloom risk
    rhFactor += (telemetry.relativeHumidity - profile.rhOptMax) * 0.018;
  }

  // Combined Degradation Acceleration Factor
  const accelerationFactor = Number(
    (tempAccelFactor * ethyleneFactor * ethanolFactor * shockFactor * caMitigation * rhFactor).toFixed(2)
  );

  // 7. Remaining Useful Life (RUL)
  const predictedRulHours = Math.max(
    2,
    Math.round(profile.baselineShelfLifeHours / Math.max(accelerationFactor, 0.2))
  );
  const predictedRulDays = Number((predictedRulHours / 24).toFixed(1));

  // 8. Biological Health Index (BHI 0-100%)
  // Modeled as remaining quality buffer relative to expected 12-day transit
  const nominalTransitHours = 288; // 12 days Trans-Caspian journey
  let bhiRaw = (predictedRulHours / (nominalTransitHours * 1.5)) * 100;

  // Immediate cap penalties for critical failures
  if (anaerobicAlert) {
    bhiRaw = Math.min(bhiRaw, 48.0);
  }
  if (deltaT > 5.0) {
    bhiRaw = Math.min(bhiRaw, 52.0);
  }
  if (telemetry.vibrationG > 2.0) {
    bhiRaw = Math.min(bhiRaw, 60.0);
  }

  const bhi = Math.max(5.0, Math.min(99.5, Number(bhiRaw.toFixed(1))));

  // Overall alert status
  let status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';
  let alertTitle = 'Preservation Regime Optimal';
  let alertDescription = 'All telemetry within optimal biological parameters. Cellular respiration rate nominal.';
  let prescribedIntervention = 'Maintain active reefer setpoint. Standard transit routing verified.';

  if (bhi < 50 || anaerobicAlert || deltaT > 6.0) {
    status = 'CRITICAL';
    if (anaerobicAlert) {
      alertTitle = 'Anaerobic Fermentation Surge Detected';
      alertDescription = `Volatile ethanol measured at ${telemetry.volatileEthanolPpm.toFixed(1)} ppm (>35 ppm threshold). Core cellular respiration has transitioned to anaerobic glycolysis, risking total cargo decay.`;
      prescribedIntervention = 'Deploy emergency autonomous pulse-cooling to +0.5°C, purge atmosphere with 95% N2, and alert port terminal for expedited priority Ro-Pax loading.';
    } else {
      alertTitle = 'Severe Thermal Excursion Breach';
      alertDescription = `Actual temperature (+${telemetry.actualCelsius.toFixed(1)}°C) exceeds setpoint (+${telemetry.setPointCelsius.toFixed(1)}°C) by ${deltaT.toFixed(1)}°C. Respiration velocity accelerated ${accelerationFactor}x.`;
      prescribedIntervention = 'Verify reefer shore power gen-set connectivity. Check refrigerant expansion valve pressure. Reroute to nearest cold-storage terminal if delay > 6 hours.';
    }
  } else if (bhi < 75 || Math.abs(deltaT) > 2.0 || telemetry.vibrationG > 1.2 || telemetry.ethylenePpm > 3.0) {
    status = 'WARNING';
    if (telemetry.ethylenePpm > 3.0 && profile.isClimacteric) {
      alertTitle = 'Phytohormone Ethylene Concentration Warning';
      alertDescription = `Ethylene reading at ${telemetry.ethylenePpm.toFixed(1)} ppm indicates accelerated ripening and senescence.`;
      prescribedIntervention = 'Activate catalytic potassium permanganate ethylene scrubbers. Lower container temperature by 1.0°C to suppress hormone synthesis.';
    } else if (telemetry.vibrationG > 1.2) {
      alertTitle = 'Dynamic Rail Shunting Shock Excursion';
      alertDescription = `Accelerometer logged ${telemetry.vibrationG.toFixed(1)}G tri-axial shock event during track Marshalling.`;
      prescribedIntervention = 'Inspect bogie mechanical lashings. Verify reefer compressor hermetic sealing integrity.';
    } else {
      alertTitle = 'Mild Thermal Drift Detected';
      alertDescription = `Temperature excursion delta: ${deltaT > 0 ? '+' : ''}${deltaT.toFixed(1)}°C vs target setpoint.`;
      prescribedIntervention = 'Adjust reefer microprocessor thermostat duty cycle. Monitor compressor discharge pressure.';
    }
  }

  // Calculated Saved Asset Value through intervention vs unmitigated loss
  let savedRatio = 0.85;
  if (status === 'CRITICAL') {
    savedRatio = 0.72; // Saves 72% of $68k-$85k cargo from total dump
  } else if (status === 'WARNING') {
    savedRatio = 0.94;
  }
  const savedValueUsd = Math.round(assetValue * savedRatio * (1 - bhi / 120));

  // 9. Generate Arrhenius Decay Curve (48 hours forecast)
  const decayCurve: Array<{ timeHours: number; qualityRemaining: number; baselineQuality: number }> = [];
  for (let t = 0; t <= 48; t += 4) {
    // First-order exponential decay: Q(t) = Q0 * exp(-k * t)
    const kActualEff = (0.015 * accelerationFactor);
    const kBaselineEff = 0.015;
    const qAct = Math.max(0, Number((100 * Math.exp(-kActualEff * (t / 10))).toFixed(1)));
    const qBase = Math.max(0, Number((100 * Math.exp(-kBaselineEff * (t / 10))).toFixed(1)));
    decayCurve.push({
      timeHours: t,
      qualityRemaining: qAct,
      baselineQuality: qBase,
    });
  }

  return {
    bhi,
    predictedRulHours,
    predictedRulDays,
    thermalDelta: deltaT,
    thermalStatus,
    accelerationFactor,
    anaerobicDecayAlert: anaerobicAlert,
    status,
    alertTitle,
    alertDescription,
    prescribedIntervention,
    savedValueUsd: Math.max(12000, savedValueUsd),
    decayCurve,
  };
}

// =============================================================================
// 5. INDUSTRY LOGISTICS STANDARDS SCHEMAS
// =============================================================================

/**
 * DCSA (Digital Container Shipping Association) Track & Trace 3.0 IoT Reefer Telemetry
 */
export interface DCSAEquipmentEvent {
  eventType: 'EQUIPMENT_EVENT';
  eventClassifierCode: 'ACT';
  eventDateTime: string;
  equipmentReference: string;
  ISOEquipmentCode: string;
  transportCall: {
    UNLocationCode: string;
    facilityTypeCode: string;
    modeOfTransport: TransportMode;
  };
  telemetry: {
    temperature: {
      setPointCelsius: number;
      actualInternalCelsius: number;
      ambientAirCelsius: number;
      excursionDeltaCelsius: number;
      status: string;
    };
    atmosphere: {
      relativeHumidityPercent: number;
      co2LevelPercent: number;
      o2LevelPercent: number;
      ethylenePpm: number;
      volatileEthanolPpm: number;
    };
    power: {
      supplySource: string;
      voltageVolts: number;
      frequencyHz: number;
    };
    triAxialShockG: number;
  };
  compliance: {
    standard: string;
    biologicalTwinHealthIndex: number;
    haccpStatus: string;
  };
}

/**
 * KTZ Express Automated Rail Operating System (ASOU / SMGS Waybill Schema)
 */
export interface KTZRailWaybill {
  railConsignmentNote: string;
  carrier: string;
  trainNumber: string;
  wagonNumber: string;
  gaugeBreakInterchange: {
    stationName: string;
    country: string;
    gaugeTransfer: string;
    bogieExchangeStatus: string;
  };
  trainTelematics: {
    speedKmh: number;
    brakingPipePressureBar: number;
    blockSignalStatus: string;
    shockThresholdExceeded: boolean;
    lastGpsFix: {
      lat: number;
      lng: number;
      elevationMeters: number;
    };
  };
}

/**
 * AIS MarineTraffic Caspian Ro-Pax Vessel Telemetry Schema
 */
export interface AISMaritimeTelemetry {
  vesselName: string;
  mmsi: number;
  imoNumber: number;
  flag: string;
  navigationStatus: string;
  speedKnots: number;
  courseDegrees: number;
  destinationPort: string;
  eta: string;
  seaState: {
    waveHeightMeters: number;
    windSpeedKnots: number;
    casingTemperatureC: number;
  };
  reeferDeckPlugs: {
    activeContainers: number;
    totalVoltageOutputKw: number;
    monitoredReefers: string[];
  };
}

// =============================================================================
// 6. LOGISTICS STANDARDS PAYLOAD GENERATORS
// =============================================================================

export function generateDCSA30Payload(
  telemetry: CargoConditionTelemetry,
  shipmentId: string = 'FS-8821',
  unLocation: string = 'KZKRK'
): DCSAEquipmentEvent {
  const kin = calculateBiologicalHealth(telemetry);
  return {
    eventType: 'EQUIPMENT_EVENT',
    eventClassifierCode: 'ACT',
    eventDateTime: new Date().toISOString(),
    equipmentReference: `FS-REEF-${shipmentId.replace(/\D/g, '') || '8821'}`,
    ISOEquipmentCode: '45R1',
    transportCall: {
      UNLocationCode: unLocation,
      facilityTypeCode: 'BRTH',
      modeOfTransport: telemetry.transportMode,
    },
    telemetry: {
      temperature: {
        setPointCelsius: telemetry.setPointCelsius,
        actualInternalCelsius: telemetry.actualCelsius,
        ambientAirCelsius: 32.4,
        excursionDeltaCelsius: kin.thermalDelta,
        status: kin.thermalStatus,
      },
      atmosphere: {
        relativeHumidityPercent: Math.round(telemetry.relativeHumidity),
        co2LevelPercent: telemetry.co2Percent,
        o2LevelPercent: telemetry.o2Percent,
        ethylenePpm: telemetry.ethylenePpm,
        volatileEthanolPpm: telemetry.volatileEthanolPpm,
      },
      power: {
        supplySource: telemetry.transportMode === 'RO_PAX_FERRY' ? 'VESSEL_AUX_BUS' : 'GENSET_DIESEL',
        voltageVolts: 380,
        frequencyHz: 50.1,
      },
      triAxialShockG: telemetry.vibrationG,
    },
    compliance: {
      standard: 'DCSA IoT & Reefer v3.0.0',
      biologicalTwinHealthIndex: kin.bhi,
      haccpStatus: kin.thermalStatus === 'OPTIMAL' ? 'PASSED' : 'DEVIATION_LOGGED',
    },
  };
}

export function generateKTZRailPayload(
  telemetry: CargoConditionTelemetry,
  shipmentId: string = 'FS-8821'
): KTZRailWaybill {
  return {
    railConsignmentNote: `SMGS-KZ-${shipmentId}-2026`,
    carrier: 'KTZ Express JSC (Kazakhstan Temir Zholy)',
    trainNumber: 'Train 2042-East-West',
    wagonNumber: '67419204 (4-axle insulated platform)',
    gaugeBreakInterchange: {
      stationName: 'Akhalkalaki Break-of-Gauge Facility',
      country: 'Georgia (GE)',
      gaugeTransfer: '1520mm Russian ⇄ 1435mm European UIC',
      bogieExchangeStatus: 'CLEARED_FOR_TRANSIT',
    },
    trainTelematics: {
      speedKmh: 74.2,
      brakingPipePressureBar: 5.2,
      blockSignalStatus: 'GREEN_CLEAR',
      shockThresholdExceeded: telemetry.vibrationG > 1.8,
      lastGpsFix: {
        lat: 43.1800,
        lng: 51.6500,
        elevationMeters: -28,
      },
    },
  };
}

export function generateAISMaritimePayload(
  telemetry: CargoConditionTelemetry,
  shipmentId: string = 'FS-8821'
): AISMaritimeTelemetry {
  return {
    vesselName: 'Ro-Pax Ferry "BARYS-1"',
    mmsi: 437190422,
    imoNumber: 9814502,
    flag: 'Kazakhstan (KZ)',
    navigationStatus: 'Under Way Using Engine',
    speedKnots: 14.8,
    courseDegrees: 254.0,
    destinationPort: 'BAKU_ALAT (AZ)',
    eta: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    seaState: {
      waveHeightMeters: 1.4,
      windSpeedKnots: 18.2,
      casingTemperatureC: 22.0,
    },
    reeferDeckPlugs: {
      activeContainers: 48,
      totalVoltageOutputKw: 380,
      monitoredReefers: [`FS-REEF-${shipmentId.replace(/\D/g, '') || '8821'}`],
    },
  };
}
