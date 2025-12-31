<script lang="ts">
  import { untrack } from 'svelte';
  import { asset } from '$app/paths';
  import { getImageIntersect, getImageUnion } from '$lib/getImageIntersect';
  import { Image } from 'image-js';
  import {
    persistGameState,
    createUserSettings,
    type ICountriesState,
    type IGuessesState,
    type ITargetCountryState
  } from '$lib/state.svelte';
  import CountrySearch from './CountrySearch.svelte';
  import AttemptList from './AttemptList.svelte';
  import FlagHeader from './FlagHeader.svelte';
  import FlagResultPanel from './FlagResultPanel.svelte';
  import FlagDisplay from './FlagDisplay.svelte';
  import type { PreviousGame } from '$lib/utils';

  let gameOver: boolean = $state(false);
  let gameWon: boolean = $state(false);

  let userSettings = createUserSettings();

  let showOverlay: boolean = $state(false);
  let guessedFlagUrl: string = $state('');

  let {
    guessesState,
    countriesState,
    targetCountryState,
    previousGameState
  }: {
    guessesState: IGuessesState;
    countriesState: ICountriesState;
    targetCountryState: ITargetCountryState;
    previousGameState: PreviousGame | null;
  } = $props();
  let guessCountryCode: string | undefined = $state();

  let currentResult: Image | undefined = $state();
  let imgUrl: string | undefined = $derived(currentResult?.toDataURL());

  untrack(() => {
    if (previousGameState) {
      for (const pastGuess of previousGameState.guesses) {
        guessesState.addNewGuess({
          country: pastGuess.country,
          score: pastGuess.score,
          img: pastGuess.img,
          correct: pastGuess.correct
        });
      }

      currentResult = previousGameState.resultImage;

      if (previousGameState.won) {
        gameWon = true;
      }
      if (previousGameState.guesses.length >= 5) {
        gameOver = true;
        imgUrl = targetCountryState.targetFlagImgUrl;
      }
    }
  });

  const checkGuess = async (guess: string) => {
    if (
      guess.trim().toLowerCase() === targetCountryState.targetCountry?.name.trim().toLowerCase()
    ) {
      gameWon = true;
    }
    let guessedCountry = countriesState.countries.find(
      (country) => country.name.toLowerCase() === guess.trim().toLowerCase()
    );

    if (!guessedCountry) {
      return;
    }

    try {
      guessedFlagUrl = asset(`/countries/png/${guessedCountry.countryCode}.png`);
      showOverlay = true;
      setTimeout(() => {
        showOverlay = false;
      }, 800);

      let image1: Image = await Image.load(targetCountryState.targetFlagImgUrl);
      let image2: Image = await Image.load(guessedFlagUrl);

      let intersect = getImageIntersect(image1, image2, 0.5);

      currentResult = getImageUnion(currentResult, intersect.Image);

      guessesState.addNewGuess({
        country: guessedCountry,
        score: intersect.percent,
        img: image2,
        correct: gameWon
      });

      if (targetCountryState.isDailyGame) {
        persistGameState(targetCountryState, guessesState.guessesList);
      }

      if (guessesState.guessesList.length >= 5) {
        gameOver = true;
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
    guessedFlagUrl = '';
    guessesState.resetGuesses();
    targetCountryState.resetTarget();
  };
</script>

<div class="flex flex-col items-center gap-5 w-full">
  <FlagHeader {targetCountryState} bind:easyMode={userSettings.easyMode} />

  <FlagResultPanel {gameWon} {gameOver} {targetCountryState} {restartGame} />

  <FlagDisplay {showOverlay} overlayFlagUrl={guessedFlagUrl} {imgUrl} />

  <CountrySearch
    {countriesState}
    disabled={gameOver || gameWon}
    {checkGuess}
    easyMode={userSettings.easyMode}
    {guessesState}
  />

  <AttemptList {guessesState} />
</div>
