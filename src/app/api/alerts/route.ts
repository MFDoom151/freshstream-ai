import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcaster } from '@/lib/telemetry/broadcaster';
import { INITIAL_SHIPMENTS } from '@/lib/shipments-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity')?.toUpperCase();
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // 1. Check in-memory broadcaster alerts
    const broadcasterAlerts = broadcaster.getRecentAlerts(limit);

    // 2. Query active alerts from DB shipments
    let dbAlerts: any[] = [];
    try {
      const activeShipmentAlerts = await prisma.shipment.findMany({
        where: {
          alertSeverity: severity ? severity : { in: ['CRITICAL', 'WARNING'] },
        },
        select: {
          id: true,
          alertSeverity: true,
          alertMessage: true,
          alertAction: true,
          alertTimestamp: true,
          alertLocation: true,
          currentWaypoint: true,
          temperature: true,
          ethanol: true,
          bhi: true,
          predictedRulHours: true,
        },
        take: limit,
      });

      dbAlerts = activeShipmentAlerts.map((s) => ({
        id: `shipment-alert-${s.id}`,
        shipmentId: s.id,
        severity: s.alertSeverity,
        type: s.alertSeverity === 'CRITICAL' ? 'CRITICAL_ANOMALY' : 'WARNING_ANOMALY',
        message: s.alertMessage || `Shipment ${s.id} in ${s.alertSeverity} status`,
        action: s.alertAction || 'Monitor reefer operating profile',
        timestamp: s.alertTimestamp || new Date().toISOString(),
        location: s.alertLocation || s.currentWaypoint,
        metrics: {
          temperature: s.temperature,
          ethanol: s.ethanol,
          bhi: s.bhi,
          predictedRulHours: s.predictedRulHours,
        },
      }));
    } catch {}

    // Fallback static alerts if empty
    if (dbAlerts.length === 0 && broadcasterAlerts.length === 0) {
      const initialWithAlerts = INITIAL_SHIPMENTS.filter((s) => s.alert);
      dbAlerts = initialWithAlerts.map((s) => ({
        id: `static-alert-${s.id}`,
        shipmentId: s.id,
        severity: s.alert!.severity,
        type: 'INITIAL_ANOMALY',
        message: s.alert!.message,
        action: s.alert!.action,
        timestamp: s.alert!.timestamp,
        location: s.alert!.location,
        metrics: {
          temperature: s.telemetry.temperature,
          ethanol: s.telemetry.ethanol,
          bhi: s.bhi,
          predictedRulHours: s.predictedRulHours,
        },
      }));
    }

    // Merge and deduplicate
    const combined = [...broadcasterAlerts, ...dbAlerts];
    const filtered = severity
      ? combined.filter((a) => a.severity === severity)
      : combined;

    return NextResponse.json({
      success: true,
      count: filtered.length,
      alerts: filtered.slice(0, limit),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
