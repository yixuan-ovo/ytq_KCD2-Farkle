import { evaluateSelection } from '$lib/game/dice';
import type { ClientGameState } from '$lib/protocol/messages';
import type { GameConfig, GamePhase, PlayerId } from '$lib/game/types';
import { getGameSocket } from './GameSocket';
import { roomUrl, savePlayerName } from './config';

/** 对手离席通知（主动离开或宽限到期），供离席卡片展示 */
export interface PartnerLeftNotice {
  name: string;
  wasInGame: boolean;
  yourScore: number;
  opponentScore: number;
  youAreHost: boolean;
  hostLeft: boolean;
}

export interface SessionStore {
  connected: boolean;
  connecting: boolean;
  roomId: string | null;
  you: PlayerId | null;
  state: ClientGameState | null;
  lastError: string | null;
  partnerLeftNotice: PartnerLeftNotice | null;
  selectedDieIds: number[];
  /** 选骰阶段本地多选（尚未提交） */
  selectedPickIds: string[];
  /** 已发送 keep、等待服务端确认 */
  pendingKeepIds: number[] | null;
}

function createInitialStore(): SessionStore {
  return {
    connected: false,
    connecting: false,
    roomId: null,
    you: null,
    state: null,
    lastError: null,
    partnerLeftNotice: null,
    selectedDieIds: [],
    selectedPickIds: [],
    pendingKeepIds: null,
  };
}

export const session = $state<SessionStore>(createInitialStore());

const socket = getGameSocket();
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let handlersBound = false;
/** 已发送 pickDice、等待服务端确认的选骰 id */
let pendingPickIds: string[] | null = null;
let connectInFlight: Promise<void> | null = null;
let connectTargetId: string | null = null;
let leaveDisconnectTimer: ReturnType<typeof setTimeout> | null = null;
let selectDiceTimer: ReturnType<typeof setTimeout> | null = null;
/** 主动离开房间时置 true，防止 GameView connect effect 在断线后立即重连 */
let intentionalLeave = false;
const JOIN_TIMEOUT_MS = 12_000;

type JoinWaiter = {
  resolve: () => void;
  reject: (message: string) => void;
  timeout: ReturnType<typeof setTimeout>;
};

let joinWaiter: JoinWaiter | null = null;

function clearJoinWaiter(): void {
  if (!joinWaiter) return;
  clearTimeout(joinWaiter.timeout);
  joinWaiter = null;
}

function resolveJoinWaiter(): void {
  if (!joinWaiter) return;
  const waiter = joinWaiter;
  clearJoinWaiter();
  waiter.resolve();
}

function rejectJoinWaiter(message: string): void {
  if (!joinWaiter) return;
  const waiter = joinWaiter;
  clearJoinWaiter();
  waiter.reject(message);
}

function scheduleSelectDiceSync(): void {
  if (selectDiceTimer) clearTimeout(selectDiceTimer);
  selectDiceTimer = setTimeout(() => {
    selectDiceTimer = null;
    if (!session.state || !getIsMyTurn() || session.state.phase !== 'selecting') return;
    if (session.state.rollCount === 0) return;
    socket.send({ type: 'selectDice', dieIds: [...session.selectedDieIds] });
  }, 80);
}

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
      if (session.lastError?.includes('连接已断开')) {
        session.lastError = null;
      }
    },
    onState: (state, you) => {
      const prev = session.state;
      const prevTurnScore = prev?.turnScore ?? 0;
      const isMyTurn = Boolean(you && state.players[state.currentPlayerIndex].id === you);

      if (prev && you && detectOpponentLeft(prev, state, you)) {
        const oppId = opponentId(you);
        const opp = prev.players.find((p) => p.id === oppId);
        const me = prev.players.find((p) => p.id === you);
        session.partnerLeftNotice = {
          name: opp?.name || '对手',
          wasInGame: prev.phase !== 'lobby',
          yourScore: me?.totalScore ?? 0,
          opponentScore: opp?.totalScore ?? 0,
          youAreHost: you === 'host',
          hostLeft: oppId === 'host',
        };
      }

      session.state = state;
      session.you = you;

      if (you) {
        const me = state.players.find((p) => p.id === you);
        if (me?.name) savePlayerName(me.name);
        if (joinWaiter) resolveJoinWaiter();
      }

      if (state.lastBust && state.rollCount === 0) {
        session.pendingKeepIds = null;
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

      if (session.pendingKeepIds) {
        const keptNow = session.pendingKeepIds.every((id) => state.dice.find((d) => d.id === id)?.kept);
        if (keptNow || state.turnScore > prevTurnScore) {
          session.pendingKeepIds = null;
          session.lastError = null;
        }
      }

      if (!isMyTurn) {
        session.selectedDieIds = [];
        session.pendingKeepIds = null;
      } else if (session.pendingKeepIds) {
        // 等待 keep 确认期间保留选中，避免误清空
        const pending = new Set(session.pendingKeepIds);
        session.selectedDieIds = [
          ...new Set([
            ...session.selectedDieIds.filter((id) => pending.has(id)),
            ...session.pendingKeepIds,
          ]),
        ];
      } else {
        session.selectedDieIds = session.selectedDieIds.filter((id) => {
          const die = state.dice.find((d) => d.id === id);
          return die != null && die.active && !die.kept;
        });

        const hotDiceReady =
          isMyTurn &&
          state.phase === 'selecting' &&
          state.rollCount === 0 &&
          state.turnScore > 0 &&
          state.dice.every((d) => d.active && !d.kept);
        if (hotDiceReady) {
          session.selectedDieIds = [];
        }
      }
    },
    onError: (message) => {
      session.pendingKeepIds = null;
      if (session.state?.phase === 'dice_selection' && pendingPickIds) {
        session.selectedPickIds = [...pendingPickIds];
        pendingPickIds = null;
      }
      if (joinWaiter) {
        rejectJoinWaiter(message);
        disconnect();
        return;
      }
      showError(message);
    },
    onClose: () => {
      session.connected = false;
      session.connecting = false;
      if (joinWaiter) {
        rejectJoinWaiter('连接已断开');
        disconnect();
        return;
      }
      if (session.you && session.state && session.state.phase !== 'lobby') {
        showError('连接已断开，回到页面将自动重连');
      } else {
        showError('连接已断开');
      }
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
  if (session.pendingKeepIds) return false;
  return session.state.dice.some((d) => d.active && !d.kept);
}

function hasValidSelection(): boolean {
  if (!session.state || session.selectedDieIds.length === 0) return false;
  const selectable = session.state.dice.filter((d) => d.active && !d.kept);
  return evaluateSelection(selectable, session.selectedDieIds).valid;
}

export function getIsKeepPending(): boolean {
  return session.pendingKeepIds != null;
}

export function getCanKeep(): boolean {
  if (!session.state || !getIsMyTurn() || session.state.phase !== 'selecting') return false;
  if (session.pendingKeepIds) return false;
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

export function getMySelectedDieIds(): number[] {
  if (!session.state || !getIsMyTurn() || session.state.rollCount === 0) return [];
  return session.selectedDieIds;
}

export function getRemoteSelectedDieIds(): number[] {
  if (!session.state || getIsMyTurn()) return [];
  return session.state.pendingSelection ?? [];
}

/** 对手回合：根据 pendingSelection 计算预选得分（与己方 preview 一致） */
export function getRemoteSelectionPreview(): number {
  if (!session.state || getIsMyTurn() || session.state.rollCount === 0) return 0;
  const ids = session.state.pendingSelection ?? [];
  if (ids.length === 0) return 0;
  const selectable = session.state.dice.filter((d) => d.active && !d.kept);
  const { valid, score } = evaluateSelection(selectable, ids);
  return valid ? score : 0;
}

/** 选骰阶段：对手已确认的特殊骰 id（己方已提交后才下发） */
export function getOpponentDicePicks(): string[] {
  if (!session.state || !session.you || session.state.phase !== 'dice_selection') return [];
  const n = session.state.config.specialDiceCount;
  const picks =
    session.you === 'host' ? session.state.guestDice : session.state.hostDice;
  return picks.length >= n ? picks : [];
}

export function isOpponentSelecting(): boolean {
  return getRemoteSelectedDieIds().length > 0;
}

export function clearError(): void {
  session.lastError = null;
}

export function clearPartnerLeftNotice(): void {
  session.partnerLeftNotice = null;
}

function showError(message: string): void {
  session.lastError = message;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    session.lastError = null;
  }, 4000);
}

export async function joinRoom(roomId: string, name: string): Promise<void> {
  bindHandlers();
  intentionalLeave = false;

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('昵称不能为空');
  }

  const id = roomId.trim().toUpperCase();
  if (!id) {
    throw new Error('房间暗号不能为空');
  }

  if (session.roomId === id && session.connected && session.you) {
    const me = session.state?.players.find((p) => p.id === session.you);
    if (me?.name === trimmedName) return;
  }

  clearJoinWaiter();
  if (session.connected || session.connecting) {
    disconnect();
  }

  return new Promise((resolve, reject) => {
    joinWaiter = {
      resolve: () => resolve(),
      reject: (message) => reject(new Error(message)),
      timeout: setTimeout(() => {
        rejectJoinWaiter('加入超时，请重试');
        disconnect();
      }, JOIN_TIMEOUT_MS),
    };

    void performConnect(id, trimmedName).catch(() => {
      if (joinWaiter) {
        rejectJoinWaiter('无法连接服务器');
        disconnect();
      }
    });
  });
}

async function performConnect(id: string, trimmedName: string): Promise<void> {
  if (connectInFlight && connectTargetId === id) {
    await connectInFlight;
    if (!session.connected) throw new Error('无法连接服务器');
    socket.send({ type: 'join', name: trimmedName });
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
  session.pendingKeepIds = null;
  pendingPickIds = null;

  connectTargetId = id;

  connectInFlight = (async () => {
    try {
      await socket.connect(roomUrl(id));
      socket.send({ type: 'join', name: trimmedName });
    } catch {
      session.connecting = false;
      throw new Error('无法连接服务器');
    } finally {
      connectInFlight = null;
      connectTargetId = null;
    }
  })();

  await connectInFlight;
}

export async function connect(roomId: string, name: string): Promise<void> {
  if (intentionalLeave) return;

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

  if (session.roomId === id && session.connected && session.you) {
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

  try {
    await performConnect(id, trimmedName);
  } catch {
    showError('无法连接服务器');
  }
}

/** 切回前台或断线后尝试用原昵称重连（宽限期内可续局） */
export function tryReconnect(name: string): void {
  if (intentionalLeave) return;

  const trimmed = name.trim();
  if (!trimmed || !session.roomId) return;
  if (session.connected && session.you) return;
  if (session.connecting) return;
  void connect(session.roomId, trimmed);
}

export function disconnect(): void {
  if (leaveDisconnectTimer) {
    clearTimeout(leaveDisconnectTimer);
    leaveDisconnectTimer = null;
  }
  session.pendingKeepIds = null;
  pendingPickIds = null;
  socket.disconnect();
  Object.assign(session, createInitialStore());
}

export function leaveRoom(): void {
  intentionalLeave = true;

  if (leaveDisconnectTimer) {
    clearTimeout(leaveDisconnectTimer);
    leaveDisconnectTimer = null;
  }

  if (session.connected) {
    socket.send({ type: 'leave' });
  }

  disconnect();
}

export function startGame(config?: Partial<GameConfig>): void {
  session.pendingKeepIds = null;
  pendingPickIds = null;
  session.selectedDieIds = [];
  session.selectedPickIds = [];
  socket.send({ type: 'start', config });
}

export function restartGame(): boolean {
  if (session.you !== 'host') {
    showError('仅房主可重开');
    return false;
  }
  if (!session.connected) {
    showError('未连接，无法重开');
    return false;
  }
  if (session.state?.phase !== 'game_over') {
    showError('对局尚未结束');
    return false;
  }
  if (!session.state.players[0].name || !session.state.players[1].name) {
    showError('对手已离开，无法重开');
    return false;
  }

  session.pendingKeepIds = null;
  pendingPickIds = null;
  session.selectedDieIds = [];
  session.selectedPickIds = [];

  const ok = socket.send({ type: 'start' });
  if (!ok) {
    showError('重开失败，请重试');
    return false;
  }
  return true;
}

export function ackTurnOrder(): void {
  if (session.state?.phase !== 'turn_order' || session.you !== 'host') return;
  socket.send({ type: 'ackTurnOrder' });
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
  const s = session.state;
  if (!s || !getIsMyTurn()) return;

  const resumeTurn =
    s.rollCount === 0 && (s.lastBust || s.phase === 'turn_end' || s.phase === 'hot_dice');
  if (!resumeTurn && !getCanRoll()) return;
  if (resumeTurn) {
    if (session.pendingKeepIds) return;
    if (!s.dice.some((d) => d.active && !d.kept)) return;
  }

  session.selectedDieIds = [];
  session.pendingKeepIds = null;
  socket.send({ type: 'roll' });
}

export function keepSelection(): void {
  if (!getCanKeep()) return;
  const ids = [...session.selectedDieIds];
  session.pendingKeepIds = ids;
  session.selectedDieIds = [];
  socket.send({ type: 'keep', dieIds: ids });
}

export function bank(): void {
  if (!getCanBank()) return;
  const dieIds = hasValidSelection() ? [...session.selectedDieIds] : undefined;
  session.selectedDieIds = [];
  session.pendingKeepIds = null;
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
  scheduleSelectDiceSync();
}

export function clearSelection(): void {
  session.selectedDieIds = [];
  scheduleSelectDiceSync();
}
