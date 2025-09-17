import type http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

type Conn = WebSocket & { listingId?: string };

export function attachRealtime(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws: Conn) => {
    ws.on('message', (buf) => {
      try {
        const msg = JSON.parse(String(buf));
        if (msg?.type === 'subscribe' && typeof msg.listingId === 'string') {
          ws.listingId = msg.listingId;
        }
      } catch {}
    });
  });

  function broadcast(msg: any, listingId?: string) {
    const json = JSON.stringify(msg);
    wss.clients.forEach((client) => {
      const c = client as Conn;
      if (client.readyState !== WebSocket.OPEN) return;
      if (listingId && c.listingId && c.listingId !== listingId) return;
      client.send(json);
    });
  }

  return { wss, broadcast };
}
