import path from 'path';
import fs from 'fs';
import * as ort from 'onnxruntime-node';

export interface TelemetryPoint {
  temperature: number;
  humidity: number;
  ethanol: number;
  gas: number;
  [key: string]: any;
}

export interface ScalerParams {
  features: string[];
  mean: number[];
  std: number[];
  var?: number[];
  window_size: number;
  target_names?: string[];
}

export interface PredictAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'OPTIMAL';
  type: string;
  message: string;
  action: string;
  timestamp: string;
}

export interface PredictResult {
  success: boolean;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  rul_hours: number;
  predicted_rul: number;
  shelf_life_hours: number;
  shelf_life_days: number;
  health_index: number;
  alerts: PredictAlert[];
  recommended_actions: string[];
  telemetry_summary: {
    temperature: number;
    humidity: number;
    ethanol: number;
    gas: number;
    cargo?: string;
    vibration?: number;
    location?: string;
    [key: string]: any;
  };
  model_metadata: {
    model: string;
    architecture: string;
    window_size: number;
    features: string[];
    version: string;
  };
  timestamp: string;
}

// Fallback scaler parameters matching ml-pipeline/models/scaler_params.json
const DEFAULT_SCALER: ScalerParams = {
  features: ['Temperature', 'Humidity', 'MQ3', 'MQ135'],
  mean: [34.46119212962963, 80.06947916666665, 8.95095833333333, 8.001938657407408],
  std: [2.6053154737412965, 13.536671906447564, 4.286558616890905, 5.538138931740121],
  window_size: 10,
  target_names: ['rul_hours', 'health_index'],
};

let cachedSession: ort.InferenceSession | null = null;
let sessionLoadingPromise: Promise<ort.InferenceSession> | null = null;
let cachedScaler: ScalerParams | null = null;

/**
 * Resolve path to the ONNX model file
 */
export function resolveModelPath(): string {
  const candidates = [
    path.join(process.cwd(), 'public', 'models', 'freshstream_real_rul.onnx'),
    path.join(process.cwd(), 'ml-pipeline', 'models', 'freshstream_real_rul.onnx'),
    path.resolve(process.cwd(), '..', 'ml-pipeline', 'models', 'freshstream_real_rul.onnx'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `ONNX model freshstream_real_rul.onnx not found. Checked: ${candidates.join(', ')}`
  );
}

/**
 * Load and cache scaler parameters from scaler_params.json
 */
export function loadScalerParams(): ScalerParams {
  if (cachedScaler) return cachedScaler;

  const candidates = [
    path.join(process.cwd(), 'public', 'models', 'scaler_params.json'),
    path.join(process.cwd(), 'ml-pipeline', 'models', 'scaler_params.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, 'utf-8');
        cachedScaler = JSON.parse(raw) as ScalerParams;
        return cachedScaler;
      } catch (err) {
        console.warn(`Failed reading scaler params from ${candidate}:`, err);
      }
    }
  }

  cachedScaler = DEFAULT_SCALER;
  return cachedScaler;
}

/**
 * Retrieve or initialize the singleton ONNX InferenceSession
 */
export async function getInferenceSession(): Promise<ort.InferenceSession> {
  if (cachedSession) {
    return cachedSession;
  }

  if (!sessionLoadingPromise) {
    sessionLoadingPromise = (async () => {
      const modelPath = resolveModelPath();
      const session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['cpu'],
        graphOptimizationLevel: 'all',
      });
      cachedSession = session;
      return session;
    })();
  }

  return sessionLoadingPromise;
}

/**
 * Extract normalized single reading point from flexible object format
 */
export function parseTelemetryPoint(raw: any): TelemetryPoint {
  if (!raw || typeof raw !== 'object') {
    return {
      temperature: 34.46,
      humidity: 80.0,
      ethanol: 8.95,
      gas: 8.0,
    };
  }

  // Handle nested readings or flat keys
  const t = raw.temperature ?? raw.temp ?? raw.temperature_c ?? raw.temp_c;
  const h = raw.humidity ?? raw.hum ?? raw.humidity_pct ?? raw.rh;
  const e = raw.ethanol ?? raw.mq3 ?? raw.ethanol_ppm ?? raw.alcohol ?? raw.c2h5oh ?? raw.c2h4;
  const g = raw.gas ?? raw.mq135 ?? raw.gas_ppm ?? raw.air_quality ?? raw.co2 ?? raw.nh3 ?? raw.voc;

  return {
    temperature: typeof t === 'number' && Number.isFinite(t) ? t : 34.46,
    humidity: typeof h === 'number' && Number.isFinite(h) ? h : 80.0,
    ethanol: typeof e === 'number' && Number.isFinite(e) ? e : 8.95,
    gas: typeof g === 'number' && Number.isFinite(g) ? g : 8.0,
    cargo: raw.cargo,
    vibration: raw.vibration,
    location: raw.location ?? raw.waypoint,
    cargo_value_usd: raw.cargo_value_usd,
  };
}

/**
 * Build 10-step sequence from flexible payload
 */
export function extractSequence(body: any, windowSize: number = 10): TelemetryPoint[] {
  let rawSeq: any[] | null = null;

  if (Array.isArray(body)) {
    rawSeq = body;
  } else if (body && typeof body === 'object') {
    if (Array.isArray(body.sequence)) {
      rawSeq = body.sequence;
    } else if (Array.isArray(body.telemetry_sequence)) {
      rawSeq = body.telemetry_sequence;
    } else if (Array.isArray(body.readings)) {
      rawSeq = body.readings;
    }
  }

  if (rawSeq && rawSeq.length > 0) {
    const parsed = rawSeq.map((item) => {
      if (Array.isArray(item)) {
        return {
          temperature: Number(item[0] ?? 34.46),
          humidity: Number(item[1] ?? 80.0),
          ethanol: Number(item[2] ?? 8.95),
          gas: Number(item[3] ?? 8.0),
        };
      }
      return parseTelemetryPoint(item);
    });

    // Pad if shorter than windowSize
    while (parsed.length < windowSize) {
      parsed.unshift({ ...parsed[0] });
    }

    // Slice last windowSize if longer
    if (parsed.length > windowSize) {
      return parsed.slice(-windowSize);
    }

    return parsed;
  }

  // Single reading provided — replicate across all windowSize steps
  const single = parseTelemetryPoint(body);
  return Array.from({ length: windowSize }, () => ({ ...single }));
}

/**
 * Run ML Inference on input telemetry payload
 */
export async function runMLInference(body: any): Promise<PredictResult> {
  const scaler = loadScalerParams();
  const windowSize = scaler.window_size || 10;
  const sequence = extractSequence(body, windowSize);

  // Normalize features into Float32Array [1, windowSize, 4]
  const flatData = new Float32Array(windowSize * 4);
  for (let i = 0; i < windowSize; i++) {
    const pt = sequence[i];
    const rawVals = [pt.temperature, pt.humidity, pt.ethanol, pt.gas];
    for (let f = 0; f < 4; f++) {
      const mean = scaler.mean[f] ?? 0;
      const std = scaler.std[f] && scaler.std[f] > 0 ? scaler.std[f] : 1;
      flatData[i * 4 + f] = (rawVals[f] - mean) / std;
    }
  }

  // Execute ONNX model
  const session = await getInferenceSession();
  const inputName = session.inputNames[0] || 'telemetry_sequence';
  const tensor = new ort.Tensor('float32', flatData, [1, windowSize, 4]);

  const output = await session.run({ [inputName]: tensor });

  const rawRul = Number((output.rul.data as Float32Array)[0]);
  const rawHealth = Number((output.health_index.data as Float32Array)[0]);

  const rulHours = Math.max(0, Math.round(rawRul * 10) / 10);
  const healthIndex = Math.min(100, Math.max(0, Math.round(rawHealth * 10) / 10));
  const shelfLifeDays = Math.max(0, Math.round((rulHours / 24) * 10) / 10);

  // Analyze latest telemetry reading for anomaly alerts
  const latest = sequence[sequence.length - 1];
  const alerts: PredictAlert[] = [];
  const now = new Date().toISOString();

  // 1. Ethanol / Fermentation Alert
  if (latest.ethanol > 35) {
    alerts.push({
      id: `alert-eth-${Date.now()}-1`,
      severity: 'CRITICAL',
      type: 'FERMENTATION_ALERT',
      message: `Critical fermentation detected: Ethanol emissions at ${latest.ethanol.toFixed(1)} ppm exceed the 35 ppm biological threshold.`,
      action: 'Initiate emergency reefer ventilation and purge atmospheric gases immediately.',
      timestamp: now,
    });
  } else if (latest.ethanol > 18) {
    alerts.push({
      id: `alert-eth-${Date.now()}-2`,
      severity: 'WARNING',
      type: 'ETHANOL_WARNING',
      message: `Elevated ethanol level (${latest.ethanol.toFixed(1)} ppm) indicates onset of anaerobic fermentation.`,
      action: 'Check reefer airflow circulation and monitor volatile gas trends closely.',
      timestamp: now,
    });
  }

  // 2. Temperature Excursions
  if (latest.temperature > 25) {
    alerts.push({
      id: `alert-temp-${Date.now()}-1`,
      severity: 'CRITICAL',
      type: 'TEMPERATURE_BREACH_CRITICAL',
      message: `Acute temperature excursion: ${latest.temperature.toFixed(1)}°C exceeds critical biological threshold (25°C).`,
      action: 'Engage secondary compressor override and inspect cooling unit power supply.',
      timestamp: now,
    });
  } else if (latest.temperature > 8) {
    alerts.push({
      id: `alert-temp-${Date.now()}-2`,
      severity: 'WARNING',
      type: 'TEMPERATURE_WARNING',
      message: `Temperature reading (${latest.temperature.toFixed(1)}°C) above recommended cold-chain ceiling (8°C).`,
      action: 'Inspect container door gaskets and verify reefer thermostat setpoint.',
      timestamp: now,
    });
  } else if (latest.temperature < -5) {
    alerts.push({
      id: `alert-temp-${Date.now()}-3`,
      severity: 'WARNING',
      type: 'FREEZING_EXCURSION',
      message: `Sub-zero chill excursion (${latest.temperature.toFixed(1)}°C) may trigger cellular freezing damage.`,
      action: 'Adjust reefer cycle to maintain non-freezing cold storage regime.',
      timestamp: now,
    });
  }

  // 3. Spoilage Gas Volatiles (MQ135)
  if (latest.gas > 20) {
    alerts.push({
      id: `alert-gas-${Date.now()}-1`,
      severity: 'WARNING',
      type: 'GAS_VOLATILES_WARNING',
      message: `Elevated volatile organic gas detected (${latest.gas.toFixed(1)} ppm/kΩ), indicating active protein decomposition.`,
      action: 'Prepare contingency routing to nearest domestic staging depot.',
      timestamp: now,
    });
  }

  // 4. Biological Health Index & RUL Depletion
  if (healthIndex < 40 || rulHours < 12) {
    alerts.push({
      id: `alert-rul-${Date.now()}-1`,
      severity: 'CRITICAL',
      type: 'RAPID_SPOILAGE_RISK',
      message: `Remaining Useful Life critically depleted (${rulHours}h remaining, Health Index: ${healthIndex}%).`,
      action: 'Reroute shipment to nearest port of entry or immediate local auction to salvage cargo value.',
      timestamp: now,
    });
  } else if (healthIndex < 65 || rulHours < 36) {
    alerts.push({
      id: `alert-rul-${Date.now()}-2`,
      severity: 'WARNING',
      type: 'SPOILAGE_WARNING',
      message: `Degradation acceleration detected (Health Index: ${healthIndex}%, RUL: ${rulHours}h).`,
      action: 'Prioritize customs inspection at next transit terminal for express discharge.',
      timestamp: now,
    });
  }

  // Determine overall status
  const hasCritical = alerts.some((a) => a.severity === 'CRITICAL');
  const hasWarning = alerts.some((a) => a.severity === 'WARNING');
  const overallStatus = hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : 'OPTIMAL';

  // Extract recommended actions
  const actionSet = new Set<string>();
  for (const a of alerts) {
    actionSet.add(a.action);
  }
  if (actionSet.size === 0) {
    actionSet.add('Maintain standard reefer operating profile and routine continuous telemetry monitoring.');
  }

  return {
    success: true,
    status: overallStatus,
    rul_hours: rulHours,
    predicted_rul: rulHours,
    shelf_life_hours: rulHours,
    shelf_life_days: shelfLifeDays,
    health_index: healthIndex,
    alerts,
    recommended_actions: Array.from(actionSet),
    telemetry_summary: {
      temperature: latest.temperature,
      humidity: latest.humidity,
      ethanol: latest.ethanol,
      gas: latest.gas,
      cargo: latest.cargo,
      vibration: latest.vibration,
      location: latest.location,
    },
    model_metadata: {
      model: 'freshstream_real_rul.onnx',
      architecture: '1D-CNN + LSTM Dual-Head Hybrid',
      window_size: windowSize,
      features: scaler.features,
      version: '2.0.0',
    },
    timestamp: now,
  };
}
