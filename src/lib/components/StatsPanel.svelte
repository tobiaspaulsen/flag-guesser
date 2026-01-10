<script lang="ts">
  import type { GameStats } from '$lib/state.svelte';

  let { gameStats }: { gameStats: GameStats } = $props();

  const winPercentage = $derived(
    gameStats.played > 0 ? Math.round((gameStats.won / gameStats.played) * 100) : 0
  );

  const maxGuessCount = $derived(
    Math.max(...Object.values(gameStats.guessDistribution), 1)
  );

  const guessDistributionArray = $derived(
    Array.from({ length: 5 }, (_, i) => ({
      guesses: i + 1,
      count: gameStats.guessDistribution[i + 1] || 0,
      percentage: maxGuessCount > 0 
        ? (gameStats.guessDistribution[i + 1] || 0) / maxGuessCount * 100 
        : 0
    }))
  );
</script>

<div class="w-full bg-primary-900 border-2 border-primary-100 rounded-lg p-6">
  <h2 class="text-2xl font-bold text-secondary-600 mb-4 text-center">Statistics</h2>
  
  <div class="grid grid-cols-4 gap-4 mb-3"> 
    <div class="text-center">
      <div class="text-2xl font-bold text-primary-50">{gameStats.played}</div>
      <div class="text-sm text-primary-100">Played</div>
    </div>
    <div class="text-center">
      <div class="text-2xl font-bold text-primary-50">{winPercentage}%</div>
      <div class="text-sm text-primary-100">Win Rate</div>
    </div>
    <div class="text-center">
      <div class="text-2xl font-bold text-primary-50">{gameStats.currentStreak}</div>
      <div class="text-sm text-primary-100">Current Streak</div>
    </div>
    <div class="text-center">
      <div class="text-2xl font-bold text-primary-50">{gameStats.maxStreak}</div>
      <div class="text-sm text-primary-100">Max Streak</div>
    </div>
  </div>

  <div class="space-y-2">
    <h3 class="text-lg font-semibold text-primary-50">Guesses needed</h3>
    {#each guessDistributionArray as { guesses, count, percentage }}
      <div class="flex items-center gap-2">
        <div class="text-primary-50 w-3 text-right text-sm">{guesses}</div>
        <div class="flex-1 h-7">
          <div 
            class="h-full bg-secondary-600 rounded-sm transition-all duration-500 flex items-center justify-end pr-2"
            style="width: {Math.max(percentage, count > 0 ? 8 : 0)}%"
          >
          {#if (count > 0)}
            <span class="text-sm font-medium text-primary-900">{count}</span>
          {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
