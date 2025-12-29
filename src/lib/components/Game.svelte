<script lang="ts">
  import { getImageIntersect, getImageUnion } from '$lib/getImageIntersect';
  import { Image } from 'image-js';
  import { type ICountriesState, type IGuessesState, type ITargetCountryState } from '$lib/state.svelte';
  import CountrySearch from './CountrySearch.svelte';
  import AttemptList from './AttemptList.svelte';
  import FlagHeader from './FlagHeader.svelte';
  import FlagResultPanel from './FlagResultPanel.svelte';
  import FlagDisplay from './FlagDisplay.svelte';

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
      overlayFlagUrl = `/countries/png/${guessCountryCode}.png`;
      showOverlay = true;
      setTimeout(() => {
        showOverlay = false;
      }, 800);
      
      let image1: Image = await Image.load(targetCountryState.targetFlagImgUrl);
      let image2: Image = await Image.load(overlayFlagUrl);
      
      let intersect = getImageIntersect(image1, image2, 0.5);
      
      currentResult = getImageUnion(currentResult, intersect.Image);

      guessesState.addNewGuess({ country: guessString, score: `${intersect.percent}`, img: image2 });

      if (guessesState.guessesList.length >= 5) {
        gameOver = true;
        targetCountryState.markTodayCompleted();
        imgUrl = targetCountryState.targetFlagImgUrl;
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
  <FlagHeader {targetCountryState} />

  <FlagResultPanel {gameWon} {gameOver} {targetCountryState} {restartGame} />

  <FlagDisplay {showOverlay} {overlayFlagUrl} {imgUrl} />

  <div class="flex gap-2 w-full justify-center items-center">
    <CountrySearch
      {countriesState}
      disabled={gameOver || gameWon}
      bind:guessString
      onsubmit={checkGuess}
      easyMode={true}
      guessedCountries={guessesState.guessedCountries}
    />
    <button
      disabled={gameOver ||
        gameWon ||
        guessString.trim().length === 0 ||
        guessesState.guessedCountries.includes(guessString.trim())}
      class="bg-secondary-200 min-h-11 p-2 rounded self-start text-secondary-900 disabled:bg-secondary-200/[0.5] disabled:text-secondary-500 disabled:cursor-not-allowed
		"
      onclick={checkGuess}
      >{guessesState.guessedCountries.includes(guessString.trim())
        ? 'Already guessed'
        : 'Guess'}</button
    >
  </div>
  <AttemptList {guessesState} />
</div>
