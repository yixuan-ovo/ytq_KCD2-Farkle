<script lang="ts">
  import TavernAmbience from '../components/layout/TavernAmbience.svelte';
  import Header from '../components/layout/Header.svelte';
  import ActionBar from '../components/layout/ActionBar.svelte';
  import GameHud from '../components/game/GameHud.svelte';
  import DiceTable from '../components/game/DiceTable.svelte';
  import DiceBoard from '../components/game/DiceBoard.svelte';
  import TurnScoreCard from '../components/game/TurnScoreCard.svelte';
  import PhaseOverlay from '../components/game/PhaseOverlay.svelte';
  import FloatingScore from '../components/game/FloatingScore.svelte';
  import ComboBanner from '../components/game/ComboBanner.svelte';
  import RulesConfigPanel from '../components/lobby/RulesConfigPanel.svelte';
  import DiceSelector from '../components/selection/DiceSelector.svelte';
  import RulesSheet from '../components/lobby/RulesSheet.svelte';
  import { shareUrl } from '$lib/client/config';
  import { isPhysicsEnabled } from '$lib/settings/gameSettings';
  import { centerOf } from '$lib/ui/animation';
  import { detectCombo } from '$lib/ui/comboDetect';
  import type { ComboType } from '$lib/ui/comboDetect';
  import type { DieFace } from '$lib/game/types';
  import TavernQuoteBar from '../components/layout/TavernQuoteBar.svelte';
  import { createGameQuoteController } from '$lib/ui/useTavernQuote.svelte';
  import {
    session,
    connect,
    startGame,
    restartGame,
    roll,
    keepSelection,
    bank,
    toggleDie,
    getIsMyTurn,
    getCanRoll,
    getCanKeep,
    getCanBank,
    getBothSeated,
    getDicePickWaitText,
    getSelectionPreview,
    getMySelectedDieIds,
    getRemoteSelectedDieIds,
    isOpponentSelecting,
    clearError,
  } from '$lib/client/gameSession.svelte';

  interface Props {
    roomId: string;
    playerName: string;
    onLeave?: () => void;
  }

  let { roomId, playerName, onLeave }: Props = $props();

  let showRulesConfig = $state(false);
  let showRulesSheet = $state(false);
  let floatShow = $state(false);
  let floatAmount = $state(0);
  let floatX = $state(0);
  let floatY = $state(0);
  let comboVisible = $state(false);
  let activeCombo = $state<ComboType>(null);
  let prevTurnScore = $state(0);
  let lastKeepFaces = $state<DieFace[]>([]);

  let boardEl: HTMLDivElement | undefined = $state();
  let physicsEnabled = $state(isPhysicsEnabled());
  let physicsRolling = $state(false);
  let prevRollCount = $state(-1);

  const gameQuotes = createGameQuoteController();

  $effect(() => {
    if (!roomId || !playerName) return;
    const id = roomId.trim().toUpperCase();
    if (session.roomId === id && (session.connected || session.connecting)) return;
    connect(id, playerName);
  });

  $effect(() => {
    if (session.state?.phase !== 'lobby') {
      showRulesConfig = false;
    }
  });

  $effect(() => {
    const phase = session.state?.phase;
    if (phase === 'turn_end' || phase === 'bust' || phase === 'game_over') {
      prevTurnScore = 0;
    }
  });

  $effect(() => {
    physicsEnabled = isPhysicsEnabled();
    const s = session.state;
    if (!s || !physicsEnabled) return;
    const rc = s.rollCount;
    if (rc > prevRollCount) {
      if (getIsMyTurn()) {
        physicsRolling = true;
        if (rc > 1) gameQuotes.show('reroll');
      }
    }
    prevRollCount = rc;
  });

  function onPhysicsComplete(): void {
    physicsRolling = false;
  }

  $effect(() => {
    const ts = session.state?.turnScore ?? 0;
    if (ts > prevTurnScore && getIsMyTurn()) {
      const delta = ts - prevTurnScore;
      triggerFloatScore(delta);
      gameQuotes.handleTurnScoreDelta(delta, true);
      const combo = detectCombo(lastKeepFaces);
      if (combo) {
        activeCombo = combo;
        comboVisible = true;
        gameQuotes.handleCombo(true);
      }
    }
    prevTurnScore = ts;
  });

  function triggerFloatScore(amount: number): void {
    const anchor =
      document.querySelector('[data-turn-score-anchor]') ??
      boardEl?.querySelector('.dice-board__active');
    const pt = centerOf(anchor as HTMLElement | null);
    floatX = pt?.x ?? window.innerWidth / 2;
    floatY = pt?.y ?? window.innerHeight / 2;
    floatAmount = amount;
    floatShow = true;
    setTimeout(() => {
      floatShow = false;
    }, 900);
  }

  function handleKeep(): void {
    if (!session.state) return;
    lastKeepFaces = session.selectedDieIds
      .map((id) => session.state!.dice.find((d) => d.id === id)?.value)
      .filter((v): v is DieFace => v !== undefined);
    keepSelection();
  }

  let isMyTurn = $derived(getIsMyTurn());
  let canRoll = $derived(getCanRoll());
  let canKeep = $derived(getCanKeep());
  let canBank = $derived(getCanBank());
  let preview = $derived(getSelectionPreview());
  let inLobby = $derived(session.state?.phase === 'lobby');
  let inDiceSelection = $derived(session.state?.phase === 'dice_selection');
  let bothSeated = $derived(getBothSeated());
  let dicePickWaitText = $derived(getDicePickWaitText());

  let lobbyWaitText = $derived.by(() => {
    if (!inLobby) return '';
    if (!bothSeated) {
      if (session.you === 'host') return '等待对手入座…';
      const full = session.state?.players.every((p) => p.name);
      return full ? '等待房主开始游戏…' : '等待对手入座…';
    }
    if (session.you === 'host') return '';
    return '已连接！等待房主开始游戏…';
  });

  let isRolling = $derived(session.state?.phase === 'rolling');

  let winnerName = $derived.by(() => {
    if (!session.state?.winner) return '';
    const winner = session.state.players.find((p) => p.id === session.state!.winner);
    return winner?.name ?? '';
  });

  let opponentName = $derived.by(() => {
    if (!session.state || !session.you) return '对手';
    const opponent = session.state.players.find((p) => p.id !== session.you);
    return opponent?.name || '对手';
  });

  let bustPlayerName = $derived.by(() => {
    const bust = session.state?.lastBust;
    if (!bust || !session.state) return '';
    const player = session.state.players.find((p) => p.id === bust.by);
    return player?.name ?? '';
  });

  let turnEndPlayerName = $derived.by(() => {
    const snap = session.state?.lastTurnEnd;
    if (!snap || !session.state) return '';
    const player = session.state.players.find((p) => p.id === snap.by);
    return player?.name ?? '';
  });

  let mySelectedDieIds = $derived(getMySelectedDieIds());
  let remoteSelectedDieIds = $derived(getRemoteSelectedDieIds());
  let opponentSelecting = $derived(isOpponentSelecting());

  let isWinner = $derived(session.state?.winner != null && session.state.winner === session.you);
  let canRestart = $derived(session.you === 'host' && session.state?.phase === 'game_over');

  let showDice = $derived(
    session.state &&
      !inLobby &&
      !inDiceSelection &&
      session.state.phase !== 'rps' &&
      session.state.phase !== 'draft_rps',
  );

  let unsupportedPhase = $derived(
    session.state?.phase === 'rps' || session.state?.phase === 'draft_rps',
  );

  $effect(() => {
    if (!showDice) showRulesSheet = false;
  });

  $effect(() => {
    if (!showDice) {
      gameQuotes.stop();
      return;
    }
    const phase = session.state?.phase;
    const rollCount = session.state?.rollCount ?? 0;
    gameQuotes.handlePhaseChange(phase, rollCount);
    gameQuotes.handlePhaseQuote(phase, isWinner);
  });

  $effect(() => {
    if (!showDice) return;
    gameQuotes.handlePreview(preview, isMyTurn);
  });

  $effect(() => {
    const active = Boolean(showDice && isMyTurn && session.state?.phase === 'selecting');
    session.state?.rollCount;
    session.selectedDieIds.length;
    session.state?.turnScore;
    gameQuotes.onActivity(active);
  });

  let copiedCode = $state(false);
  let copiedLink = $state(false);

  function handleRulesConfirm(config: {
    targetScore: number;
    specialDiceCount: 0 | 1 | 2 | 3;
  }): void {
    startGame(config);
    showRulesConfig = false;
  }

  async function copyRoomCode(): Promise<void> {
    const id = session.roomId ?? roomId;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id.toUpperCase());
      copiedCode = true;
      copiedLink = false;
      setTimeout(() => (copiedCode = false), 2000);
    } catch {
      /* clipboard denied */
    }
  }

  async function copyInviteLink(): Promise<void> {
    const id = session.roomId ?? roomId;
    if (!id) return;
    try {
      // 只分享房间号；勿带房主昵称，否则客人会与房主同名并被当成房主重连
      await navigator.clipboard.writeText(shareUrl(id));
      copiedLink = true;
      copiedCode = false;
      setTimeout(() => (copiedLink = false), 2000);
    } catch {
      /* clipboard denied */
    }
  }
</script>

<div class="game-root">
  <TavernAmbience />

  <div class="game-page page-shell">
    <Header
      roomId={session.roomId ?? roomId}
      connected={session.connected}
      connecting={session.connecting}
      {onLeave}
    />

    {#if session.lastError}
      <div class="toast toast--error" role="alert">
        {session.lastError}
        <button type="button" class="toast__close" onclick={clearError} aria-label="关闭">×</button>
      </div>
    {/if}

    <main
      class="game-shell game-page__main"
      class:game-page__main--pick={inDiceSelection}
      class:game-page__main--play={showDice}
    >
      {#if session.state}
        {#if unsupportedPhase}
          <div class="game-page__placeholder card">
            <p>该阶段（{session.state.phase}）尚未支持，敬请期待。</p>
          </div>
        {:else if inLobby}
          {#if showRulesConfig && session.you === 'host'}
            <RulesConfigPanel
              onBack={() => (showRulesConfig = false)}
              onConfirm={handleRulesConfirm}
            />
          {:else}
            <div class="game-page__lobby card">
              {#if session.you === 'host'}
                <div class="game-page__share">
                  <button type="button" class="btn btn-gilded game-page__share-btn" onclick={copyRoomCode}>
                    {copiedCode ? '已复制暗号' : '复制房间暗号'}
                  </button>
                  <button type="button" class="btn btn-gilded game-page__share-btn" onclick={copyInviteLink}>
                    {copiedLink ? '已复制链接' : '复制邀请链接'}
                  </button>
                </div>
              {/if}

              {#if bothSeated}
                <p class="game-page__connected" role="status">
                  {#if session.you === 'host'}
                    对手已连接！
                  {:else}
                    已连接！等待房主开始游戏…
                  {/if}
                </p>
              {:else}
                <h2 class="game-page__lobby-title">牌桌已备好</h2>
                <p class="game-page__lobby-hint">等人到齐后，房主即可开局。</p>
              {/if}

              <ul class="game-page__players">
                {#each session.state.players as player (player.id)}
                  <li class:game-page__player--ready={!!player.name}>
                    <span class="game-page__player-role">{player.id === 'host' ? '房主' : '客人'}</span>
                    {player.name || '尚未入座…'}
                  </li>
                {/each}
              </ul>

              {#if bothSeated && session.you === 'host'}
                <button
                  type="button"
                  class="btn btn-gilded btn-full game-page__rules-btn"
                  onclick={() => (showRulesConfig = true)}
                >
                  设置规则
                </button>
              {/if}
            </div>
          {/if}
        {:else if inDiceSelection}
          <DiceSelector />
        {:else if showDice}
          <div class="game-page__play">
            <GameHud state={session.state} you={session.you} />

            <div class="game-page__quote">
              <TavernQuoteBar quote={gameQuotes.quote} compact />
            </div>

            <div class="game-page__stage">
              <div class="game-page__center" bind:this={boardEl}>
                <DiceTable onRules={() => (showRulesSheet = true)}>
                  <DiceBoard
                    dice={session.state.dice}
                    selectedIds={mySelectedDieIds}
                    remoteSelectedIds={remoteSelectedDieIds}
                    rollCount={session.state.rollCount}
                    turnScore={session.state.turnScore}
                    rolling={isRolling || physicsRolling}
                    physicsRolling={physicsRolling && physicsEnabled}
                    onPhysicsComplete={onPhysicsComplete}
                    onToggle={toggleDie}
                  />
                </DiceTable>

                <TurnScoreCard score={session.state.turnScore} {preview} />
              </div>
            </div>
          </div>
        {/if}
      {:else if session.connecting}
        <p class="game-page__loading">正在推门进入…</p>
      {:else}
        <p class="game-page__loading">无法连接房间</p>
      {/if}

      {#if !showDice}
        <div class="game-page__spacer"></div>
      {/if}

      <ActionBar
        {inLobby}
        {inDiceSelection}
        {isMyTurn}
        {canRoll}
        {canKeep}
        {canBank}
        {lobbyWaitText}
        {dicePickWaitText}
        opponentWaitName={opponentName}
        {opponentSelecting}
        turnScore={session.state?.turnScore ?? 0}
        onRoll={roll}
        onKeep={handleKeep}
        onBank={bank}
      />
    </main>

    <PhaseOverlay
      phase={session.state?.phase ?? null}
      {winnerName}
      {isMyTurn}
      {isWinner}
      {opponentName}
      {bustPlayerName}
      lastBust={session.state?.lastBust ?? null}
      lastTurnEnd={session.state?.lastTurnEnd ?? null}
      {turnEndPlayerName}
      you={session.you}
      {canRestart}
      onLeave={() => onLeave?.()}
      onRestart={restartGame}
    />

    <FloatingScore show={floatShow} amount={floatAmount} x={floatX} y={floatY} />
    <ComboBanner combo={activeCombo} visible={comboVisible} onDone={() => (comboVisible = false)} />

    {#if showRulesSheet && showDice}
      <RulesSheet onClose={() => (showRulesSheet = false)} />
    {/if}
  </div>
</div>

<style>
  .game-root {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100svh;
  }

  .game-page {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .game-page__main {
    padding-bottom: calc(var(--action-bar-height) + var(--safe-bottom) + var(--space-3));
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .game-page__main--pick {
    min-height: 0;
    overflow: hidden;
  }

  .game-page__play {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    width: 100%;
  }

  .game-page__quote {
    flex: none;
    width: 100%;
    max-width: min(640px, 100%);
    margin-inline: auto;
    padding: 0 var(--space-2) var(--space-1);
    opacity: 0.95;
  }

  .game-page__stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 0;
    width: 100%;
    padding: var(--space-2) var(--space-1);
  }

  .game-page__center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    width: 100%;
    max-width: min(640px, 100%);
    margin-block: auto;
  }

  .game-page__main--play {
    min-height: 0;
    gap: 0;
    padding-top: var(--space-1);
  }

  @media (min-width: 1024px) {
    .game-page__main {
      padding-bottom: var(--space-4);
    }

    .game-page__main--pick {
      max-width: var(--layout-max-width);
      margin-inline: auto;
      width: 100%;
    }
  }

  .game-page__loading,
  .game-page__placeholder {
    text-align: center;
    padding: var(--space-5);
    color: var(--color-text-soft);
  }

  .game-page__lobby {
    margin-top: var(--space-4);
    animation: fadeUp 0.35s var(--ease-out);
  }

  .game-page__connected {
    text-align: center;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-success) 40%, transparent);
    border-radius: var(--radius-card);
    padding: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .game-page__share {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .game-page__share-btn {
    min-height: 40px;
    padding-inline: var(--space-2);
    font-size: 0.8125rem;
  }

  .game-page__lobby-title {
    font-family: var(--font-serif);
    font-size: 1.375rem;
    color: var(--color-gold);
    margin-bottom: var(--space-2);
    text-align: center;
  }

  .game-page__lobby-hint {
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-text-soft);
    margin-bottom: var(--space-4);
  }

  .game-page__rules-btn {
    margin-top: var(--space-4);
    min-height: 48px;
  }

  .game-page__players {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .game-page__players li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    background: rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    color: var(--color-text-soft);
    border: 1px solid rgba(201, 168, 106, 0.1);
  }

  .game-page__player--ready {
    color: var(--color-text);
    border-color: var(--color-border-gold);
  }

  .game-page__player-role {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-gold);
    background: var(--color-gold-wash);
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-pill);
    flex-shrink: 0;
  }

  .game-page__spacer {
    flex: 1;
    min-height: var(--space-2);
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
