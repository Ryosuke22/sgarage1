export type RealtimeEvent =
  | { type: 'bid:placed'; listingId: string; price: number }
  | { type: 'auction:extended'; listingId: string; endAt: string };

// Simple websocket client with per-listing subscription
export function connectRealtime(listingId: string, onEvent: (e: RealtimeEvent) => void) {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: 'subscribe', listingId }));
  });
  ws.addEventListener('message', (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (!data || !data.type) return;
      onEvent(data);
    } catch {}
  });
  return ws;
}
