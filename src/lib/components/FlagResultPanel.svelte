<script lang="ts">
  import type { ITargetCountryState } from '$lib/state.svelte';

  let {
    gameWon,
    gameOver,
    targetCountryState,
    restartGame,
  }: {
    gameWon: boolean;
    gameOver: boolean;
    targetCountryState: ITargetCountryState;
    restartGame: () => void;
  } = $props();

  let buttonRef = $state<HTMLButtonElement>();

  $effect(() => {
    if ((gameWon || gameOver) && buttonRef) {
      buttonRef.focus();
    }
  });
</script>

{#if gameWon || gameOver}
  <div
    class="w-full bg-primary-900 border-2 border-primary-100 rounded-lg p-6 text-center"
  >
    <div
      class="text-2xl font-bold mb-2"
      class:text-secondary-600={gameWon}
      class:text-primary-50={gameOver}
    >
      {gameWon ? 'Congratulations!' : 'Game Over'}
    </div>
    <div class="text-primary-50 mb-4">
      {#if gameWon}
        You guessed <span class="font-semibold text-secondary-600"
          >{targetCountryState.targetCountry?.name}</span
        > correctly!
      {:else}
        The correct answer was
        <span class="font-semibold text-secondary-600"
          >{targetCountryState.targetCountry?.name}</span
        >
      {/if}
    </div>
    <button
      bind:this={buttonRef}
      onclick={restartGame}
      class="bg-secondary-900 min-h-11 p-2 px-4 rounded self-start text-white font-semibold hover:scale-[1.02] active:scale-95 transition-all disabled:bg-secondary-900/30 disabled:text-secondary-100/50 disabled:cursor-not-allowed"
    >
      {targetCountryState.isDailyGame ? 'Play Random Mode' : 'New Flag'}
    </button>
  </div>
{/if}
