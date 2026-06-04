import type { ClientMessage, ClientGameState, ServerMessage } from '$lib/protocol/messages';
import type { PlayerId } from '$lib/game/types';

export type GameSocketHandlers = {
  onState?: (state: ClientGameState, you: PlayerId | null) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
  onOpen?: () => void;
};

export class GameSocket {
  private ws: WebSocket | null = null;
  private handlers: GameSocketHandlers = {};

  setHandlers(handlers: GameSocketHandlers): void {
    this.handlers = handlers;
  }

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.disconnect();

      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.handlers.onOpen?.();
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as ServerMessage;
          if (msg.type === 'state') {
            this.handlers.onState?.(msg.state, msg.you);
          } else if (msg.type === 'error') {
            this.handlers.onError?.(msg.message);
          }
        } catch {
          this.handlers.onError?.('无效服务器消息');
        }
      };

      ws.onclose = () => {
        this.ws = null;
        this.handlers.onClose?.();
      };

      ws.onerror = () => {
        reject(new Error('WebSocket 连接失败'));
      };
    });
  }

  send(msg: ClientMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.handlers.onError?.('未连接');
      return false;
    }
    this.ws.send(JSON.stringify(msg));
    return true;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/** 单例，避免 HMR 双连接 */
let socketInstance: GameSocket | null = null;

export function getGameSocket(): GameSocket {
  if (!socketInstance) {
    socketInstance = new GameSocket();
  }
  return socketInstance;
}
