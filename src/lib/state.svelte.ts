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
  imgUrl: string;
  intersectionImg: Image;
  intersectionImgUrl: string;
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
  const settings = $state(loadUserSettings());

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

const DAY_MS = 24 * 60 * 60 * 1000;

function getPreviousDateString(dateString: string): string {
  return getDateString(Date.parse(dateString) - DAY_MS);
}

function updateGameStats(
  gameDate: string,
  won: boolean,
  guessCount: number,
): void {
  const stats = getGameStats();

  if (stats.lastPlayedDate === gameDate) {
    return;
  }

  stats.played++;

  const previousPlayedDate = stats.lastPlayedDate;
  stats.lastPlayedDate = gameDate;

  if (won) {
    stats.won++;
    stats.guessDistribution[guessCount] =
      (stats.guessDistribution[guessCount] || 0) + 1;

    if (
      previousPlayedDate === getPreviousDateString(gameDate) ||
      stats.currentStreak === 0
    ) {
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
  readonly gameDate: string;
  resetTarget: () => void;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seeded shuffle per pass through the list: same flag for every player, each
// flag once per pass. Changes at UTC midnight.
function getDailyFlagIndex(timeMs: number, totalCountries: number): number {
  const day = Math.floor(timeMs / DAY_MS);
  const random = mulberry32(Math.floor(day / totalCountries));
  const order = Array.from({ length: totalCountries }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order[day % totalCountries];
}

function getTodayString(): string {
  return getDateString(Date.now());
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

// A resumed game keeps its original flag and date, even across midnight.
export function createTargetCountryState(
  countriesState: ICountriesState,
  resumedGame: PersistedGameState | null,
): ITargetCountryState {
  const now = Date.now();
  const resumedTarget = resumedGame
    ? countriesState.countries.find(
        (c) => c.countryCode === resumedGame.targetCountryCode,
      )
    : undefined;

  let targetCountry = $state(
    resumedTarget ??
      countriesState.countries[
        getDailyFlagIndex(now, countriesState.countries.length)
      ],
  );
  const gameDate =
    resumedTarget && resumedGame ? resumedGame.date : getDateString(now);
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
    get gameDate() {
      return gameDate;
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
    date: targetCountryState.gameDate,
    targetCountryCode: targetCountryState.targetCountry.countryCode,
    won,
    guesses: guesses.map((g) => ({
      countryCode: g.country.countryCode,
      countryName: g.country.name,
    })),
  };
  saveGameState(gameState);

  if (won || guesses.length >= MAX_GUESSES) {
    updateGameStats(targetCountryState.gameDate, won, guesses.length);
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
