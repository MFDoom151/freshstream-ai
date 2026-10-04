#!/usr/bin/env node
/**
 * FreshStream AI — Telegram AI Conductor Alert Bot Entrypoint
 */

import { AlertDeduplicator } from './alerts.js';
import { TelegramClient } from './telegram.js';
import { BackendMonitor } from './monitor.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
const cooldownSeconds = parseInt(process.env.COOLDOWN_SECONDS || '300', 10);
const pollIntervalMs = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10);

console.log('========================================================================');
console.log('       FRESHSTREAM AI — TELEGRAM AI CONDUCTOR ALERT BOT');
console.log('========================================================================');
console.log(` Backend Target  : ${baseUrl}`);
console.log(` Alert Cooldown  : ${cooldownSeconds}s`);
console.log(` Polling Interval: ${pollIntervalMs}ms`);
console.log(` Mode            : ${token && !token.includes('Example') ? 'LIVE DISPATCH' : 'DRY-RUN (Local Logging)'}`);
console.log('------------------------------------------------------------------------');

const deduplicator = new AlertDeduplicator(cooldownSeconds);
const telegramClient = new TelegramClient(token, chatId);
const monitor = new BackendMonitor(baseUrl, deduplicator, telegramClient, pollIntervalMs);

// Start monitoring backend
monitor.start();

// Graceful termination
const shutdown = () => {
  console.log('\n[BOT] Shutting down Telegram bot gracefully...');
  monitor.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
