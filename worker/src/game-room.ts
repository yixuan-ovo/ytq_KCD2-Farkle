import {
  clearPlayerAway,
  createInitialState,
  finishTurnOrder,
  handleBank,
  handleKeep,
  handleRoll,
  handleSelectDice,
  joinPlayer,
  leavePlayer,
  markPlayerAway,
  normalizeTurnPhase,
  startGame,
  submitDicePick,
} from './session';
import type { GameConfig, GameState, PlayerId } from '../../src/lib/game/types';
import { parseClientMessage, serializeServerMessage, toClientGameState } from '../../src/lib/protocol/messages';

interface SessionMeta {
  playerId: PlayerId | null;
  name: string;
}

const GAME_STATE_KEY = 'gameState';

export class GameRoom implements DurableObject {
  private gameState: GameState = createInitialState();
  private sessions = new Map<WebSocket, SessionMeta>();
  private stateLoaded = false;

  constructor(private readonly ctx: DurableObjectState) {}

  private async ensureStateLoaded(): Promise<void> {
    if (this.stateLoaded) return;
    const saved = await this.ctx.storage.get<GameState>(GAME_STATE_KEY);
    if (saved) {
      this.gameState = {
        ...saved,
        pendingSelection: saved.pendingSelection ?? [],
        lastTurnEnd: saved.lastTurnEnd ?? null,
        coinFlip: saved.coinFlip ?? null,
        awayUntil: saved.awayUntil ?? {},
      };
    }
    this.stateLoaded = true;
    await this.expireAwayPlayers();
  }

  private commitState(): void {
    void this.ctx.storage.put(GAME_STATE_KEY, this.gameState);
  }

  async alarm(): Promise<void> {
    await this.ensureStateLoaded();
    await this.expireAwayPlayers();
  }

  private async expireAwayPlayers(): Promise<void> {
    const now = Date.now();
    let changed = false;

    for (const who of ['host', 'guest'] as PlayerId[]) {
      const until = this.gameState.awayUntil[who];
      if (until != null && until <= now) {
        this.gameState = clearPlayerAway(this.gameState, who);
        this.gameState = leavePlayer(this.gameState, who);
        changed = true;
      }
    }

    if (changed) {
      this.commitState();
      this.broadcast();
    }

    await this.scheduleAwayAlarm();
  }

  private async scheduleAwayAlarm(): Promise<void> {
    const now = Date.now();
    const future = Object.values(this.gameState.awayUntil).filter(
      (t): t is number => t != null && t > now,
    );

    if (future.length === 0) {
      try {
        await this.ctx.storage.deleteAlarm();
      } catch {
        /* no alarm set */
      }
      return;
    }

    await this.ctx.storage.setAlarm(Math.min(...future));
  }

  private readMeta(ws: WebSocket): SessionMeta {
    try {
      const raw = ws.deserializeAttachment();
      if (typeof raw === 'string') {
        return JSON.parse(raw) as SessionMeta;
      }
    } catch {
      /* fall through */
    }
    return this.sessions.get(ws) ?? { playerId: null, name: '' };
  }

  private writeMeta(ws: WebSocket, meta: SessionMeta): void {
    ws.serializeAttachment(JSON.stringify(meta));
    this.sessions.set(ws, meta);
  }

  async fetch(request: Request): Promise<Response> {
    await this.ensureStateLoaded();

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('KCD2 Farkle — WebSocket only. Connect via wss://…/room/{roomId}', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.ctx.acceptWebSocket(server);
    const meta: SessionMeta = { playerId: null, name: '' };
    this.writeMeta(server, meta);
    this.sendTo(server, this.gameState, null);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    await this.ensureStateLoaded();

    const raw = typeof message === 'string' ? message : new TextDecoder().decode(message);
    const msg = parseClientMessage(raw);
    if (!msg) {
      this.sendError(ws, '无效消息格式');
      return;
    }

    const meta = this.readMeta(ws);

    switch (msg.type) {
      case 'join':
        this.handleJoin(ws, meta, msg.name);
        break;
      case 'start':
        this.handleStart(ws, meta, msg.config);
        break;
      case 'pickDice':
        if (!Array.isArray(msg.diceIds)) {
          this.sendError(ws, '无效的选骰请求');
          break;
        }
        this.handlePickDice(ws, meta, msg.diceIds);
        break;
      case 'roll':
        this.handleAction(ws, meta, () => handleRoll(this.gameState, meta.playerId!));
        break;
      case 'keep':
        if (!Array.isArray(msg.dieIds)) {
          this.sendError(ws, '无效的保留请求');
          break;
        }
        this.handleAction(ws, meta, () => handleKeep(this.gameState, meta.playerId!, msg.dieIds));
        break;
      case 'bank': {
        const dieIds = Array.isArray(msg.dieIds) ? msg.dieIds : undefined;
        this.handleAction(ws, meta, () => handleBank(this.gameState, meta.playerId!, dieIds));
        break;
      }
      case 'selectDice':
        if (!Array.isArray(msg.dieIds)) {
          this.sendError(ws, '无效的选骰请求');
          break;
        }
        this.handleAction(ws, meta, () => handleSelectDice(this.gameState, meta.playerId!, msg.dieIds));
        break;
      case 'ackTurnOrder':
        this.handleAckTurnOrder(ws, meta);
        break;
      case 'leave':
        this.handleLeave(ws, meta);
        break;
    }
  }

  private handleLeave(ws: WebSocket, meta: SessionMeta): void {
    if (meta.playerId) {
      this.gameState = clearPlayerAway(this.gameState, meta.playerId);
      this.gameState = leavePlayer(this.gameState, meta.playerId);
      meta.playerId = null;
      meta.name = '';
      this.writeMeta(ws, meta);
      this.commitState();
      void this.scheduleAwayAlarm();
      this.broadcast();
    }
    try {
      ws.close(1000, 'left');
    } catch {
      /* already closed */
    }
    this.sessions.delete(ws);
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.ensureStateLoaded();

    const meta = this.readMeta(ws);
    if (meta.playerId) {
      this.gameState = markPlayerAway(this.gameState, meta.playerId);
      this.commitState();
      void this.scheduleAwayAlarm();
      this.broadcast();
    }
    this.sessions.delete(ws);
  }

  webSocketError(ws: WebSocket): void {
    void this.webSocketClose(ws);
  }

  private handleJoin(ws: WebSocket, meta: SessionMeta, name: string): void {
    if (meta.playerId) {
      this.sendTo(ws, this.gameState, meta.playerId);
      return;
    }

    const trimmed = name.trim().slice(0, 24);
    if (!trimmed) {
      this.sendError(ws, '昵称不能为空');
      return;
    }

    const hostName = this.gameState.players[0].name;
    const guestName = this.gameState.players[1].name;

    if (hostName === trimmed && !this.isRoleConnected('host')) {
      this.gameState = clearPlayerAway(this.gameState, 'host');
      meta.playerId = 'host';
      meta.name = trimmed;
      this.writeMeta(ws, meta);
      this.commitState();
      void this.scheduleAwayAlarm();
      this.sendTo(ws, this.gameState, 'host');
      this.broadcast();
      return;
    }

    if (guestName === trimmed && !this.isRoleConnected('guest')) {
      this.gameState = clearPlayerAway(this.gameState, 'guest');
      meta.playerId = 'guest';
      meta.name = trimmed;
      this.writeMeta(ws, meta);
      this.commitState();
      void this.scheduleAwayAlarm();
      this.sendTo(ws, this.gameState, 'guest');
      this.broadcast();
      return;
    }

    const result = joinPlayer(this.gameState, name);
    if ('error' in result) {
      this.sendError(ws, result.error);
      return;
    }

    this.gameState = result.state;
    meta.playerId = result.role;
    meta.name = trimmed;
    this.writeMeta(ws, meta);
    this.commitState();
    this.broadcast();
  }

  private isRoleConnected(role: PlayerId): boolean {
    const sockets = this.ctx.getWebSockets?.() ?? [...this.sessions.keys()];
    for (const socket of sockets) {
      const m = this.readMeta(socket);
      if (m.playerId === role) return true;
    }
    return false;
  }

  private handleStart(ws: WebSocket, meta: SessionMeta, config?: Partial<GameConfig>): void {
    if (meta.playerId !== 'host') {
      this.sendError(ws, '仅房主可开始游戏');
      return;
    }

    const result = startGame(this.gameState, 'host', config);
    if ('error' in result) {
      this.sendError(ws, result.error);
      return;
    }

    this.gameState = result;
    this.commitState();
    this.broadcast();
  }

  private handleAckTurnOrder(ws: WebSocket, meta: SessionMeta): void {
    if (meta.playerId !== 'host') {
      this.sendError(ws, '仅房主可推进');
      return;
    }

    const result = finishTurnOrder(this.gameState, 'host');
    if ('error' in result) {
      this.sendError(ws, result.error);
      return;
    }

    this.gameState = result;
    this.commitState();
    this.broadcast();
  }

  private handlePickDice(ws: WebSocket, meta: SessionMeta, diceIds: string[]): void {
    if (!meta.playerId) {
      this.sendError(ws, '请先加入房间');
      return;
    }

    try {
      const result = submitDicePick(this.gameState, meta.playerId, diceIds);
      if ('error' in result) {
        this.sendError(ws, result.error);
        return;
      }

      this.gameState = result;
      this.commitState();
      this.broadcast();
    } catch {
      this.sendError(ws, '选骰失败，请重试');
    }
  }

  private handleAction(
    ws: WebSocket,
    meta: SessionMeta,
    action: () => GameState | { error: string },
  ): void {
    if (!meta.playerId) {
      this.sendError(ws, '请先加入房间');
      return;
    }

    try {
      this.gameState = normalizeTurnPhase(this.gameState);
      const result = action();
      if ('error' in result) {
        this.sendError(ws, result.error);
        return;
      }

      this.gameState = result;
      this.commitState();
      this.broadcast();
    } catch {
      this.sendError(ws, '操作失败，请重试');
    }
  }

  private broadcast(): void {
    const sockets = this.ctx.getWebSockets?.() ?? [...this.sessions.keys()];
    for (const ws of sockets) {
      const meta = this.readMeta(ws);
      this.sendTo(ws, this.gameState, meta.playerId);
    }
  }

  private sendTo(ws: WebSocket, state: GameState, you: PlayerId | null): void {
    try {
      ws.send(
        serializeServerMessage({ type: 'state', state: toClientGameState(state, you), you }),
      );
    } catch {
      this.sessions.delete(ws);
    }
  }

  private sendError(ws: WebSocket, message: string): void {
    try {
      ws.send(serializeServerMessage({ type: 'error', message }));
    } catch {
      this.sessions.delete(ws);
    }
  }
}
