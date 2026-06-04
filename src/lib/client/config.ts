export const WS_BASE =
  import.meta.env.VITE_WS_BASE ?? 'wss://farkle.yixr.uno';

export function roomUrl(roomId: string): string {
  const id = roomId.trim().toUpperCase();
  return `${WS_BASE}/room/${encodeURIComponent(id)}`;
}

export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export function shareUrl(roomId: string, name?: string): string {
  const base = `${window.location.origin}/room/${roomId.trim().toUpperCase()}`;
  if (name?.trim()) {
    return `${base}?name=${encodeURIComponent(name.trim())}`;
  }
  return base;
}

export function parseRoomFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/room\/([^/]+)/);
  return match?.[1]?.toUpperCase() ?? null;
}

export function parseNameFromQuery(): string {
  return new URLSearchParams(window.location.search).get('name')?.trim() ?? '';
}

const PLAYER_NAME_KEY = 'farkle-player-name';

export function savePlayerName(name: string): void {
  if (typeof sessionStorage === 'undefined') return;
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    sessionStorage.setItem(PLAYER_NAME_KEY, trimmed);
  } catch {
    /* quota / private mode */
  }
}

export function loadPlayerName(): string {
  if (typeof sessionStorage === 'undefined') return '';
  try {
    return sessionStorage.getItem(PLAYER_NAME_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function clearPlayerName(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(PLAYER_NAME_KEY);
  } catch {
    /* ignore */
  }
}
