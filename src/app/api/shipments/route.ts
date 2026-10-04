import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { INITIAL_SHIPMENTS } from '@/lib/shipments-data';
import { ShipmentItem } from '@/types/shipment';

export async function GET() {
  try {
    const dbShipments = await prisma.shipment.findMany({
      include: {
        telemetryLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { id: 'asc' },
    });

    if (!dbShipments || dbShipments.length === 0) {
      return NextResponse.json({
        success: true,
        count: INITIAL_SHIPMENTS.length,
        shipments: INITIAL_SHIPMENTS,
        source: 'fallback',
      });
    }

    const shipments: ShipmentItem[] = dbShipments.map((s) => {
      const latestLog = s.telemetryLogs?.[0];
      const alert = s.alertSeverity && s.alertMessage ? {
        severity: s.alertSeverity as 'WARNING' | 'CRITICAL',
        message: s.alertMessage,
        timestamp: s.alertTimestamp || 'Recent',
        action: s.alertAction || 'Monitor parameters',
        location: s.alertLocation || s.waypointName,
      } : undefined;

      return {
        id: s.id,
        cargo: s.cargo as ShipmentItem['cargo'],
        cargoNameEn: s.cargoNameEn,
        exporter: s.exporter,
        carrier: s.carrier,
        origin: s.origin,
        destination: s.destination,
        currentWaypoint: s.currentWaypoint as ShipmentItem['currentWaypoint'],
        waypointName: s.waypointName,
        assetValueUsd: s.assetValueUsd,
        departureDate: s.departureDate,
        eta: s.eta,
        bhi: latestLog?.bhi ?? s.bhi,
        predictedRulHours: latestLog?.predictedRulHours ?? s.predictedRulHours,
        status: (latestLog?.status ?? s.status) as ShipmentItem['status'],
        telemetry: {
          temperature: latestLog?.temperature ?? s.temperature ?? 4.0,
          humidity: latestLog?.humidity ?? s.humidity ?? 85.0,
          ethanol: latestLog?.ethanol ?? s.ethanol ?? 5.0,
          vibration: latestLog?.vibration ?? s.vibration ?? 0.2,
        },
        alert,
      };
    });

    return NextResponse.json({
      success: true,
      count: shipments.length,
      shipments,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching shipments from database:', error);
    // Graceful fallback to static dataset
    return NextResponse.json({
      success: true,
      count: INITIAL_SHIPMENTS.length,
      shipments: INITIAL_SHIPMENTS,
      source: 'fallback_error',
    });
  }
}
