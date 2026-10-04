/**
 * Real-Time Telemetry and Alert Stream Monitor
 */

import { formatTelegramAlert } from './alerts.js';

export class BackendMonitor {
  constructor(baseUrl, deduplicator, telegramClient, pollIntervalMs = 5000) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.deduplicator = deduplicator;
    this.telegramClient = telegramClient;
    this.pollIntervalMs = pollIntervalMs;
    this.isPolling = false;
    this.pollTimer = null;
    this.abortController = null;
  }

  /**
   * Start dual-mode monitoring (SSE stream with automatic polling fallback)
   */
  async start() {
    console.log(`[MONITOR] Starting backend listener targeting ${this.baseUrl}...`);
    this.startPolling();
    this.startSSE();
  }

  /**
   * Start Server-Sent Events listener
   */
  async startSSE() {
    const sseUrl = `${this.baseUrl}/api/telemetry/stream`;
    try {
      this.abortController = new AbortController();
      const response = await fetch(sseUrl, {
        headers: { Accept: 'text/event-stream' },
        signal: this.abortController.signal,
      });

      if (!response.ok || !response.body) {
        console.warn(`[MONITOR] SSE connection refused (${response.status}). Polling fallback active.`);
        return;
      }

      console.log(`[MONITOR] Connected to live SSE stream at ${sseUrl}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          this.handleSSEBlock(block);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn(`[MONITOR] SSE stream closed (${err.message}). Retrying in 10s...`);
        setTimeout(() => this.startSSE(), 10000);
      }
    }
  }

  handleSSEBlock(block) {
    const lines = block.split('\n');
    let eventType = 'message';
    let dataStr = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataStr += line.slice(5).trim();
      }
    }

    if (eventType === 'telemetry' && dataStr) {
      try {
        const payload = JSON.parse(dataStr);
        this.processTelemetryPayload(payload);
      } catch (e) {
        // ignore parse errors
      }
    }
  }

  /**
   * Process live telemetry payload and evaluate alerts
   */
  async processTelemetryPayload(payload) {
    if (!payload) return;
    const { shipmentId, telemetry = {}, prediction = {} } = payload;
    const alerts = prediction.alerts || [];

    for (const alert of alerts) {
      if (this.deduplicator.shouldDispatch(shipmentId, alert.type, alert.severity)) {
        const formatted = formatTelegramAlert({
          shipmentId,
          severity: alert.severity,
          type: alert.type,
          message: alert.message,
          action: alert.action,
          location: telemetry.location,
          metrics: {
            temperature: telemetry.temperature,
            humidity: telemetry.humidity,
            ethanol: telemetry.ethanol,
            bhi: prediction.health_index,
            predictedRulHours: prediction.rul_hours,
          },
        });

        await this.telegramClient.sendMessage(formatted);
      }
    }
  }

  /**
   * Fallback polling loop querying /api/alerts
   */
  startPolling() {
    const poll = async () => {
      try {
        const res = await fetch(`${this.baseUrl}/api/alerts?limit=10`);
        if (res.ok) {
          const json = await res.json();
          const alerts = json.alerts || [];

          for (const alert of alerts) {
            const shipmentId = alert.shipmentId || 'UNKNOWN';
            if (this.deduplicator.shouldDispatch(shipmentId, alert.type, alert.severity)) {
              const formatted = formatTelegramAlert({
                shipmentId,
                severity: alert.severity,
                type: alert.type,
                message: alert.message,
                action: alert.action,
                location: alert.location,
                metrics: alert.metrics || {},
              });

              await this.telegramClient.sendMessage(formatted);
            }
          }
        }
      } catch {
        // Quiet on network errors during polling
      }
    };

    // Execute immediately and schedule periodic checks
    poll();
    this.pollTimer = setInterval(poll, this.pollIntervalMs);
  }

  stop() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.abortController) this.abortController.abort();
    console.log('[MONITOR] Backend listener stopped.');
  }
}
