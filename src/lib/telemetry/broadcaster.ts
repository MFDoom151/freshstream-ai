import { EventEmitter } from 'events';
import { StreamEventPayload, AlertEvent } from './stream-types';

declare global {
  // eslint-disable-next-line no-var
  var __telemetryBroadcaster: TelemetryBroadcasterHub | undefined;
}

export class TelemetryBroadcasterHub extends EventEmitter {
  private recentPayloads: Map<string, StreamEventPayload[]> = new Map();
  private recentAlerts: AlertEvent[] = [];
  private maxHistoryPerShipment: number = 50;
  private maxAlertsHistory: number = 100;

  constructor() {
    super();
    // Allow higher listener threshold for multiple concurrent dashboard & SSE connections
    this.setMaxListeners(200);
  }

  /**
   * Broadcast a live telemetry reading with ML prediction
   */
  public broadcast(payload: StreamEventPayload): void {
    const { shipmentId } = payload;

    // Maintain rolling buffer per shipment
    if (!this.recentPayloads.has(shipmentId)) {
      this.recentPayloads.set(shipmentId, []);
    }
    const history = this.recentPayloads.get(shipmentId)!;
    history.push(payload);
    if (history.length > this.maxHistoryPerShipment) {
      history.shift();
    }

    // Emit global and shipment-specific events
    this.emit('telemetry', payload);
    this.emit(`telemetry:${shipmentId}`, payload);

    // Process alerts from prediction
    if (payload.prediction?.alerts && payload.prediction.alerts.length > 0) {
      for (const alert of payload.prediction.alerts) {
        const alertEvent: AlertEvent = {
          id: alert.id || `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          shipmentId,
          severity: alert.severity,
          type: alert.type,
          message: alert.message,
          action: alert.action,
          timestamp: alert.timestamp || payload.timestamp,
          location: payload.telemetry.location,
        };

        this.recentAlerts.unshift(alertEvent);
        if (this.recentAlerts.length > this.maxAlertsHistory) {
          this.recentAlerts.pop();
        }

        this.emit('alert', alertEvent);
        this.emit(`alert:${shipmentId}`, alertEvent);
      }
    }
  }

  /**
   * Subscribe to telemetry events
   */
  public subscribe(
    listener: (data: StreamEventPayload) => void,
    shipmentId?: string
  ): () => void {
    const eventName = shipmentId ? `telemetry:${shipmentId}` : 'telemetry';
    this.on(eventName, listener);
    return () => {
      this.off(eventName, listener);
    };
  }

  /**
   * Subscribe specifically to alert events
   */
  public subscribeAlerts(
    listener: (alert: AlertEvent) => void,
    shipmentId?: string
  ): () => void {
    const eventName = shipmentId ? `alert:${shipmentId}` : 'alert';
    this.on(eventName, listener);
    return () => {
      this.off(eventName, listener);
    };
  }

  /**
   * Get latest telemetry readings for a shipment or across all shipments
   */
  public getRecentReadings(shipmentId?: string): StreamEventPayload[] {
    if (shipmentId) {
      return this.recentPayloads.get(shipmentId) || [];
    }
    const all: StreamEventPayload[] = [];
    for (const list of this.recentPayloads.values()) {
      all.push(...list);
    }
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get recent alert events
   */
  public getRecentAlerts(limit: number = 20): AlertEvent[] {
    return this.recentAlerts.slice(0, limit);
  }
}

// Global singleton instance preserved across HMR and route invocations
export const broadcaster: TelemetryBroadcasterHub =
  globalThis.__telemetryBroadcaster ?? (globalThis.__telemetryBroadcaster = new TelemetryBroadcasterHub());

export default broadcaster;
