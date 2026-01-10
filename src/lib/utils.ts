import { Image } from 'image-js';
import { asset } from '$app/paths';
import type { Country, IGuess, PersistedGameState } from './state.svelte';
import { getImageIntersect, getImageUnion } from './getImageIntersect';

export type PreviousGame = {
  won: boolean;
  targetCountryCode: string;
  guesses: IGuess[];
  resultImage: Image | undefined;
};

export const getPreviousGameState = async (
  persistedGame: PersistedGameState
): Promise<PreviousGame> => {
  const guesses: IGuess[] = [];
  const targetImage: Image = await Image.load(
    asset(`/countries/png/${persistedGame.targetCountryCode}.png`)
  );
  let currentImageResult: Image | undefined = undefined;

  for (const guess of persistedGame.guesses) {
    const country: Country = {
      countryCode: guess.countryCode,
      name: guess.countryName
    };

    const image = await Image.load(asset(`/countries/png/${guess.countryCode}.png`));
    const intersect = getImageIntersect(targetImage, image, 0.5);
    currentImageResult = getImageUnion(currentImageResult, intersect.Image);

    guesses.push({
      country,
      score: intersect.percent,
      img: image,
      intersectionImg: intersect.Image,
      correct: guess.countryCode === persistedGame.targetCountryCode
    });
  }

  return {
    won: persistedGame.won,
    targetCountryCode: persistedGame.targetCountryCode,
    guesses: guesses,
    resultImage: currentImageResult
  };
};

export const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}