<script lang="ts">
  import Game from '$lib/components/Game.svelte';
  import { createCountriesState, createGuessesState, createTargetCountryState } from '$lib/state.svelte';

  const guessesState = createGuessesState();
  const countriesState = createCountriesState();
  
  let targetCountryState = $derived(
    countriesState.loaded ? createTargetCountryState(countriesState) : null
  );
</script>

<header class="text-primary-900 text-center p-5 mb-3 w-full">
  <h1 class="text-3xl font-variation-settings-[150] font-medium">Flag Guesser</h1>
</header>
<div class="w-[min(75vw,400px)]">
  {#if countriesState.loaded && targetCountryState}
    <Game {guessesState} {countriesState} {targetCountryState} />
  {:else}
    <p>Loading...</p>
  {/if}
</div>
