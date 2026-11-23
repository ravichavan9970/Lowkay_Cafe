import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  private client: Client | null = null;
  private connected: boolean = false;
  private subscriptions: Map<string, any> = new Map();

  connect(onConnectCallback?: () => void) {
    if (this.client && this.connected) {
      if (onConnectCallback) onConnectCallback();
      return;
    }

    const socketFactory = () => new SockJS('/ws');

    this.client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 4000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.connected = true;
        console.log('⚡ Connected to Lowkey Cafe WebSocket');
        if (onConnectCallback) onConnectCallback();
      },
      onDisconnect: () => {
        this.connected = false;
        console.log('Disconnected from WebSocket');
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    this.client.activate();
  }

  subscribe(topic: string, callback: (data: any) => void): string {
    const subId = `${topic}_${Date.now()}_${Math.random()}`;

    const doSubscribe = () => {
      if (!this.client || !this.connected) return;
      const sub = this.client.subscribe(topic, (message) => {
        try {
          const body = JSON.parse(message.body);
          callback(body);
        } catch (e) {
          callback(message.body);
        }
      });
      this.subscriptions.set(subId, sub);
    };

    if (this.connected) {
      doSubscribe();
    } else {
      this.connect(() => {
        doSubscribe();
      });
    }

    return subId;
  }

  unsubscribe(subId: string) {
    const sub = this.subscriptions.get(subId);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(subId);
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }
}

export const wsService = new WebSocketService();
export default wsService;
