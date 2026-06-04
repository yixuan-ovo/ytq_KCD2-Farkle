import { evaluateSelection } from '$lib/game/dice';
import type { ClientGameState } from '$lib/protocol/messages';
import type { GameConfig, GamePhase, PlayerId } from '$lib/game/types';
import { getGameSocket } from './GameSocket';
import { roomUrl, savePlayerName } from './config';

export interface SessionStore {
  connected: boolean;
  connecting: boolean;
  roomId: string | null;
  you: PlayerId | null;
  state: ClientGameState | null;
  lastError: string | null;
  selectedDieIds: number[];
  /** 选骰阶段本地多选（尚未提交） */
  selectedPickIds: string[];
}

function createInitialStore(): SessionStore {
  return {
    connected: false,
    connecting: false,
    roomId: null,
    you: null,
    state: null,
    lastError: null,
    selectedDieIds: [],
    selectedPickIds: [],
  };
}

export const session = $state<SessionStore>(createInitialStore());

const socket = getGameSocket();
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let handlersBound = false;
/** 已发送 keep、等待服务端确认的骰子 id */
let pendingKeepIds: number[] | null = null;
/** 已发送 pickDice、等待服务端确认的选骰 id */
let pendingPickIds: string[] | null = null;
let connectInFlight: Promise<void> | null = null;
let connectTargetId: string | null = null;
let leaveDisconnectTimer: ReturnType<typeof setTimeout> | null = null;

function opponentId(you: PlayerId): PlayerId {
  return you === 'host' ? 'guest' : 'host';
}

function detectOpponentLeft(prev: ClientGameState, next: ClientGameState, you: PlayerId): boolean {
  const id = opponentId(you);
  const prevOpp = prev.players.find((p) => p.id === id);
  const nextOpp = next.players.find((p) => p.id === id);
  return Boolean(prevOpp?.name && !nextOpp?.name);
}

function hasConfirmedPick(state: ClientGameState, you: PlayerId | null): boolean {
  if (!you) return false;
  const n = state.config.specialDiceCount;
  const picks = you === 'host' ? state.hostDice : state.guestDice;
  return picks.length >= n;
}

function bindHandlers(): void {
  if (handlersBound) return;
  handlersBound = true;

  socket.setHandlers({
    onOpen: () => {
      session.connected = true;
      session.connecting = false;
    },
    onState: (state, you) => {
      const prev = session.state;
      const prevTurnScore = prev?.turnScore ?? 0;
      const isMyTurn = Boolean(you && state.players[state.currentPlayerIndex].id === you);

      if (prev && you && detectOpponentLeft(prev, state, you)) {
        showError('对手已离开牌桌');
      }

      session.state = state;
      session.you = you;

      if (you) {
        const me = state.players.find((p) => p.id === you);
        if (me?.name) savePlayerName(me.name);
      }

      if (state.phase === 'dice_selection') {
        if (hasConfirmedPick(state, you)) {
          pendingPickIds = null;
          session.selectedPickIds = [];
        } else if (pendingPickIds) {
          session.selectedPickIds = [...pendingPickIds];
        }
      } else {
        pendingPickIds = null;
        session.selectedPickIds = [];
      }

      if (pendingKeepIds) {
        const keptNow = pendingKeepIds.every((id) => state.dice.find((d) => d.id === id)?.kept);
        if (keptNow || state.turnScore > prevTurnScore) {
          pendingKeepIds = null;
          session.lastError = null;
        }
      }

      if (!isMyTurn) {
        session.selectedDieIds = [];
        pendingKeepIds = null;
      } else if (pendingKeepIds) {
        // 等待 keep 确认期间保留选中，避免误清空
        const pending = new Set(pendingKeepIds);
        session.selectedDieIds = [
          ...new Set([
            ...session.selectedDieIds.filter((id) => pending.has(id)),
            ...pendingKeepIds,
          ]),
        ];
      } else {
        session.selectedDieIds = session.selectedDieIds.filter((id) => {
          const die = state.dice.find((d) => d.id === id);
          return die != null && die.active && !die.kept;
        });
      }
    },
    onError: (message) => {
      pendingKeepIds = null;
      if (session.state?.phase === 'dice_selection' && pendingPickIds) {
        session.selectedPickIds = [...pendingPickIds];
        pendingPickIds = null;
      }
      showError(message);
    },
    onClose: () => {
      session.connected = false;
      session.connecting = false;
      showError('连接已断开');
    },
  });
}

export function getIsMyTurn(): boolean {
  if (!session.state || !session.you) return false;
  return session.state.players[session.state.currentPlayerIndex].id === session.you;
}

export function getPhase(): GamePhase | null {
  return session.state?.phase ?? null;
}

export function getCanRoll(): boolean {
  if (!session.state || !getIsMyTurn()) return false;
  const p = session.state.phase;
  if (p === 'bust' || p === 'turn_end' || p === 'hot_dice') {
    return session.state.rollCount === 0;
  }
  if (p !== 'selecting') return false;
  if (session.state.rollCount !== 0) return false;
  if (session.state.awaitingKeep) return false;
  return session.state.dice.some((d) => d.active && !d.kept);
}

function hasValidSelection(): boolean {
  if (!session.state || session.selectedDieIds.length === 0) return false;
  const selectable = session.state.dice.filter((d) => d.active && !d.kept);
  return evaluateSelection(selectable, session.selectedDieIds).valid;
}

export function getCanKeep(): boolean {
  if (!session.state || !getIsMyTurn() || session.state.phase !== 'selecting') return false;
  if (session.state.rollCount === 0) return false;
  return hasValidSelection();
}

export function getCanBank(): boolean {
  if (!session.state || !getIsMyTurn() || session.state.phase !== 'selecting') return false;
  if (session.state.rollCount === 0) return false;
  return session.state.turnScore > 0 || hasValidSelection();
}

export function getCanStart(): boolean {
  if (!session.state || session.you !== 'host' || session.state.phase !== 'lobby') return false;
  return Boolean(session.state.players[0].name && session.state.players[1].name);
}

export function getCanRestart(): boolean {
  if (!session.state || session.you !== 'host' || session.state.phase !== 'game_over') return false;
  return Boolean(session.state.players[0].name && session.state.players[1].name);
}

export function getBothSeated(): boolean {
  if (!session.state) return false;
  return Boolean(session.state.players[0].name && session.state.players[1].name);
}

export function getMyDicePicks(): string[] {
  if (!session.state || !session.you) return [];
  return session.you === 'host' ? session.state.hostDice : session.state.guestDice;
}

export function getHasConfirmedPick(): boolean {
  if (!session.state) return false;
  return hasConfirmedPick(session.state, session.you);
}

export function getCanSubmitPick(): boolean {
  if (!session.state || session.state.phase !== 'dice_selection') return false;
  if (getHasConfirmedPick() || pendingPickIds) return false;
  const n = session.state.config.specialDiceCount;
  return session.selectedPickIds.length === n;
}

export function getIsPickPending(): boolean {
  return pendingPickIds != null;
}

export function getDicePickWaitText(): string {
  if (!session.state || session.state.phase !== 'dice_selection') return '';
  if (getHasConfirmedPick()) {
    return session.state.opponentDiceReady ? '双方选骰完成，即将开始…' : '等待对手选骰…';
  }
  return '';
}

export function getSelectionPreview(): number {
  if (!session.state || session.state.rollCount === 0) return 0;
  if (session.selectedDieIds.length === 0) return 0;
  const selectable = session.state.dice.filter((d) => d.active && !d.kept);
  const { valid, score } = evaluateSelection(selectable, session.selectedDieIds);
  return valid ? score : 0;
}

export function clearError(): void {
  session.lastError = null;
}

function showError(message: string): void {
  session.lastError = message;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    session.lastError = null;
  }, 4000);
}

export async function connect(roomId: string, name: string): Promise<void> {
  bindHandlers();

  const trimmedName = name.trim();
  if (!trimmedName) {
    showError('昵称不能为空');
    return;
  }

  const id = roomId.trim().toUpperCase();
  if (!id) {
    showError('房间号不能为空');
    return;
  }

  if (session.roomId === id && session.connected) {
    socket.send({ type: 'join', name: trimmedName });
    return;
  }

  if (connectInFlight && connectTargetId === id) {
    await connectInFlight;
    return;
  }

  if (session.roomId === id && session.connecting) {
    return;
  }

  if (session.connected && session.roomId !== id) {
    socket.send({ type: 'leave' });
    disconnect();
  }

  session.connecting = true;
  session.roomId = id;
  session.lastError = null;
  session.selectedDieIds = [];
  session.selectedPickIds = [];
  pendingKeepIds = null;
  pendingPickIds = null;

  connectTargetId = id;
  savePlayerName(trimmedName);

  connectInFlight = (async () => {
    try {
      await socket.connect(roomUrl(id));
      socket.send({ type: 'join', name: trimmedName });
    } catch {
      session.connecting = false;
      showError('无法连接服务器');
    } finally {
      connectInFlight = null;
      connectTargetId = null;
    }
  })();

  await connectInFlight;
}

export function disconnect(): void {
  if (leaveDisconnectTimer) {
    clearTimeout(leaveDisconnectTimer);
    leaveDisconnectTimer = null;
  }
  pendingKeepIds = null;
  pendingPickIds = null;
  socket.disconnect();
  Object.assign(session, createInitialStore());
}

export function leaveRoom(): void {
  if (leaveDisconnectTimer) {
    clearTimeout(leaveDisconnectTimer);
    leaveDisconnectTimer = null;
  }

  if (session.connected) {
    socket.send({ type: 'leave' });
    // 等服务端处理 leave 并广播给对手后再断开本地连接
    leaveDisconnectTimer = setTimeout(() => {
      leaveDisconnectTimer = null;
      disconnect();
    }, 150);
    return;
  }

  disconnect();
}

export function startGame(config?: Partial<GameConfig>): void {
  pendingKeepIds = null;
  pendingPickIds = null;
  session.selectedDieIds = [];
  session.selectedPickIds = [];
  socket.send({ type: 'start', config });
}

export function restartGame(): void {
  if (!getCanRestart()) return;
  pendingKeepIds = null;
  pendingPickIds = null;
  session.selectedDieIds = [];
  session.selectedPickIds = [];
  socket.send({ type: 'start' });
}

export function submitDicePick(): void {
  if (!getCanSubmitPick()) return;
  const picks = [...session.selectedPickIds];
  pendingPickIds = picks;
  if (!socket.send({ type: 'pickDice', diceIds: picks })) {
    pendingPickIds = null;
    return;
  }
}

export function togglePickDie(dieId: string): void {
  if (!session.state || session.state.phase !== 'dice_selection') return;
  if (getHasConfirmedPick() || pendingPickIds) return;

  const n = session.state.config.specialDiceCount;
  const idx = session.selectedPickIds.indexOf(dieId);
  if (idx >= 0) {
    session.selectedPickIds = session.selectedPickIds.filter((id) => id !== dieId);
  } else if (session.selectedPickIds.length < n) {
    session.selectedPickIds = [...session.selectedPickIds, dieId];
  }
}

export function roll(): void {
  if (!getCanRoll()) return;
  session.selectedDieIds = [];
  pendingKeepIds = null;
  socket.send({ type: 'roll' });
}

export function keepSelection(): void {
  if (!getCanKeep()) return;
  const ids = [...session.selectedDieIds];
  pendingKeepIds = ids;
  socket.send({ type: 'keep', dieIds: ids });
}

export function bank(): void {
  if (!getCanBank()) return;
  const dieIds = hasValidSelection() ? [...session.selectedDieIds] : undefined;
  session.selectedDieIds = [];
  pendingKeepIds = null;
  socket.send(dieIds?.length ? { type: 'bank', dieIds } : { type: 'bank' });
}

export function toggleDie(id: number): void {
  if (!session.state || !getIsMyTurn() || session.state.phase !== 'selecting') return;
  if (session.state.rollCount === 0) return;

  const die = session.state.dice.find((d) => d.id === id);
  if (!die || !die.active || die.kept) return;

  const idx = session.selectedDieIds.indexOf(id);
  if (idx >= 0) {
    session.selectedDieIds = session.selectedDieIds.filter((i) => i !== id);
  } else {
    session.selectedDieIds = [...session.selectedDieIds, id];
  }
}

export function clearSelection(): void {
  session.selectedDieIds = [];
}
