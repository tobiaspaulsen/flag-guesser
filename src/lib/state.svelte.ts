import { Image } from 'image-js';

export type Country = {
  countryCode: string;
  name: string;
};

export interface IGuess {
  country: Country;
  score: number;
  img: Image;
  correct: boolean;
}

export function createCountriesState(): ICountriesState {
  let countriesState: Country[] = $state([]);
  let loaded = $state(false);

  $effect(() => {
    fetch('/countries/countries.json')
      .then((res) => res.json())
      .then((data) => {
        countriesState = data.map((country: { code: string; name: string }) => ({
          countryCode: country.code.toLowerCase(),
          name: country.name
        }));
        loaded = true;
      });
  });

  return {
    get countries() {
      return countriesState;
    },
    get loaded() {
      return loaded;
    }
  };
}

export interface IGuessesState {
  readonly guessesList: IGuess[];
  addNewGuess: (guess: IGuess) => void;
  resetGuesses: () => void;
  readonly guessedCountries: Country[];
}

export interface PersistedGameState {
  date: string;
  targetCountryCode: string;
  won: boolean;
  guesses: {
    countryCode: string;
    countryName: string;
  }[];
}

export interface ICountriesState {
  readonly countries: Country[];
  readonly loaded: boolean;
}

export interface ITargetCountryState {
  readonly targetCountry: Country;
  readonly targetFlagImgUrl: string;
  readonly isDailyGame: boolean;
  resetTarget: () => void;
}

function getTodaysFlagIndex(totalCountries: number): number {
  const today = new Date();
  const diffTime = today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays % totalCountries;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

export function loadLatestDailyGameState(): PersistedGameState | null {
  if (typeof window === 'undefined') return null;
  const today = getTodayString();
  const stored = localStorage.getItem('dailyGameState');
  if (!stored) return null;
  
  try {
    const parsed: PersistedGameState = JSON.parse(stored);
    return parsed.date === today ? parsed : null;
  } catch {
    return null;
  }
}

function saveGameState(state: PersistedGameState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dailyGameState', JSON.stringify(state));
}

export function createTargetCountryState(countriesState: ICountriesState): ITargetCountryState {
  const targetIndex = getTodaysFlagIndex(countriesState.countries.length);

  let targetCountry = $state(countriesState.countries[targetIndex]);
  let isDailyGameState = $state(true);

  return {
    get targetCountry() {
      return targetCountry;
    },
    get targetFlagImgUrl() {
      return targetCountry ? `/countries/png/${targetCountry.countryCode}.png` : '';
    },
    get isDailyGame() {
      return isDailyGameState;
    },
    resetTarget: () => {
      isDailyGameState = false;
      if (countriesState.countries.length > 0) {
        targetCountry = countriesState.countries[Math.floor(Math.random() * countriesState.countries.length)];
      }
    }
  };
}

export const persistGameState = (targetCountryState: ITargetCountryState, guesses: IGuess[]): void => {
  const gameState: PersistedGameState = {
    date: getTodayString(),
    targetCountryCode: targetCountryState.targetCountry.countryCode,
    won: guesses.some(g => g.correct),
    guesses: guesses.map(g => ({
      countryCode: g.country.countryCode,
      countryName: g.country.name
    }))
  };
  saveGameState(gameState);
}

export function createGuessesState(): IGuessesState {
  let guesses: IGuess[] = $state([]);

  return {
    get guessesList() {
      return guesses;
    },
    addNewGuess: (guess: IGuess) => {
      guesses = [...guesses, guess];
    },
    resetGuesses: () => {
      guesses = [];
    },
    get guessedCountries() {
      return guesses.map((guess) => guess.country);
    }
  };
}
