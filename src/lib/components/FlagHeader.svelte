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
  <div class="flex items-center gap-2">
    <div class="flex items-center gap-2 text-primary-50">
      <span class="text-sm font-medium">Easy</span>
      <button
        type="button"
        role="switch"
        aria-checked={easyMode}
        aria-label="Toggle easy mode"
        onclick={() => easyMode = !easyMode}
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 border-2 border-primary-300 {easyMode ? 'bg-secondary-600' : 'bg-primary-800'}"
      >
        <span class="inline-block h-4 w-4 transform rounded-full bg-primary-50 shadow-md transition-transform {easyMode ? 'translate-x-[1.35rem]' : 'translate-x-0.5'}"></span>
      </button>
    </div>
    
    <div class="relative group">
      <button
        type="button"
        aria-label="Easy mode information"
        class="w-5 h-5 rounded-full border-2 border-primary-50 text-primary-50 flex items-center justify-center text-xs font-bold leading-none"
      >
        i
      </button>
      <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-primary-900 text-primary-50 text-xs rounded shadow-lg border-2 border-primary-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
        Easy mode shows the flags in addition to the country names in the dropdown.
      </div>
    </div>
  </div>
  
  <div class="text-xl text-secondary-600 font-medium">
    {targetCountryState.isDailyGame ? "Today's Flag" : 'Random Mode'}
  </div>
</div>
