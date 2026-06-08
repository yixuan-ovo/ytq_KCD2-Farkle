<script lang="ts">
  import Header from '../components/layout/Header.svelte';
  import TavernAmbience from '../components/layout/TavernAmbience.svelte';
  import MainMenu from '../components/lobby/MainMenu.svelte';
  import JoinForm from '../components/lobby/JoinForm.svelte';
  import RulesSheet from '../components/lobby/RulesSheet.svelte';
  import SettingsPanel from '../components/lobby/SettingsPanel.svelte';
  import DiceCollectionPanel from '../components/lobby/DiceCollectionPanel.svelte';

  interface Props {
    initialRoomId?: string;
    initialName?: string;
    onEnterRoom?: (roomId: string, name: string) => void;
  }

  let { initialRoomId = '', initialName = '', onEnterRoom }: Props = $props();

  type LobbyScreen = 'menu' | 'play' | 'rules' | 'settings' | 'collection';

  let joinByInvite = $derived(!!initialRoomId);
  let screen = $state<LobbyScreen>('menu');

  $effect.pre(() => {
    if (joinByInvite) screen = 'play';
  });

  function handleEnter(roomId: string, name: string): void {
    onEnterRoom?.(roomId, name);
  }
</script>

<div class="lobby-root">
  <TavernAmbience />

  <div class="lobby">
    <Header />

    <main class="lobby__main">
      {#if screen === 'menu'}
        <MainMenu
          onStart={() => (screen = 'play')}
          onCollection={() => (screen = 'collection')}
          onRules={() => (screen = 'rules')}
          onSettings={() => (screen = 'settings')}
        />
      {:else if screen === 'play'}
        <div class="lobby__play">
          {#if !joinByInvite}
            <button type="button" class="lobby__back btn btn-secondary" onclick={() => (screen = 'menu')}>
              ← 返回主菜单
            </button>
          {/if}
          <JoinForm
            {initialName}
            {initialRoomId}
            initialTab={initialRoomId ? 'join' : 'create'}
            joinOnly={!!initialRoomId}
            onEnter={handleEnter}
          />
        </div>
      {/if}
    </main>

    <footer class="lobby__footer">
      <span>联机 · farkle.yixr.uno</span>
    </footer>
  </div>

  {#if screen === 'rules'}
    <RulesSheet onClose={() => (screen = joinByInvite ? 'play' : 'menu')} />
  {/if}
  {#if screen === 'settings'}
    <SettingsPanel onClose={() => (screen = joinByInvite ? 'play' : 'menu')} />
  {/if}
  {#if screen === 'collection'}
    <DiceCollectionPanel onClose={() => (screen = joinByInvite ? 'play' : 'menu')} />
  {/if}
</div>

<style>
  .lobby-root {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100svh;
  }

  .lobby {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
  }

  .lobby__main {
    flex: 1 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: var(--space-5) var(--layout-gutter);
  }

  .lobby__play {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    width: min(420px, 100%);
  }

  .lobby__back {
    align-self: flex-start;
    font-size: 0.8125rem;
    padding: 0.35rem 0.75rem;
    min-height: auto;
  }

  .lobby__footer {
    flex: none;
    margin-top: auto;
    background: var(--wood-mid);
    border-top: 1px solid rgba(201, 168, 106, 0.15);
    color: var(--color-text-on-dark-soft);
    text-align: center;
    padding: var(--space-3);
    padding-bottom: calc(var(--space-3) + var(--safe-bottom));
    font-size: 0.75rem;
  }
</style>
