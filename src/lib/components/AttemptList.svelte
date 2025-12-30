<script lang="ts">
  import type { IGuessesState } from '$lib/state.svelte';

  let { guessesState }: { guessesState: IGuessesState } = $props();
</script>

<div class="flex flex-col gap-3 w-full mt-4 text-l">
  <div class="text-primary-100 text-sm font-semibold uppercase tracking-wide">Your guesses</div>

  {#each Array(5) as _, i}
    <div
      class="flex h-14 rounded-lg overflow-hidden border border-primary-200 transition-all"
      class:bg-primary-900={guessesState.guessesList[i]}
      class:bg-transparent={!guessesState.guessesList[i]}
      class:border-dashed={!guessesState.guessesList[i]}
    >
      <div class="w-20 flex items-center justify-center bg-primary-100/15 p-2">
        {#if guessesState.guessesList[i]?.img}
          <img
            class="h-full w-full object-cover rounded-sm"
            src={guessesState.guessesList[i].img.toDataURL()}
            alt="Flag of {guessesState.guessesList[i].country}"
          />
        {:else}
          <div class="text-primary-50/30">{i + 1}</div>
        {/if}
      </div>
      <div class="grow flex items-center px-4 text-primary-50">
        {#if guessesState.guessesList[i]?.country}
          {guessesState.guessesList[i].country}
        {/if}
      </div>
      <div
        class="w-20 flex items-center justify-center text-center font-semibold bg-primary-100/15"
      >
        {#if guessesState.guessesList[i]?.score}
          <span class="text-secondary-600">{guessesState.guessesList[i].score}%</span>
        {:else}
          <span class="text-primary-50/30">-</span>
        {/if}
      </div>
    </div>
  {/each}
</div>
