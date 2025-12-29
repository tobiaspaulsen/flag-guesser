<script lang="ts">
  let {
    guessCountryCode,
    showOverlay,
    overlayFlagUrl,
    imgUrl
  }: {
    guessCountryCode: string | undefined;
    showOverlay: boolean;
    overlayFlagUrl: string;
    imgUrl: string | undefined;
  } = $props();
</script>

<div
  class="flex flex-row justify-center items-center border-2 border-solid border-primary-200 rounded-lg bg-primary-50/20 relative overflow-hidden"
  style="width: 400px; height: 300px;"
>
  {#if guessCountryCode !== undefined}
    {#if showOverlay}
      <img
        src={overlayFlagUrl}
        alt=""
        class="absolute inset-0 object-contain overlay-animation z-10"
      />
    {/if}
    <img src={imgUrl} alt="" class="absolute inset-0 object-contain" />
  {:else}
    <div class="text-primary-200 text-center p-4"></div>
  {/if}
</div>
<style>
  .overlay-animation {
    animation: overlayFade 1s ease-in-out;
  }
  
  @keyframes overlayFade {
    0% {
      opacity: 0;
    }
    5% {
      opacity: 0.5;
    }
    10% {
      opacity: 1;
    }
    85% {
      opacity: 1;
    }
    90% {
      opacity: 0.7;
    }
    95% {
      opacity: 0.5;
    }
    100% {
      opacity: 0;
    }
  }
</style>
