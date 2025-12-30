import { Image } from 'image-js';

export type Country = {
  countryCode: string;
  name: string;
};

export interface IGuess {
  country: string;
  score: string;
  img: Image;
  correct: boolean;
}
export interface ITodaysFlag {
  readonly country: Country;
  readonly flagImgUrl: string;
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
  readonly guessedCountries: string[];
}

export interface ICountriesState {
  readonly countries: Country[];
  readonly loaded: boolean;
}

export interface ITargetCountryState {
  readonly targetCountry: Country | undefined;
  readonly targetFlagImgUrl: string;
  readonly isTodaysFlag: boolean;
  resetTarget: () => void;
  markTodayCompleted: () => void;
}

function getTodaysFlagIndex(totalCountries: number): number {
  const today = new Date();
  const diffTime = today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays % totalCountries;
}

function isTodayCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const completedDate = localStorage.getItem('lastFlagCompleted');
  return completedDate === today;
}

function markTodayCompleted(): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('lastFlagCompleted', today);
}

export function createTargetCountryState(countriesState: ICountriesState): ITargetCountryState {
  
  const todayCompleted = isTodayCompleted();
  let targetIndex: number;
  if (todayCompleted) {
    targetIndex = Math.floor(Math.random() * countriesState.countries.length);
  } else {
    targetIndex = getTodaysFlagIndex(countriesState.countries.length);
  }

  let targetCountry = $state(countriesState.countries[targetIndex]);
  let isTodaysFlag = $state(!todayCompleted);

  return {
    get targetCountry() {
      return targetCountry;
    },
    get targetFlagImgUrl() {
      return targetCountry ? `/countries/png/${targetCountry.countryCode}.png` : '';
    },
    get isTodaysFlag() {
      return isTodaysFlag;
    },
    resetTarget: () => {
      isTodaysFlag = false;
      if (countriesState.countries.length > 0) {
        targetCountry = countriesState.countries[Math.floor(Math.random() * countriesState.countries.length)];
      }
    },
    markTodayCompleted: () => {
      markTodayCompleted();
    }
  };
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
