export { GameRoom } from './game-room';

export interface Env {
  GAME_ROOM: DurableObjectNamespace;
  /** Pages 站点主机名（不含协议），用于把浏览器打开的 /room/* 转给前端 */
  PAGES_HOST?: string;
}

const DEFAULT_PAGES_HOST = 'kcd2-farkle.pages.dev';

function isWebSocket(request: Request): boolean {
  return request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
}

/** 非 WebSocket 的页面请求转给 Cloudflare Pages（避免浏览器看到 API 纯文本） */
function proxyToPages(request: Request, env: Env): Promise<Response> {
  const host = (env.PAGES_HOST ?? DEFAULT_PAGES_HOST).replace(/^https?:\/\//, '');
  const target = new URL(request.url);
  target.hostname = host;
  return fetch(
    new Request(target.toString(), {
      method: request.method,
      headers: request.headers,
      redirect: 'follow',
    }),
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!isWebSocket(request)) {
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ ok: true, service: 'ytq-kcd2-farkle-api' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const roomPage = url.pathname.match(/^\/room\/([^/]+)\/?$/);
      if (url.pathname === '/' || roomPage) {
        return proxyToPages(request, env);
      }
    }

    const roomMatch = url.pathname.match(/^\/room\/([^/]+)\/?$/);
    const roomId = roomMatch?.[1] ?? url.searchParams.get('room');
    if (!roomId) {
      return new Response('Missing room id. Use /room/{roomId}', { status: 400 });
    }

    const id = env.GAME_ROOM.idFromName(roomId.toUpperCase());
    const stub = env.GAME_ROOM.get(id);
    return stub.fetch(request);
  },
};
