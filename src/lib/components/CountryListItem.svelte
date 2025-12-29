<script lang="ts">
  const {
    countryName,
    countryImgSrc,
    countryHtmlListItem,
    highlighted,
    onclick
  }: {
    countryImgSrc: string;
    countryName: string;
    countryHtmlListItem: string;
    highlighted: boolean;
    onclick: () => void;
  } = $props();

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onclick();
    }
  };
</script>

<li
  class="autocomplete-items bg-primary-50 p-2 flex gap-3 h-12 cursor-pointer hover:bg-primary-100 transition-colors"
  class:!bg-primary-200={highlighted}
  class:border-l-4={highlighted}
  class:border-primary-900={highlighted}
  class:font-semibold={highlighted}
  class:autocomplete-active={highlighted}
  role="option"
  tabindex="0"
  aria-selected={highlighted}
  {onclick}
  onkeydown={handleKeydown}
>
  <img src={countryImgSrc} alt="Flag of {countryName}" />
  <div>
    {@html countryHtmlListItem}
  </div>
</li>
