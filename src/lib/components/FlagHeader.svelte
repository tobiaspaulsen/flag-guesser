<script lang="ts">
  import type { ITargetCountryState } from '$lib/state.svelte';

  let { 
    targetCountryState,
    easyMode = $bindable()
  }: { 
    targetCountryState: ITargetCountryState;
    easyMode: boolean;
  } = $props();
</script>

<div class="flex flex-col items-center gap-3">
  <label class="flex items-center gap-2 cursor-pointer text-primary-50">
    <span class="text-sm font-medium">Easy</span>
    <button
      type="button"
      role="switch"
      aria-checked={easyMode}
      aria-label="Toggle easy mode"
      onclick={() => easyMode = !easyMode}
      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 border-2 {easyMode ? 'bg-secondary-600 border-secondary-600' : 'bg-primary-800 border-primary-300'}"
    >
      <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform {easyMode ? 'translate-x-[1.35rem]' : 'translate-x-0.5'}"></span>
    </button>
  </label>
  
  <div class="text-xl text-secondary-600 font-medium">
    {targetCountryState.isDailyGame ? "Today's Flag" : 'Random Mode'}
  </div>
</div>
