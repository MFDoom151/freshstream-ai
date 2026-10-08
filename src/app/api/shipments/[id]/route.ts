import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getShipmentById } from '@/lib/shipments-data';
import { ShipmentItem } from '@/types/shipment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shipmentId = id.toUpperCase();

    // Query database with recent telemetry logs
    const dbShipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        telemetryLogs: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    });

    if (dbShipment) {
      const latestLog = dbShipment.telemetryLogs?.[0];
      const alert = dbShipment.alertSeverity && dbShipment.alertMessage ? {
        severity: dbShipment.alertSeverity as 'WARNING' | 'CRITICAL',
        message: dbShipment.alertMessage,
        timestamp: dbShipment.alertTimestamp || 'Recent',
        action: dbShipment.alertAction || 'Monitor parameters',
        location: dbShipment.alertLocation || dbShipment.waypointName,
      } : undefined;

      const formattedShipment: ShipmentItem = {
        id: dbShipment.id,
        cargo: dbShipment.cargo as ShipmentItem['cargo'],
        cargoNameEn: dbShipment.cargoNameEn,
        exporter: dbShipment.exporter,
        carrier: dbShipment.carrier,
        origin: dbShipment.origin,
        destination: dbShipment.destination,
        currentWaypoint: dbShipment.currentWaypoint as ShipmentItem['currentWaypoint'],
        waypointName: dbShipment.waypointName,
        assetValueUsd: dbShipment.assetValueUsd,
        departureDate: dbShipment.departureDate,
        eta: dbShipment.eta,
        bhi: latestLog?.bhi ?? dbShipment.bhi,
        predictedRulHours: latestLog?.predictedRulHours ?? dbShipment.predictedRulHours,
        status: (latestLog?.status ?? dbShipment.status) as ShipmentItem['status'],
        telemetry: {
          temperature: latestLog?.temperature ?? dbShipment.temperature ?? 4.0,
          humidity: latestLog?.humidity ?? dbShipment.humidity ?? 85.0,
          ethanol: latestLog?.ethanol ?? dbShipment.ethanol ?? 5.0,
          vibration: latestLog?.vibration ?? dbShipment.vibration ?? 0.2,
        },
        alert,
      };

      return NextResponse.json({
        success: true,
        shipment: formattedShipment,
        telemetryLogs: dbShipment.telemetryLogs,
        source: 'database',
      });
    }

    // Fallback to static shipments
    const fallbackShipment = getShipmentById(shipmentId);
    if (fallbackShipment) {
      return NextResponse.json({
        success: true,
        shipment: fallbackShipment,
        telemetryLogs: [],
        source: 'fallback',
      });
    }

    return NextResponse.json(
      { success: false, error: `Shipment ${shipmentId} not found` },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in /api/shipments/[id]:', error);
    try {
      const { id } = await params;
      const fallbackShipment = getShipmentById(id.toUpperCase());
      if (fallbackShipment) {
        return NextResponse.json({
          success: true,
          shipment: fallbackShipment,
          telemetryLogs: [],
          source: 'fallback_error',
        });
      }
    } catch {}
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
