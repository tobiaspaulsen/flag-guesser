<script lang="ts">
  import Game from '$lib/components/Game.svelte';
  import {
    createCountriesState,
    createGuessesState,
    createTargetCountryState,
    loadLatestDailyGameState,
  } from '$lib/state.svelte';
  import { getPreviousGameState, type PreviousGame } from '$lib/utils';

  let loadedPreviousGame: boolean = $state(false);
  let previousGameState: PreviousGame | null = $state(null);

  let latestDailyGame = loadLatestDailyGameState();

  $effect(() => {
    if (latestDailyGame) {
      const previousGamePromise = getPreviousGameState(latestDailyGame);
      previousGamePromise
        .then((result) => {
          previousGameState = result;
        })
        .catch((error) => {
          console.error('Error loading previous game state:', error);
        })
        .finally(() => {
          loadedPreviousGame = true;
        });
    } else {
      loadedPreviousGame = true;
    }
  });

  const countriesState = createCountriesState();

  let targetCountryState = $derived(
    countriesState.loaded ? createTargetCountryState(countriesState) : null,
  );

  let guessesState = createGuessesState();
</script>

<header class="text-primary-50 text-center p-5 mb-3 w-full">
  <h1 class="text-3xl font-variation-settings-[150] font-medium">
    Flag Guesser
  </h1>
</header>
<div class="w-[min(85vw,400px)] mx-auto">
  {#if loadedPreviousGame && countriesState.loaded && targetCountryState && guessesState}
    <Game
      {previousGameState}
      {guessesState}
      {countriesState}
      {targetCountryState}
    />
  {:else}
    <p>Loading...</p>
  {/if}
</div>
