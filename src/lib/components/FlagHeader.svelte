<script lang="ts">
  import type { ITargetCountryState } from '$lib/state.svelte';

  let { targetCountryState }: { targetCountryState: ITargetCountryState } = $props();
</script>

<div class="flex flex-col items-center gap-1">
  <div class="text-xl text-secondary-600 font-medium">
    {targetCountryState.isDailyGame ? "Today's Flag" : 'Random Flag'}
  </div>
</div>
