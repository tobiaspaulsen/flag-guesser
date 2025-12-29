<script lang="ts">
  import type { ITargetCountryState } from '$lib/state.svelte';

  let {
    gameWon,
    gameOver,
    targetCountryState,
    restartGame
  }: {
    gameWon: boolean;
    gameOver: boolean;
    targetCountryState: ITargetCountryState;
    restartGame: () => void;
  } = $props();
</script>

{#if gameWon || gameOver}
  <div class="w-full bg-primary-50 border-2 border-primary-200 rounded-lg p-6 text-center">
    <div class="text-2xl font-bold mb-2" class:text-secondary-100={gameWon} class:text-primary-900={!gameWon}>
      {gameWon ? 'Congratulations!' : 'Game Over'}
    </div>
    <div class="text-primary-900 mb-4">
      {#if gameWon}
        You guessed <span class="font-semibold text-secondary-100">{targetCountryState.targetCountry?.name}</span> correctly!
      {:else}
        The correct answer was
        <span class="font-semibold text-secondary-100">{targetCountryState.targetCountry?.name}</span>
      {/if}
    </div>
    <button
      onclick={restartGame}
      class="bg-secondary-100 text-secondary-900 px-6 py-3 rounded-lg font-semibold hover:bg-secondary-200 transition-colors"
    >
      Play Random Mode
    </button>
  </div>
{/if}
