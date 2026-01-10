<script lang="ts">
  import { untrack } from 'svelte';
  import { asset } from '$app/paths';
  import { getImageIntersect, getImageUnion } from '$lib/getImageIntersect';
  import { Image } from 'image-js';
  import {
    persistGameState,
    createUserSettings,
    getGameStats,
    MAX_GUESSES,
    type ICountriesState,
    type IGuessesState,
    type ITargetCountryState,
  } from '$lib/state.svelte';
  import CountrySearch from './CountrySearch.svelte';
  import AttemptList from './AttemptList.svelte';
  import FlagHeader from './FlagHeader.svelte';
  import FlagResultPanel from './FlagResultPanel.svelte';
  import FlagDisplay from './FlagDisplay.svelte';
  import StatsPanel from './StatsPanel.svelte';
  import type { PreviousGame } from '$lib/utils';

  let gameOver: boolean = $state(false);
  let gameWon: boolean = $state(false);

  let userSettings = createUserSettings();
  let stats = $state(getGameStats());

  let showOverlay: boolean = $state(false);
  let guessedFlagUrl: string = $state('');
  let hoveredGuessIndex: number | null = $state(null);

  let {
    guessesState,
    countriesState,
    targetCountryState,
    previousGameState,
  }: {
    guessesState: IGuessesState;
    countriesState: ICountriesState;
    targetCountryState: ITargetCountryState;
    previousGameState: PreviousGame | null;
  } = $props();
  let guessCountryCode: string | undefined = $state();

  let currentResult: Image | undefined = $state();
  let imgUrl: string | undefined = $derived(
    hoveredGuessIndex !== null && guessesState.guessesList[hoveredGuessIndex]
      ? guessesState.guessesList[hoveredGuessIndex].intersectionImg.toDataURL()
      : currentResult?.toDataURL(),
  );

  untrack(() => {
    if (previousGameState) {
      for (const pastGuess of previousGameState.guesses) {
        guessesState.addNewGuess({
          country: pastGuess.country,
          score: pastGuess.score,
          img: pastGuess.img,
          intersectionImg: pastGuess.intersectionImg,
          correct: pastGuess.correct,
        });
      }

      currentResult = previousGameState.resultImage;

      if (previousGameState.won) {
        gameWon = true;
      }
      if (previousGameState.guesses.length >= MAX_GUESSES) {
        gameOver = true;
        imgUrl = targetCountryState.targetFlagImgUrl;
      }
    }
  });

  const checkGuess = async (guess: string) => {
    let guessedCountry = countriesState.countries.find(
      (country) => country.name.toLowerCase() === guess.trim().toLowerCase(),
    );

    if (!guessedCountry) {
      return;
    }

    try {
      guessedFlagUrl = asset(
        `/countries/png/${guessedCountry.countryCode}.png`,
      );
      showOverlay = true;
      setTimeout(() => {
        showOverlay = false;
      }, 800);

      let image1: Image = await Image.load(targetCountryState.targetFlagImgUrl);
      let image2: Image = await Image.load(guessedFlagUrl);

      let intersect = getImageIntersect(image1, image2, 0.5);

      currentResult = getImageUnion(currentResult, intersect.Image);

      if (guessedCountry.name === targetCountryState.targetCountry?.name) {
        gameWon = true;
      }

      guessesState.addNewGuess({
        country: guessedCountry,
        score: intersect.percent,
        img: image2,
        intersectionImg: intersect.Image,
        correct: gameWon,
      });

      if (targetCountryState.isDailyGame) {
        persistGameState(targetCountryState, guessesState.guessesList);
        stats = getGameStats();
      }

      if (guessesState.guessesList.length >= MAX_GUESSES) {
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

  <FlagDisplay {showOverlay} overlayFlagUrl={guessedFlagUrl} {imgUrl} />

  <FlagResultPanel {gameWon} {gameOver} {targetCountryState} {restartGame} />

  {#if (gameOver || gameWon) && targetCountryState.isDailyGame}
    <StatsPanel gameStats={stats} />
  {/if}

  {#if !(gameOver || gameWon)}
    <CountrySearch
      {countriesState}
      {checkGuess}
      easyMode={userSettings.easyMode}
      {guessesState}
    />
  {/if}

  <AttemptList {guessesState} bind:hoveredGuessIndex />
</div>
