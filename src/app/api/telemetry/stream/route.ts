import { broadcaster } from '@/lib/telemetry/broadcaster';
import { StreamEventPayload } from '@/lib/telemetry/stream-types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shipmentId = searchParams.get('shipmentId')?.toUpperCase() || undefined;

  const encoder = new TextEncoder();

  let isClosed = false;
  let pingInterval: NodeJS.Timeout | null = null;
  let maxDurationTimer: NodeJS.Timeout | null = null;
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;

        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        if (maxDurationTimer) {
          clearTimeout(maxDurationTimer);
          maxDurationTimer = null;
        }
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        try {
          controller.close();
        } catch {
          // Controller might already be closed or errored
        }
      };

      // 1. Send initial connected event
      try {
        const connectMessage = `event: connected\ndata: ${JSON.stringify({
          status: 'connected',
          shipmentId: shipmentId || 'all',
          timestamp: new Date().toISOString(),
        })}\n\n`;
        controller.enqueue(encoder.encode(connectMessage));
      } catch {
        cleanup();
        return;
      }

      // 2. If recent readings exist for this shipment, send latest immediately
      const recent = broadcaster.getRecentReadings(shipmentId);
      if (recent.length > 0) {
        try {
          const latest = recent[0];
          const initialData = `event: telemetry\ndata: ${JSON.stringify(latest)}\n\n`;
          controller.enqueue(encoder.encode(initialData));
        } catch {
          cleanup();
          return;
        }
      }

      // 3. Listener callback for real-time broadcasts with immediate cleanup on failure
      const listener = (data: StreamEventPayload) => {
        if (isClosed) return;
        try {
          const sseChunk = `event: telemetry\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(sseChunk));
        } catch {
          cleanup();
        }
      };

      // Subscribe to broadcaster
      unsubscribe = broadcaster.subscribe(listener, shipmentId);

      // 4. Fast heartbeat ping (every 5 seconds) to detect severed sockets immediately
      pingInterval = setInterval(() => {
        if (isClosed) {
          if (pingInterval) clearInterval(pingInterval);
          return;
        }
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          cleanup();
        }
      }, 5000);

      // 5. Maximum connection lifetime (180s) to gracefully recycle long-lived sockets
      maxDurationTimer = setTimeout(() => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode('event: reconnect\ndata: {"reason":"session_max_duration"}\n\n'));
          } catch {
            // Ignore write error during timeout
          }
          cleanup();
        }
      }, 180000);

      // 6. Listen for request abort
      if (request.signal.aborted) {
        cleanup();
      } else {
        request.signal.addEventListener('abort', cleanup, { once: true });
      }
    },

    // 7. Explicit stream cancellation handler when client aborts downstream response
    cancel() {
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      if (maxDurationTimer) {
        clearTimeout(maxDurationTimer);
        maxDurationTimer = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      isClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
