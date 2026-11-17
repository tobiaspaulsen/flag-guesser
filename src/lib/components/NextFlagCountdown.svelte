<script lang="ts">
  import { getNextDailyFlagTime } from '$lib/state.svelte';

  let { gameDate }: { gameDate: string } = $props();

  const nextFlagAt = $derived(getNextDailyFlagTime(gameDate));

  let now = $state(Date.now());
  const remainingMs = $derived(Math.max(0, nextFlagAt - now));

  $effect(() => {
    const interval = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(interval);
  });

  const pad = (n: number) => String(n).padStart(2, '0');

  const formatted = $derived.by(() => {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  });
</script>

<div class="mt-5 pt-4 border-t border-primary-200 text-center">
  {#if remainingMs > 0}
    <div class="text-sm text-primary-50">Next flag in</div>
    <div
      class="text-2xl font-bold text-secondary-600 tabular-nums"
      role="timer"
      aria-live="off"
    >
      {formatted}
    </div>
  {:else}
    <div class="text-primary-50 mb-3">A new flag is ready!</div>
    <button
      onclick={() => location.reload()}
      class="bg-secondary-900 min-h-11 p-2 px-4 rounded text-white font-semibold hover:scale-[1.02] active:scale-95 transition-all"
    >
      Play today's flag
    </button>
  {/if}
</div>
