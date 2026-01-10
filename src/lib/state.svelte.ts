import { Image } from 'image-js';
import { asset } from '$app/paths';
import { getDateString } from './utils';

const STORAGE_KEYS = {
  USER_SETTINGS: 'userSettings',
  GAME_STATS: 'gameStats',
  DAILY_GAME_STATE: 'dailyGameState',
} as const;

export const MAX_GUESSES = 5;

export type Country = {
  countryCode: string;
  name: string;
};

export interface IGuess {
  country: Country;
  score: number;
  img: Image;
  intersectionImg: Image;
  correct: boolean;
}

export interface UserSettings {
  easyMode: boolean;
}

export interface GameStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string;
  guessDistribution: { [key: number]: number }; // key: number of guesses, value: count
}

const DEFAULT_STATS: GameStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: '',
  guessDistribution: {},
};

const DEFAULT_SETTINGS: UserSettings = {
  easyMode: true,
};

function loadUserSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const stored = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
  if (!stored) return DEFAULT_SETTINGS;

  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveUserSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
}

export const createUserSettings = (): UserSettings => {
  let settings = $state(loadUserSettings());

  $effect(() => {
    saveUserSettings(settings);
  });

  return settings;
};

export function getGameStats(): GameStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  const stored = localStorage.getItem(STORAGE_KEYS.GAME_STATS);
  if (!stored) return DEFAULT_STATS;

  try {
    return { ...DEFAULT_STATS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_STATS;
  }
}

function saveGameStats(stats: GameStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(stats));
}

function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateString(yesterday);
}

function updateGameStats(won: boolean, guessCount: number): void {
  const stats = getGameStats();
  const today = getTodayString();
  const yesterday = getYesterdayString();

  // Only update if not already played today
  if (stats.lastPlayedDate === today) {
    return;
  }

  stats.played++;
  stats.lastPlayedDate = today;

  if (won) {
    stats.won++;
    stats.guessDistribution[guessCount] =
      (stats.guessDistribution[guessCount] || 0) + 1;

    if (stats.lastPlayedDate === yesterday || stats.currentStreak === 0) {
      stats.currentStreak++;
    } else {
      stats.currentStreak = 1;
    }
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }

  saveGameStats(stats);
}

export function createCountriesState(): ICountriesState {
  let countriesState: Country[] = $state([]);
  let loaded = $state(false);

  $effect(() => {
    fetch(asset('/countries/countries.json'))
      .then((res) => res.json())
      .then((data) => {
        countriesState = data.map(
          (country: { code: string; name: string }) => ({
            countryCode: country.code.toLowerCase(),
            name: country.name,
          }),
        );
        loaded = true;
      });
  });

  return {
    get countries() {
      return countriesState;
    },
    get loaded() {
      return loaded;
    },
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

  let seed = diffDays;
  seed = (seed * 9301 + 49297) % 233280;
  const random = seed / 233280;

  return Math.floor(random * totalCountries);
}

function getTodayString(): string {
  return getDateString(new Date());
}

export function loadLatestDailyGameState(): PersistedGameState | null {
  if (typeof window === 'undefined') return null;
  const today = getTodayString();
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_GAME_STATE);
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
  localStorage.setItem(STORAGE_KEYS.DAILY_GAME_STATE, JSON.stringify(state));
}

export function createTargetCountryState(
  countriesState: ICountriesState,
): ITargetCountryState {
  const targetIndex = getTodaysFlagIndex(countriesState.countries.length);

  let targetCountry = $state(countriesState.countries[targetIndex]);
  let isDailyGameState = $state(true);

  return {
    get targetCountry() {
      return targetCountry;
    },
    get targetFlagImgUrl() {
      return targetCountry
        ? asset(`/countries/png/${targetCountry.countryCode}.png`)
        : '';
    },
    get isDailyGame() {
      return isDailyGameState;
    },
    resetTarget: () => {
      isDailyGameState = false;
      if (countriesState.countries.length > 0) {
        targetCountry =
          countriesState.countries[
            Math.floor(Math.random() * countriesState.countries.length)
          ];
      }
    },
  };
}

export const persistGameState = (
  targetCountryState: ITargetCountryState,
  guesses: IGuess[],
): void => {
  const won = guesses.some((g) => g.correct);
  const gameState: PersistedGameState = {
    date: getTodayString(),
    targetCountryCode: targetCountryState.targetCountry.countryCode,
    won,
    guesses: guesses.map((g) => ({
      countryCode: g.country.countryCode,
      countryName: g.country.name,
    })),
  };
  saveGameState(gameState);

  if (won || guesses.length >= MAX_GUESSES) {
    updateGameStats(won, guesses.length);
  }
};

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
    },
  };
}
