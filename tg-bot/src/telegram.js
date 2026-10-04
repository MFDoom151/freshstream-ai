/**
 * Telegram Bot API Client with Zero-Crash DRY-RUN Fallback
 */

export class TelegramClient {
  constructor(token, chatId) {
    this.token = token && token.trim() !== '' ? token.trim() : null;
    this.chatId = chatId && chatId.trim() !== '' ? chatId.trim() : null;
    this.isDryRun = !this.token || this.token.includes('ExampleToken') || !this.chatId;

    if (this.isDryRun) {
      console.log('------------------------------------------------------------------------');
      console.log(' [TELEGRAM BOT] Running in DRY-RUN mode (Token or Chat ID not configured).');
      console.log(' All alerts will be formatted and logged to stdout without network dispatch.');
      console.log('------------------------------------------------------------------------');
    }
  }

  /**
   * Dispatch formatted message to Telegram Chat or log to stdout
   */
  async sendMessage(text, options = {}) {
    if (this.isDryRun) {
      console.log('\n[TELEGRAM BOT DISPATCH - DRY RUN]');
      console.log(text);
      console.log('------------------------------------------------------------------------\n');
      return { ok: true, dryRun: true };
    }

    const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
    const payload = {
      chat_id: this.chatId,
      text,
      parse_mode: options.parseMode || 'Markdown',
      disable_web_page_preview: true,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!data.ok) {
        console.warn(`[TELEGRAM BOT] API returned error: ${data.description || 'Unknown error'}`);
        // Non-fatal fallback logging
        console.log('[TELEGRAM BOT FALLBACK LOG]:\n', text);
      }
      return data;
    } catch (err) {
      console.error(`[TELEGRAM BOT] Network dispatch failed: ${err.message}`);
      console.log('[TELEGRAM BOT LOCAL LOG]:\n', text);
      return { ok: false, error: err.message };
    }
  }
}
