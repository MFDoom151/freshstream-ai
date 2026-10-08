import { NextRequest, NextResponse } from 'next/server';
import { calculateKinetics, COMMODITY_PROFILES } from '@/lib/arrhenius';
import { CargoType, RouteWaypoint, TelemetryInput } from '@/types/arrhenius';

interface ValidationError {
  field: string;
  message: string;
}

export async function GET() {
  const defaultTelemetry: TelemetryInput = {
    cargo: 'beef',
    temperature: 1.0,
    ethanol: 2.0,
    humidity: 82.0,
    vibration: 0.2,
    cargo_value_usd: 68000,
    waypoint: 'kuryk',
  };

  const sampleResult = calculateKinetics(defaultTelemetry);

  return NextResponse.json({
    status: 'ok',
    service: 'FreshStream AI Arrhenius Kinetics REST API',
    version: '1.2.0',
    model: 'Physics-Informed Arrhenius Degradation Model (PIML)',
    description: 'Calculates instantaneous degradation rate k(T), remaining shelf life, and autonomous intervention directives for Trans-Caspian agri-logistics.',
    supported_commodities: Object.keys(COMMODITY_PROFILES),
    endpoints: {
      post: '/api/arrhenius',
      alias: '/api/shelf-life',
    },
    sample_request: {
      cargo: 'beef',
      temperature: 18.0,
      ethanol: 42.0,
      humidity: 92.0,
      vibration: 1.2,
      location: 'Port Kuryk',
      cargo_value_usd: 68000,
    },
    sample_calculation: sampleResult,
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          status: 'error',
          error_code: 'INVALID_JSON_BODY',
          message: 'Request body must be valid JSON.',
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          status: 'error',
          error_code: 'INVALID_PAYLOAD',
          message: 'Request payload must be a JSON object.',
        },
        { status: 400 }
      );
    }

    const errors: ValidationError[] = [];

    // 1. Cargo validation
    let cargoKey: CargoType = 'beef';
    if (body.cargo !== undefined) {
      if (typeof body.cargo !== 'string') {
        errors.push({ field: 'cargo', message: 'Field "cargo" must be a string.' });
      } else {
        const normalized = body.cargo.toLowerCase().trim();
        if (normalized === 'berries' || normalized === 'beef' || normalized === 'dairy' || normalized === 'fruits') {
          cargoKey = normalized as CargoType;
        } else {
          errors.push({
            field: 'cargo',
            message: `Invalid cargo '${body.cargo}'. Supported: 'berries', 'beef', 'dairy', 'fruits'.`,
          });
        }
      }
    }

    // 2. Temperature validation
    let temperature: number = 2.0;
    if (body.temperature === undefined) {
      errors.push({ field: 'temperature', message: 'Missing required field "temperature".' });
    } else if (typeof body.temperature !== 'number' || !Number.isFinite(body.temperature)) {
      errors.push({ field: 'temperature', message: 'Field "temperature" must be a valid number.' });
    } else if (body.temperature < -15.0 || body.temperature > 50.0) {
      errors.push({ field: 'temperature', message: 'Field "temperature" must be between -15°C and 50°C.' });
    } else {
      temperature = body.temperature;
    }

    // 3. Ethanol validation
    let ethanol: number = 4.0;
    if (body.ethanol === undefined) {
      errors.push({ field: 'ethanol', message: 'Missing required field "ethanol".' });
    } else if (typeof body.ethanol !== 'number' || !Number.isFinite(body.ethanol)) {
      errors.push({ field: 'ethanol', message: 'Field "ethanol" must be a valid number.' });
    } else if (body.ethanol < 0.0 || body.ethanol > 200.0) {
      errors.push({ field: 'ethanol', message: 'Field "ethanol" must be between 0 and 200 ppm.' });
    } else {
      ethanol = body.ethanol;
    }

    // 4. Humidity validation
    let humidity: number = 85.0;
    if (body.humidity === undefined) {
      errors.push({ field: 'humidity', message: 'Missing required field "humidity".' });
    } else if (typeof body.humidity !== 'number' || !Number.isFinite(body.humidity)) {
      errors.push({ field: 'humidity', message: 'Field "humidity" must be a valid number.' });
    } else if (body.humidity < 10.0 || body.humidity > 100.0) {
      errors.push({ field: 'humidity', message: 'Field "humidity" must be between 10% and 100%.' });
    } else {
      humidity = body.humidity;
    }

    // 5. Vibration validation
    let vibration: number = 0.3;
    if (body.vibration === undefined) {
      errors.push({ field: 'vibration', message: 'Missing required field "vibration".' });
    } else if (typeof body.vibration !== 'number' || !Number.isFinite(body.vibration)) {
      errors.push({ field: 'vibration', message: 'Field "vibration" must be a valid number.' });
    } else if (body.vibration < 0.0 || body.vibration > 10.0) {
      errors.push({ field: 'vibration', message: 'Field "vibration" must be between 0 and 10 G.' });
    } else {
      vibration = body.vibration;
    }

    // 6. Optional location/waypoint
    let waypoint: RouteWaypoint = 'kuryk';
    const locInput = body.waypoint || body.location;
    if (locInput !== undefined) {
      const locStr = String(locInput).toLowerCase();
      if (locStr.includes('baku')) waypoint = 'baku';
      else if (locStr.includes('poti')) waypoint = 'poti';
      else if (locStr.includes('istanbul')) waypoint = 'istanbul';
      else waypoint = 'kuryk';
    }

    // 7. Optional cargo value
    const profile = COMMODITY_PROFILES[cargoKey];
    let cargoValue = profile.defaultCargoValueUsd;
    if (body.cargo_value_usd !== undefined) {
      if (typeof body.cargo_value_usd === 'number' && Number.isFinite(body.cargo_value_usd) && body.cargo_value_usd > 0) {
        cargoValue = body.cargo_value_usd;
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          status: 'error',
          error_code: 'INVALID_TELEMETRY_PAYLOAD',
          message: 'Validation failed for Arrhenius telemetry parameters.',
          errors,
        },
        { status: 400 }
      );
    }

    // Execute kinetics computation
    const inputTelemetry: TelemetryInput = {
      cargo: cargoKey,
      temperature,
      ethanol,
      humidity,
      vibration,
      cargo_value_usd: cargoValue,
      waypoint,
    };

    const result = calculateKinetics(inputTelemetry);

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      // Top-level schema matching R2 requirements and test verification
      shelf_life_hours: result.shelf_life_hours,
      shelf_life_days: result.shelf_life_days,
      health_index: result.health_index,
      is_ethanol_critical: result.is_ethanol_critical,
      rescue_window_hours: result.rescue_window_hours,
      alert_severity: result.alert_severity,
      alert_title: result.alert_title,
      alert_description: result.alert_description,
      recommended_actions: result.recommended_actions,
      saved_value_usd: result.saved_value_usd,
      acceleration_factor: result.acceleration_factor,
      k_rate: result.k_rate,
      decay_curve: result.decay_curve,
      // Nested detailed fields per FS-SPEC-ARRHENIUS-001 specification
      cargo: {
        type: profile.type,
        name: profile.name,
        activation_energy_j_mol: profile.ea,
        activation_energy_kj_mol: profile.ea / 1000,
        pre_exponential_factor_a: profile.a,
        optimal_temp_c: profile.tRef,
        baseline_shelf_life_hours: profile.baselineHours,
        baseline_shelf_life_days: profile.baselineDays,
        cargo_value_usd: cargoValue,
      },
      telemetry: {
        temperature_c: temperature,
        temperature_k: temperature + 273.15,
        ethanol_ppm: ethanol,
        humidity_pct: humidity,
        vibration_g: vibration,
        location: waypoint,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        status: 'error',
        error_code: 'INTERNAL_CALCULATION_ERROR',
        message: 'Failed to process Arrhenius calculation',
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}
