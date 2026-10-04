/**
 * Alert Deduplication and Rules Engine
 */

export class AlertDeduplicator {
  constructor(cooldownSeconds = 300) {
    this.cooldownMs = cooldownSeconds * 1000;
    this.dispatched = new Map(); // key -> { timestamp, severity }
  }

  /**
   * Determine whether an alert should be dispatched based on cooldown & severity escalation
   */
  shouldDispatch(shipmentId, alertType, severity = 'WARNING') {
    const key = `${shipmentId}:${alertType}`;
    const now = Date.now();
    const existing = this.dispatched.get(key);

    if (!existing) {
      this.dispatched.set(key, { timestamp: now, severity });
      return true;
    }

    // Escalation bypass: If existing was WARNING and new is CRITICAL, bypass cooldown immediately
    if (existing.severity === 'WARNING' && severity === 'CRITICAL') {
      this.dispatched.set(key, { timestamp: now, severity });
      return true;
    }

    // If within cooldown period, suppress duplicate
    if (now - existing.timestamp < this.cooldownMs) {
      return false;
    }

    this.dispatched.set(key, { timestamp: now, severity });
    return true;
  }

  clear() {
    this.dispatched.clear();
  }
}

/**
 * Format alert payload into high-visibility Telegram Markdown
 */
export function formatTelegramAlert(alertData) {
  const {
    shipmentId,
    severity = 'CRITICAL',
    type = 'ANOMALY',
    message,
    action,
    location,
    metrics = {},
  } = alertData;

  const isCritical = severity === 'CRITICAL';
  const icon = isCritical ? '🚨' : '⚠️';
  const headline = isCritical ? 'CRITICAL ANOMALY ALERT' : 'WARNING NOTIFICATION';

  let text = `${icon} *${headline} — FreshStream AI Conductor*\n\n`;
  text += `📦 *Shipment*: \`${shipmentId}\`\n`;
  if (location) text += `📍 *Location / Waypoint*: ${location}\n`;
  text += `⚠️ *Alert Type*: ${type.replace(/_/g, ' ')}\n`;
  text += `📝 *Diagnosis*: ${message}\n\n`;

  if (metrics.temperature != null || metrics.ethanol != null || metrics.predictedRulHours != null) {
    text += `📊 *Active Telemetry & Predictions*:\n`;
    if (metrics.temperature != null) text += `• Temperature: \`${metrics.temperature}°C\`\n`;
    if (metrics.humidity != null) text += `• Humidity: \`${metrics.humidity}%\`\n`;
    if (metrics.ethanol != null) text += `• Ethanol Volatiles: \`${metrics.ethanol} ppm\`\n`;
    if (metrics.bhi != null) text += `• Biological Health Index: \`${metrics.bhi}%\`\n`;
    if (metrics.predictedRulHours != null) text += `• Remaining Useful Life: *${metrics.predictedRulHours} Hours*\n`;
    text += `\n`;
  }

  if (action) {
    text += `⚡ *AI Conductor Prescribed Intervention*:\n`;
    text += `_${action}_\n\n`;
  }

  text += `⏱ _Timestamp: ${new Date().toISOString()}_`;

  return text;
}
