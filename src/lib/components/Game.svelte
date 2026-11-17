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

  const OVERLAY_DURATION_MS = 600;

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

  let currentResult: Image | undefined = $state();
  let currentResultUrl: string | undefined = $state();
  let gameOverFlagUrl: string | undefined = $state();
  let isComputingGuess: boolean = $state(false);

  let imgUrl: string | undefined = $derived(
    gameOverFlagUrl ??
      (hoveredGuessIndex !== null && guessesState.guessesList[hoveredGuessIndex]
        ? guessesState.guessesList[hoveredGuessIndex].intersectionImgUrl
        : currentResultUrl),
  );

  untrack(() => {
    if (
      previousGameState &&
      previousGameState.targetCountryCode ===
        targetCountryState.targetCountry.countryCode
    ) {
      for (const pastGuess of previousGameState.guesses) {
        guessesState.addNewGuess(pastGuess);
      }

      currentResult = previousGameState.resultImage;
      currentResultUrl = previousGameState.resultImage?.toDataURL();

      if (previousGameState.won) {
        gameWon = true;
      }
      if (previousGameState.guesses.length >= MAX_GUESSES) {
        gameOver = true;
        gameOverFlagUrl = targetCountryState.targetFlagImgUrl;
      }
    }
  });

  let targetImageCache: { url: string; image: Promise<Image> } | undefined;

  const loadTargetImage = (): Promise<Image> => {
    const url = targetCountryState.targetFlagImgUrl;
    if (targetImageCache?.url !== url) {
      const image = Image.load(url);
      image.catch(() => {
        if (targetImageCache?.image === image) targetImageCache = undefined;
      });
      targetImageCache = { url, image };
    }
    return targetImageCache.image;
  };

  const checkGuess = async (guess: string) => {
    const guessedCountry = countriesState.countries.find(
      (country) => country.name === guess,
    );

    const guesses = guessesState.guessesList;
    // gameWon/gameOver lag behind the overlay animation.
    if (
      !guessedCountry ||
      isComputingGuess ||
      gameWon ||
      gameOver ||
      guesses.length >= MAX_GUESSES ||
      guesses.some(
        (g) =>
          g.correct || g.country.countryCode === guessedCountry.countryCode,
      )
    ) {
      return;
    }

    try {
      isComputingGuess = true;
      guessedFlagUrl = asset(
        `/countries/png/${guessedCountry.countryCode}.png`,
      );
      showOverlay = true;
      setTimeout(() => {
        showOverlay = false;
      }, OVERLAY_DURATION_MS);

      const targetImage = await loadTargetImage();
      const guessedImage = await Image.load(guessedFlagUrl);

      const intersect = getImageIntersect(targetImage, guessedImage);

      currentResult = getImageUnion(currentResult, intersect.result);
      currentResultUrl = currentResult.toDataURL();
      isComputingGuess = false;

      const isCorrectGuess =
        guessedCountry.name === targetCountryState.targetCountry?.name;

      guessesState.addNewGuess({
        country: guessedCountry,
        score: intersect.percentage,
        imgUrl: guessedFlagUrl,
        intersectionImgUrl: intersect.result.toDataURL(),
        correct: isCorrectGuess,
      });

      if (targetCountryState.isDailyGame) {
        persistGameState(targetCountryState, guessesState.guessesList);
        stats = getGameStats();
      }

      const reachedMaxGuesses = guessesState.guessesList.length >= MAX_GUESSES;

      if (isCorrectGuess || reachedMaxGuesses) {
        setTimeout(() => {
          if (isCorrectGuess) {
            gameWon = true;
          }
          if (reachedMaxGuesses) {
            gameOver = true;
            gameOverFlagUrl = targetCountryState.targetFlagImgUrl;
          }
        }, OVERLAY_DURATION_MS);
      }
    } catch (error) {
      isComputingGuess = false;
      console.error('Error loading or processing images:', error);
    }
  };

  const restartGame = () => {
    gameOver = false;
    gameWon = false;
    currentResult = undefined;
    currentResultUrl = undefined;
    gameOverFlagUrl = undefined;
    showOverlay = false;
    guessedFlagUrl = '';
    guessesState.resetGuesses();
    targetCountryState.resetTarget();
  };
</script>

<div class="flex flex-col items-center gap-5 w-full">
  <FlagHeader {targetCountryState} bind:easyMode={userSettings.easyMode} />

  <FlagDisplay
    {showOverlay}
    overlayFlagUrl={guessedFlagUrl}
    {imgUrl}
    animKey={guessesState.guessesList.length}
    {isComputingGuess}
  />

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
