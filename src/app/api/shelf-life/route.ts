import { NextRequest, NextResponse } from 'next/server';
import { calculateKinetics, COMMODITY_PROFILES } from '@/lib/arrhenius';
import { CargoType, RouteWaypoint, TelemetryInput } from '@/types/arrhenius';

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
    service: 'FreshStream AI Shelf-Life API (Arrhenius Alias)',
    version: '1.2.0',
    model: 'Physics-Informed Arrhenius Degradation Model (PIML)',
    supported_commodities: Object.keys(COMMODITY_PROFILES),
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

    // Cargo normalization
    let cargoKey: CargoType = 'beef';
    if (body.cargo) {
      const normalized = String(body.cargo).toLowerCase().trim();
      if (normalized === 'berries' || normalized === 'beef' || normalized === 'dairy' || normalized === 'fruits') {
        cargoKey = normalized as CargoType;
      }
    }

    const temp = typeof body.temperature === 'number' && Number.isFinite(body.temperature) ? body.temperature : 2.0;
    const ethanol = typeof body.ethanol === 'number' && Number.isFinite(body.ethanol) ? body.ethanol : 4.0;
    const humidity = typeof body.humidity === 'number' && Number.isFinite(body.humidity) ? body.humidity : 85.0;
    const vibration = typeof body.vibration === 'number' && Number.isFinite(body.vibration) ? body.vibration : 0.3;
    const profile = COMMODITY_PROFILES[cargoKey];
    const cargoValue = typeof body.cargo_value_usd === 'number' && body.cargo_value_usd > 0
      ? body.cargo_value_usd
      : profile.defaultCargoValueUsd;

    let waypoint: RouteWaypoint = 'kuryk';
    const locInput = body.waypoint || body.location;
    if (locInput) {
      const locStr = String(locInput).toLowerCase();
      if (locStr.includes('baku')) waypoint = 'baku';
      else if (locStr.includes('poti')) waypoint = 'poti';
      else if (locStr.includes('istanbul')) waypoint = 'istanbul';
    }

    const inputTelemetry: TelemetryInput = {
      cargo: cargoKey,
      temperature: temp,
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
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        status: 'error',
        error_code: 'INTERNAL_CALCULATION_ERROR',
        message: 'Failed to process shelf-life calculation',
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}
