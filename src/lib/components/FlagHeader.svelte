<script lang="ts">
  import type { ITargetCountryState } from '$lib/state.svelte';

  let { targetCountryState }: { targetCountryState: ITargetCountryState } = $props();
</script>

<div class="flex flex-col items-center gap-1">
  {#if !targetCountryState.isTodaysFlag}
    <div class="text-s text-secondary-100 flex items-center gap-1">
      <span>✓</span>
      <span>Today's flag completed</span>
    </div>
  {/if}
  <div class="text-xl text-primary-900 font-medium">
    {targetCountryState.isTodaysFlag ? "Today's Flag" : 'Random Flag'}
  </div>
</div>
