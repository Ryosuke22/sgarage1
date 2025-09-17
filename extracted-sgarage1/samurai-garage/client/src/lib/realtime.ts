// WebSocketリアルタイム通信ライブラリ
export interface RealtimeEvent {
  type: string;
  listingId?: string;
  [key: string]: any;
}

export type EventHandler = (event: RealtimeEvent) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private listingSubscriptions: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  constructor() {
    this.connect();
  }
  
  private connect() {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // 既存の購読を再登録
        this.listingSubscriptions.forEach(listingId => {
          this.subscribeListing(listingId);
        });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEvent;
          this.handleEvent(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.ws = null;
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
  
  private handleEvent(event: RealtimeEvent) {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    });
  }
  
  private send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  // イベントリスナー登録
  on(eventType: string, handler: EventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }
  
  // イベントリスナー削除
  off(eventType: string, handler: EventHandler) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  // リスティング購読
  subscribeListing(listingId: string) {
    this.listingSubscriptions.add(listingId);
    this.send({
      type: 'subscribe_listing',
      listingId
    });
  }
  
  // リスティング購読解除
  unsubscribeListing(listingId: string) {
    this.listingSubscriptions.delete(listingId);
    this.send({
      type: 'unsubscribe_listing',
      listingId
    });
  }
  
  // 接続状態確認
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  // 切断
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
    this.listingSubscriptions.clear();
  }
}

// シングルトンインスタンス
let realtimeClient: RealtimeClient | null = null;

export function getRealtimeClient(): RealtimeClient {
  if (!realtimeClient) {
    realtimeClient = new RealtimeClient();
  }
  return realtimeClient;
}

// React Hook用のヘルパー
export function useRealtime(listingId?: string) {
  const client = getRealtimeClient();
  
  // クリーンアップ
  const cleanup = () => {
    if (listingId) {
      client.unsubscribeListing(listingId);
    }
  };
  
  // 購読開始
  if (listingId) {
    client.subscribeListing(listingId);
  }
  
  return {
    client,
    cleanup,
    isConnected: client.isConnected()
  };
}