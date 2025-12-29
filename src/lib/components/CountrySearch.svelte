<script lang="ts">
  import Fuse from 'fuse.js';
  import type { ICountriesState } from '$lib/state.svelte';
  import CountryListItem from './CountryListItem.svelte';

  let {
    countriesState,
    guessString = $bindable(),
    onsubmit,
    easyMode,
    guessedCountries = [],
    disabled = false,
  }: {
    countriesState: ICountriesState;
    guessString: string;
    onsubmit?: () => void;
    easyMode: boolean;
    guessedCountries?: string[];
    disabled?: boolean;
  } = $props();

  const db = $derived(
    new Fuse(
      countriesState.countries.map((d) => {
        return { ...d, search: d.name };
      }),
      {
        shouldSort: true,
        threshold: 0.4,
        distance: 100,
        minMatchCharLength: 1,
        keys: ['search']
      }
    )
  );
  /* FILTERING countries DATA BASED ON INPUT */
  let filteredCountries: {
    countryName: string;
    countryImgSrc: string;
    countryHtmlListItem: string;
  }[] = $state([]);
  let highlightIndex: number | null = $state(null);
  let searchInput: HTMLInputElement = $state()!;
  let formElement: HTMLFormElement = $state()!;
  let listContainer: HTMLUListElement = $state()!;

  // Auto-scroll to highlighted item
  $effect(() => {
    if (highlightIndex !== null && listContainer) {
      const highlightedElement = listContainer.children[highlightIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  });

  const filterCountries = (): void => {
    if (disabled) {
      filteredCountries = [];
      highlightIndex = null;
      return;
    }
    if (!guessString) {
      filteredCountries = countriesState.countries
        .filter((country) => !guessedCountries.includes(country.name))
        .map((country) => {
          const countryName = country.name;
          let countryImgSrc = `/countries/png/${country.countryCode}.png`;
          return {
            countryName: countryName,
            countryImgSrc,
            countryHtmlListItem: makeMatchBold(countryName)
          };
        });
      filteredCountries.sort((a, b) => (a.countryName > b.countryName ? 1 : -1));
    } else {
      filteredCountries = db
        .search(guessString)
        .filter(({ item: country }) => !guessedCountries.includes(country.name))
        .map(({ item: country }) => {
          const countryName = country.name;
          let countryImgSrc = `/countries/png/${country.countryCode}.png`;
          return {
            countryName: countryName,
            countryImgSrc,
            countryHtmlListItem: makeMatchBold(countryName)
          };
        });
    }
    
    // Auto-select first item when filtering
    if (filteredCountries.length > 0) {
      highlightIndex = 0;
    } else {
      highlightIndex = null;
    }
  };

  $effect(() => {
    if (!guessString) {
      filteredCountries = [];
      highlightIndex = null;
    }
  });

  const clearInput = () => {
    if (disabled) return;
    guessString = '';
    searchInput.focus();
  };

  const setInputVal = (countryName: string) => {
    if (disabled) return;
    guessString = removeBold(countryName);
    filteredCountries = [];
    highlightIndex = null;
    searchInput.focus();
  };

  const submitValue = () => {
    if (guessString) {
      setTimeout(clearInput, 1000);
    } else {
      alert("You didn't type anything.");
    }
  };

  const makeMatchBold = (str: string) => {
    // replace part of (country name === guessString) with strong tags
    let matched = str.substring(0, guessString.length);
    let makeBold = `<strong>${matched}</strong>`;
    let boldedMatch = str.replace(matched, makeBold);
    return boldedMatch;
  };

  const removeBold = (str: string) => {
    // replace < and > all characters between
    return str.replace(/<(.)*?>/g, '');
  };

  /* NAVIGATING OVER THE LIST OF COUNTRIES W HIGHLIGHTING */

  const navigateList = (e: KeyboardEvent) => {
    if (disabled) return;
    // If dropdown is closed and user presses down, reopen it
    if (filteredCountries.length === 0 && e.key === 'ArrowDown') {
      e.preventDefault();
      filterCountries();
      return;
    }

    // Only handle other navigation when dropdown is visible
    if (filteredCountries.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (highlightIndex === null || highlightIndex >= filteredCountries.length - 1) {
        highlightIndex = 0;
      } else {
        highlightIndex += 1;
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (highlightIndex === null || highlightIndex <= 0) {
        highlightIndex = filteredCountries.length - 1;
      } else {
        highlightIndex -= 1;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (highlightIndex !== null && filteredCountries[highlightIndex]) {
        setInputVal(filteredCountries[highlightIndex].countryHtmlListItem);
      }
    } else if (e.key === 'Escape') {
      filteredCountries = [];
      highlightIndex = null;
    }
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (disabled) return;
    // Only submit if there's a guess and dropdown is not visible or no item is highlighted
    if (guessString.trim().length > 0 && (filteredCountries.length === 0 || highlightIndex === null)) {
      if (onsubmit) {
        onsubmit();
      } else {
        submitValue();
      }
    }
  };

  /* CLICK OUTSIDE TO CLOSE */
  const handleClickOutside = (e: MouseEvent) => {
    if (disabled) return;
    if (formElement && !formElement.contains(e.target as Node)) {
      filteredCountries = [];
      highlightIndex = null;
    }
  };
</script>

<svelte:window onclick={handleClickOutside} />

<form
  bind:this={formElement}
  autocomplete="off"
  onsubmit={handleSubmit}
  class="w-full relative"
>
  <div class="autocomplete">
    <input
      class="h-11 p-2 rounded w-full placeholder:text-primary-100 bg-primary-900 text-primary-50 border-2 border-primary-100/70 focus:border-secondary-900/70 focus:outline-none transition-colors"
      id="country-input"
      type="text"
      placeholder="Search for a country..."
      disabled={disabled}
      bind:this={searchInput}
      bind:value={guessString}
      oninput={filterCountries}
      onfocus={filterCountries}
      onkeydown={navigateList}
    />
  </div>
  {#if filteredCountries.length > 0}
    <div class="absolute w-full top-11 rounded-b-lg overflow-hidden shadow-2xl border border-t-0 border-primary-200">
      <ul
        bind:this={listContainer}
        id="autocomplete-items-list"
        class="divide-y w-full divide-primary-200 m-0 max-h-[13.5rem] overflow-y-auto bg-primary-900 scrollbar-thin"
        style="scrollbar-width: thin; scrollbar-color: #6B7280 #374151;"
      >
        {#each filteredCountries as countryObj, i}
          <CountryListItem
            countryName={countryObj.countryName}
            withImage={easyMode}
            countryImgSrc={countryObj.countryImgSrc}
            countryHtmlListItem={countryObj.countryHtmlListItem}
            highlighted={i === highlightIndex}
            onclick={() => setInputVal(countryObj.countryHtmlListItem)}
          />
        {/each}
      </ul>
      <div class="h-4 bg-gradient-to-t from-primary-900 to-transparent pointer-events-none absolute bottom-0 left-0 right-0"></div>
    </div>
  {/if}
</form>
