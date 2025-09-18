import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

interface RealtimeEvent {
  type: string;
  [key: string]: any;
}

// WebSocketクライアントに追加プロパティを定義
interface ExtendedWebSocket extends WebSocket {
  listingSubscriptions?: Set<string>;
}

export function attachRealtime(httpServer: Server) {
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });
  
  const clients = new Set<ExtendedWebSocket>();
  
  wss.on('connection', (ws: ExtendedWebSocket) => {
    clients.add(ws);
    console.log('WebSocket client connected. Total clients:', clients.size);
    
    // 接続確認メッセージ
    ws.send(JSON.stringify({
      type: 'connection_established',
      timestamp: new Date().toISOString()
    }));
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // クライアントからのメッセージ処理
        switch (message.type) {
          case 'subscribe_listing':
            // 特定のリスティングを購読
            ws.listingSubscriptions = ws.listingSubscriptions || new Set();
            ws.listingSubscriptions.add(message.listingId);
            break;
            
          case 'unsubscribe_listing':
            // リスティング購読解除
            if (ws.listingSubscriptions) {
              ws.listingSubscriptions.delete(message.listingId);
            }
            break;
            
          case 'ping':
            // キープアライブ
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected. Total clients:', clients.size);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // 全クライアントにブロードキャスト
  function broadcast(event: RealtimeEvent) {
    const message = JSON.stringify(event);
    
    clients.forEach((client: ExtendedWebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        // リスティング固有のイベントの場合、購読しているクライアントのみに送信
        if (event.listingId && client.listingSubscriptions) {
          if (client.listingSubscriptions.has(event.listingId)) {
            client.send(message);
          }
        } else {
          // 全体イベントは全クライアントに送信
          client.send(message);
        }
      }
    });
  }
  
  // 特定リスティングの購読者にブロードキャスト
  function broadcastToListing(listingId: string, event: RealtimeEvent) {
    const message = JSON.stringify({ ...event, listingId });
    
    clients.forEach((client: ExtendedWebSocket) => {
      if (client.readyState === WebSocket.OPEN && 
          client.listingSubscriptions?.has(listingId)) {
        client.send(message);
      }
    });
  }
  
  return {
    broadcast,
    broadcastToListing,
    getClientCount: () => clients.size
  };
}