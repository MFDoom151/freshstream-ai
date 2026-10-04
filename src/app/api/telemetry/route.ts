import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runMLInference } from '@/lib/ml/inference';
import { broadcaster } from '@/lib/telemetry/broadcaster';
import { StreamEventPayload } from '@/lib/telemetry/stream-types';

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Missing or malformed request body' },
        { status: 400 }
      );
    }

    const shipmentId = String(body.shipmentId || body.shipment_id || 'FS-8821').toUpperCase();
    const timestamp = body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString();

    // Map fields with flexible aliases
    const tempRaw = body.temperature ?? body.temp ?? body.temperature_c ?? body.temp_c ?? 4.0;
    const humRaw = body.humidity ?? body.hum ?? body.humidity_pct ?? body.rh ?? 85.0;
    const ethRaw = body.ethanol ?? body.mq3 ?? body.ethanol_ppm ?? body.alcohol ?? 3.5;
    const gasRaw = body.gas ?? body.mq135 ?? body.gas_ppm ?? body.air_quality ?? 4.5;
    const vibRaw = body.vibration ?? body.vib ?? body.shock ?? 0.2;

    const temperature = Number(tempRaw);
    const humidity = Number(humRaw);
    const ethanol = Number(ethRaw);
    const gas = Number(gasRaw);
    const vibration = Number(vibRaw);

    const location = body.location || body.waypoint || 'kuryk';
    const cargo = body.cargo || 'beef';

    // 1. Run live ONNX ML inference
    const prediction = await runMLInference({
      temperature,
      humidity,
      ethanol,
      gas,
      vibration,
      location,
      cargo,
      sequence: body.sequence || body.telemetry_sequence,
    });

    const status = prediction.status || 'OPTIMAL';
    const bhi = prediction.health_index;
    const predictedRulHours = prediction.rul_hours;

    // 2. Persist to Prisma DB (TelemetryLog & Shipment update) with graceful fallback
    try {
      // Create telemetry log entry
      await prisma.telemetryLog.create({
        data: {
          shipmentId,
          timestamp: new Date(timestamp),
          temperature,
          humidity,
          ethanol,
          vibration,
          bhi,
          predictedRulHours,
          status,
          source: body.source || 'EMULATOR',
        },
      });

      // Update parent shipment if existing
      const topAlert = prediction.alerts?.[0];
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          temperature,
          humidity,
          ethanol,
          vibration,
          bhi,
          predictedRulHours,
          status,
          alertSeverity: topAlert ? topAlert.severity : null,
          alertMessage: topAlert ? topAlert.message : null,
          alertAction: topAlert ? topAlert.action : null,
          alertTimestamp: topAlert ? topAlert.timestamp : null,
          alertLocation: location,
        },
      }).catch(() => {
        // If shipment doesn't exist in DB, non-fatal
      });
    } catch (dbErr) {
      console.warn('TelemetryLog database persistence warning:', dbErr);
    }

    // 3. Broadcast to in-memory hub for real-time SSE listeners
    const streamPayload: StreamEventPayload = {
      success: true,
      shipmentId,
      timestamp,
      telemetry: {
        temperature,
        humidity,
        ethanol,
        gas,
        vibration,
        cargo,
        location,
      },
      prediction,
    };

    broadcaster.broadcast(streamPayload);

    // 4. Return ingestion contract response
    return NextResponse.json(streamPayload, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/telemetry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal telemetry processing error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shipmentId = searchParams.get('shipmentId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Try DB first
    try {
      const logs = await prisma.telemetryLog.findMany({
        where: shipmentId ? { shipmentId: shipmentId.toUpperCase() } : undefined,
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      if (logs && logs.length > 0) {
        return NextResponse.json({
          success: true,
          count: logs.length,
          logs,
          source: 'database',
        });
      }
    } catch {}

    // Fallback to broadcaster in-memory recent buffer
    const recent = broadcaster.getRecentReadings(shipmentId || undefined);
    return NextResponse.json({
      success: true,
      count: recent.length,
      logs: recent.slice(0, limit),
      source: 'memory_broadcaster',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed fetching telemetry' },
      { status: 500 }
    );
  }
}
