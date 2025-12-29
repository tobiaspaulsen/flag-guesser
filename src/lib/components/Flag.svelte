<script lang="ts">
  import { getImageIntersect, getImageUnion } from '$lib/getImageIntersect';
  import { Image } from 'image-js';
  import { type ICountriesState, type IGuessesState, type ITargetCountryState } from '$lib/state.svelte';
  import CountrySearch from './CountrySearch.svelte';
  import AttemptList from './AttemptList.svelte';

  // Game state
  let gameOver: boolean = $state(false);
  let gameWon: boolean = $state(false);
  
  // Overlay animation state
  let showOverlay: boolean = $state(false);
  let overlayFlagUrl: string = $state('');

  let {
    guessesState,
    countriesState,
    targetCountryState
  }: { guessesState: IGuessesState; countriesState: ICountriesState; targetCountryState: ITargetCountryState } = $props();
  let guessString: string = $state('');
  let guessCountryCode: string | undefined = $state();

  let currentResult: Image | undefined = $state();
  let imgUrl: string | undefined = $derived(currentResult?.toDataURL());

  $effect(() => {
    if (targetCountryState.targetCountry) {
      console.log('targetCountry:', targetCountryState.targetCountry.name);
    }
  });

  const checkGuess = async () => {
    if (guessString.trim().toLowerCase() === targetCountryState.targetCountry?.name.trim().toLowerCase()) {
      gameWon = true;
      // Mark today's flag as completed if it was today's flag
      if (targetCountryState.isTodaysFlag) {
        targetCountryState.markTodayCompleted();
      }
    }
    guessCountryCode = countriesState.countries.find(
      (country) => country.name.toLowerCase() === guessString.trim().toLowerCase()
    )?.countryCode;

    if (!guessCountryCode) {
      console.error('Country code not found for:', guessString);
      return;
    }

    try {
      const guessedCountryImageUrl = `/countries/png/${guessCountryCode}.png`;
      overlayFlagUrl = `/countries/png/${guessCountryCode}.png`;
      showOverlay = true;
      setTimeout(() => {
        showOverlay = false;
      }, 800);
      
      let image1: Image = await Image.load(targetCountryState.targetFlagImgUrl);
      let image2: Image = await Image.load(`/countries/png/${guessCountryCode}.png`);
      
      let intersect = getImageIntersect(image1, image2, 0.5);
      
      currentResult = getImageUnion(currentResult, intersect.Image);

      guessesState.addNewGuess({ country: guessString, score: `${intersect.percent}`, img: image2 });

      if (guessesState.guessesList.length >= 5) {
        gameOver = true;
      }
      guessString = '';
      const guessInput = document.getElementById('country-input');
      if (guessInput) {
        guessInput.innerHTML = guessString;
      }
    } catch (error) {
      console.error('Error loading or processing images:', error);
      guessString = '';
    }
  };
  
  const restartGame = () => {
    gameOver = false;
    gameWon = false;
    guessString = '';
    guessCountryCode = undefined;
    currentResult = undefined;
    showOverlay = false;
    overlayFlagUrl = '';
    guessesState.resetGuesses();
    targetCountryState.resetTarget();
  };
</script>

<div class="flex flex-col items-center gap-5">
  <div class="flex flex-col items-center gap-1">
    {#if !targetCountryState.isTodaysFlag}
      <div class="text-s text-secondary-100 flex items-center gap-1">
        <span>✓</span>
        <span>Today's flag completed</span>
      </div>
    {/if}
    <div class="text-xl text-primary-500 font-medium">
      {targetCountryState.isTodaysFlag ? "Today's Flag" : 'Random Flag'}
    </div>
  </div>

  {#if gameWon || gameOver}
    <div class="w-full bg-primary-50 border-2 border-primary-200 rounded-lg p-6 text-center">
      <div class="text-2xl font-bold mb-2" class:text-secondary-100={gameWon} class:text-primary-900={!gameWon}>
        {gameWon ? 'Congratulations!' : 'Game Over'}
      </div>
      <div class="text-primary-900 mb-4">
        {#if gameWon}
          You guessed <span class="font-semibold text-secondary-100">{targetCountryState.targetCountry?.name}</span> correctly!
        {:else}
          The correct answer was <span class="font-semibold text-secondary-100">{targetCountryState.targetCountry?.name}</span>
        {/if}
      </div>
      <button
        onclick={restartGame}
        class="bg-secondary-100 text-secondary-900 px-6 py-3 rounded-lg font-semibold hover:bg-secondary-200 transition-colors"
      >
        Play Random Mode
      </button>
    </div>
  {/if}
  
  <div
    class="flex flex-row justify-center items-center border-2 border-solid border-primary-200 rounded-lg bg-primary-50/20 relative overflow-hidden"
    style="width: 400px; height: 300px;"
  >
    {#if guessCountryCode !== undefined}
      {#if showOverlay}
        <img 
          src={overlayFlagUrl} 
          alt="" 
          class="absolute inset-0 object-contain overlay-animation z-10"
        />
      {/if}
      <img src={imgUrl} alt="" class="absolute inset-0 object-contain" />
    {:else}
      <div class="text-primary-200 text-center p-4">
      </div>
    {/if}
  </div>

  <div class="flex gap-2 w-full justify-center items-center">
    <CountrySearch
      {countriesState}
      bind:guessString
      onsubmit={checkGuess}
      guessedCountries={guessesState.guessedCountries}
    />
    <button
      disabled={gameOver ||
        gameWon ||
        guessString.trim().length === 0 ||
        guessesState.guessedCountries.includes(guessString.trim())}
      class="bg-secondary-100 min-h-11 p-2 rounded self-start text-secondary-900 disabled:bg-secondary-200/[0.5] disabled:text-secondary-600 disabled:cursor-not-allowed
		"
      onclick={checkGuess}
      >{guessesState.guessedCountries.includes(guessString.trim())
        ? 'Already guessed'
        : 'Guess'}</button
    >
  </div>
  <AttemptList {guessesState} />
</div>

<style>
  .overlay-animation {
    animation: overlayFade 1s ease-in-out;
  }
  
  @keyframes overlayFade {
    0% {
      opacity: 0;
    }
    5% {
      opacity: 0.5;
    }
    10% {
      opacity: 1;
    }
    85% {
      opacity: 1;
    }
    90% {
      opacity: 0.7;
    }
    95% {
      opacity: 0.5;
    }
    100% {
      opacity: 0;
    }
  }
</style>
