<script lang="ts">
  import LobbyView from './views/LobbyView.svelte';
  import GameView from './views/GameView.svelte';
  import { leaveRoom } from '$lib/client/gameSession.svelte';
  import { loadPlayerName, parseNameFromQuery, parseRoomFromPath, clearPlayerName } from '$lib/client/config';

  type View = 'lobby' | 'game';

  function getInitialView(): { view: View; roomId: string; name: string } {
    const roomId = parseRoomFromPath(window.location.pathname) ?? '';
    const nameFromQuery = parseNameFromQuery();
    const savedName = loadPlayerName();

    // 邀请链接若带 ?name=（旧链或误拷），先进大厅让玩家确认/修改昵称，避免与房主同名
    // 邀请链接一律先进大厅确认昵称，避免 localStorage 里存了旧昵称误连
    if (roomId) {
      return { view: 'lobby', roomId, name: nameFromQuery || savedName || '' };
    }
    return { view: 'lobby', roomId: '', name: '' };
  }

  let initial = getInitialView();
  let view = $state<View>(initial.view);
  let roomId = $state(initial.roomId);
  let playerName = $state(initial.name);

  function handleEnterRoom(id: string, name: string): void {
    const normalized = id.trim().toUpperCase();
    roomId = normalized;
    playerName = name;
    view = 'game';
    const url = name
      ? `/room/${normalized}?name=${encodeURIComponent(name)}`
      : `/room/${normalized}`;
    window.history.pushState({}, '', url);
  }

  function handleLeaveRoom(): void {
    leaveRoom();
    roomId = '';
    playerName = '';
    view = 'lobby';
    clearPlayerName();
    window.history.pushState({}, '', '/');
  }

  function handleLobbyEnter(id: string, name: string): void {
    handleEnterRoom(id, name);
  }

  function handlePopState(): void {
    const wasInGame = view === 'game';
    const next = getInitialView();
    view = next.view;
    roomId = next.roomId;
    playerName = next.name;
    if (wasInGame && next.view === 'lobby') {
      leaveRoom();
    }
  }

  $effect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  });
</script>

{#if view === 'game' && roomId}
  <GameView {roomId} playerName={playerName} onLeave={handleLeaveRoom} />
{:else}
  <LobbyView
    initialRoomId={roomId}
    initialName={playerName}
    onEnterRoom={handleLobbyEnter}
  />
{/if}
