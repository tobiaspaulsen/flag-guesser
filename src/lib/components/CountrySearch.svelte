<script lang="ts">
  import Fuse from 'fuse.js';
  import type { ICountriesState, IGuessesState } from '$lib/state.svelte';
  import CountryListItem from './CountryListItem.svelte';

  let {
    countriesState,
    checkGuess,
    easyMode,
    guessesState,
    disabled = false,
  }: {
    countriesState: ICountriesState;
    checkGuess: (guess: string) => void;
    easyMode: boolean;
    guessesState: IGuessesState;
    disabled?: boolean;
  } = $props();

  let guessString: string = $state('');

  const db = $derived(
    new Fuse(countriesState.countries, {
      shouldSort: true,
      threshold: 0.2,
      distance: 100,
      minMatchCharLength: 1,
      keys: ['name']
    })
  );

  let filteredCountries: {
    countryName: string;
    countryImgSrc: string;
  }[] = $state([]);
  let highlightIndex: number = $state(0);
  let searchInput: HTMLInputElement = $state()!;
  let formElement: HTMLFormElement = $state()!;
  let listContainer: HTMLUListElement = $state()!;

  $effect(() => {
    if (listContainer) {
      const highlightedElement = listContainer.children[highlightIndex] as HTMLElement;
      highlightedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });

  const mapToFilteredCountry = (country: { name: string; countryCode: string }) => ({
    countryName: country.name,
    countryImgSrc: `/countries/png/${country.countryCode}.png`
  });

  const filterCountries = (): void => {
    if (disabled) {
      filteredCountries = [];
      highlightIndex = 0;
      return;
    }

    if (!guessString) {
      filteredCountries = countriesState.countries
        .filter((country) => !guessesState.guessedCountries.includes(country.name))
        .map(mapToFilteredCountry);
    } else {
      filteredCountries = db.search(guessString)
        .filter(({ item: country }) => !guessesState.guessedCountries.includes(country.name))
        .map(({ item: country }) => mapToFilteredCountry(country));
    }
  };

  const closeDropdown = () => {
    filteredCountries = [];
    highlightIndex = 0;
  };

  const selectCountry = (countryName: string) => {
    guessString = '';
    highlightIndex = 0;
    closeDropdown();
    checkGuess(countryName);
  };

  const navigateList = (e: KeyboardEvent) => {
    if (disabled) return;

    if (filteredCountries.length === 0 && !guessString && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      filterCountries();
      if (e.key === 'ArrowDown') {
        highlightIndex = 0;
      } else {
        highlightIndex = filteredCountries.length - 1;
      }
      return;
    }

    if (filteredCountries.length === 0) return;
    const len = filteredCountries.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        highlightIndex = (highlightIndex + 1) % len;
        break;
      case 'ArrowUp':
        e.preventDefault();
        highlightIndex = (highlightIndex - 1 + len) % len;
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (filteredCountries[highlightIndex]) {
          selectCountry(filteredCountries[highlightIndex].countryName);
        }
        break;
      case 'Escape':
        closeDropdown();
        break;
    }
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const isDuplicate = guessesState.guessedCountries.some(
      (g) => g.toLowerCase() === guessString.trim().toLowerCase()
    );
    if (disabled || !guessString.trim() || filteredCountries.length > 0 || isDuplicate) return;
    checkGuess(guessString);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (!disabled && formElement && !formElement.contains(e.target as Node)) {
      closeDropdown();
    }
  };
</script>

<svelte:window onclick={handleClickOutside} />

<div class="flex gap-2 w-full justify-center items-center">
<form
  bind:this={formElement}
  autocomplete="off"
  onsubmit={handleSubmit}
  class="w-full relative"
>
  <div>
    <input
      class="w-full rounded p-2 placeholder:text-primary-100 bg-primary-900 text-primary-50 border-2 border-primary-100/70 focus:border-secondary-900/70 focus:outline-none transition-colors"
      id="country-input"
      type="text"
      placeholder="Search for a country..."
      disabled={disabled}
      bind:this={searchInput}
      bind:value={guessString}
      oninput={filterCountries}
      onfocus={filterCountries}
      onclick={filterCountries}
      onkeydown={navigateList}
    />
  </div>
  {#if filteredCountries.length > 0}
    <div class="absolute w-full top-11 rounded overflow-hidden shadow-2xl border border-t-0 border-primary-200">
      <ul
        bind:this={listContainer}
        class="divide-y w-full divide-primary-200 m-0 max-h-[13.5rem] overflow-y-auto bg-primary-900 scrollbar-thin"
      >
        {#each filteredCountries as countryObj, i}
          <CountryListItem
            countryName={countryObj.countryName}
            withImage={easyMode}
            countryImgSrc={countryObj.countryImgSrc}
            highlighted={i === highlightIndex}
            onclick={() => selectCountry(countryObj.countryName)}
          />
        {/each}
      </ul>
    </div>
  {/if}
</form>
  <button
    disabled={disabled ||
      guessString.trim().length === 0 ||
      guessesState.guessedCountries.some((g) => g.toLowerCase() === guessString.trim().toLowerCase())}
    class="bg-secondary-900 h-11 p-2 px-4 rounded self-start text-white font-semibold hover:scale-[1.02] active:scale-95 transition-all disabled:bg-secondary-900/30 disabled:text-secondary-100/50 disabled:cursor-not-allowed"
    onclick={() => checkGuess(guessString)}
  >
    Guess
  </button>
</div>