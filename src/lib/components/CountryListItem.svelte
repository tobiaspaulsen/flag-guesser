<script lang="ts">
  const {
    countryName,
    withImage,
    countryImgSrc,
    countryHtmlListItem,
    highlighted,
    onclick
  }: {
    countryName: string;
    withImage: boolean;
    countryImgSrc: string;
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
  class="bg-primary-900 p-2 flex items-center gap-3 h-12 cursor-pointer hover:bg-primary-200 transition-colors"
  class:!bg-primary-100={highlighted}
  class:font-semibold={highlighted}
  role="option"
  tabindex="0"
  aria-selected={highlighted}
  {onclick}
  onkeydown={handleKeydown}
>
  {#if withImage}
    <img class="h-8 w-auto" src={countryImgSrc} alt="Flag of {countryName}" />
  {/if}
  <div class="leading-snug">
    {@html countryHtmlListItem}
  </div>
</li>
