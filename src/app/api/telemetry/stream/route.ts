import { broadcaster } from '@/lib/telemetry/broadcaster';
import { StreamEventPayload } from '@/lib/telemetry/stream-types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shipmentId = searchParams.get('shipmentId')?.toUpperCase() || undefined;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected event
      const connectMessage = `event: connected\ndata: ${JSON.stringify({
        status: 'connected',
        shipmentId: shipmentId || 'all',
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(connectMessage));

      // 2. If recent readings exist for this shipment, send latest immediately
      const recent = broadcaster.getRecentReadings(shipmentId);
      if (recent.length > 0) {
        const latest = recent[0];
        const initialData = `event: telemetry\ndata: ${JSON.stringify(latest)}\n\n`;
        controller.enqueue(encoder.encode(initialData));
      }

      // 3. Listener callback for real-time broadcasts
      const listener = (data: StreamEventPayload) => {
        try {
          const sseChunk = `event: telemetry\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(sseChunk));
        } catch (err) {
          console.error('Error enqueuing SSE chunk:', err);
        }
      };

      // Subscribe to broadcaster
      const unsubscribe = broadcaster.subscribe(listener, shipmentId);

      // 4. Periodic heartbeat ping (every 15 seconds)
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      // 5. Clean up on client disconnection
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
