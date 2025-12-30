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
  let guessCountryCode: string | undefined = $state();

  let currentResult: Image | undefined = $state();
  let imgUrl: string | undefined = $derived(currentResult?.toDataURL());

  $effect(() => {
    if (targetCountryState.targetCountry) {
      console.log('targetCountry:', targetCountryState.targetCountry.name);
    }
  });

  const checkGuess = async (guess: string) => {
    if (guess.trim().toLowerCase() === targetCountryState.targetCountry?.name.trim().toLowerCase()) {
      gameWon = true;
      if (targetCountryState.isTodaysFlag) {
        targetCountryState.markTodayCompleted();
      }
    }
    guessCountryCode = countriesState.countries.find(
      (country) => country.name.toLowerCase() === guess.trim().toLowerCase()
    )?.countryCode;

    if (!guessCountryCode) {
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

      guessesState.addNewGuess({ country: guess, score: `${intersect.percent}`, img: image2, correct: gameWon});

      if (guessesState.guessesList.length >= 5) {
        gameOver = true;
        targetCountryState.markTodayCompleted();
        imgUrl = targetCountryState.targetFlagImgUrl;
      }
    } catch (error) {
      console.error('Error loading or processing images:', error);
    }
  };
  
  const restartGame = () => {
    gameOver = false;
    gameWon = false;
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

  <CountrySearch
    {countriesState}
    disabled={gameOver || gameWon}
    checkGuess={checkGuess}
    easyMode={true}
    guessesState={guessesState}
  />

  <AttemptList {guessesState} />
</div>