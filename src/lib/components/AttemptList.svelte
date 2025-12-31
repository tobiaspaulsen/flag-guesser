<script lang="ts">
  import type { IGuessesState } from '$lib/state.svelte';

  let { guessesState }: { guessesState: IGuessesState } = $props();
</script>

<div class="flex flex-col gap-3 w-full mt-4 text-l">
  <div class="text-primary-100 text-sm font-semibold uppercase tracking-wide">Your guesses</div>

  {#each Array(5) as _, i}
    {@const guess = guessesState.guessesList[i]}
    {@const isCorrect = guess?.correct}
    <div
      class="flex h-14 rounded-lg overflow-hidden border border-primary-200 transition-all"
      class:bg-primary-900={guess}
      class:bg-transparent={!guess}
      class:border-dashed={!guess}
    >
      <div class="w-20 flex items-center justify-center bg-primary-100/15 p-2">
        {#if guess?.img}
          <img
            class="h-full object-cover rounded-sm"
            src={guess.img.toDataURL()}
            alt="Flag of {guess.country.name}"
          />
        {:else}
          <div class="text-primary-50/30">{i + 1}</div>
        {/if}
      </div>
      <div
        class="grow flex items-center px-4"
        class:text-secondary-900={isCorrect}
        class:font-bold={isCorrect}
        class:text-primary-50={!isCorrect}
      >
        {guess?.country.name ?? ''}
      </div>
      <div
        class="w-20 flex items-center justify-center text-center font-semibold bg-primary-100/15"
      >
        {#if guess?.score !== undefined}
          <span
            class:text-secondary-900={isCorrect}
            class:font-bold={isCorrect}
            class:text-primary-50={!isCorrect}
          >
            {guess.score}%
          </span>
        {/if}
      </div>
    </div>
  {/each}
</div>
