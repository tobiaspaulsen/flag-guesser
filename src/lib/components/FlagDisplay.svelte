<script lang="ts">
  let {
    showOverlay,
    overlayFlagUrl,
    imgUrl,
  }: {
    showOverlay: boolean;
    overlayFlagUrl: string;
    imgUrl: string | undefined;
  } = $props();
</script>

<div
  class="flex flex-row justify-center items-center border-2 border-solid border-primary-100 rounded-lg bg-primary-900/20 relative overflow-hidden w-full max-w-[400px] aspect-[4/3]"
>
  {#if imgUrl !== undefined}
    {#if showOverlay}
      <img
        src={overlayFlagUrl}
        alt=""
        class="absolute inset-0 object-contain overlay-animation z-10"
      />
    {/if}
    <img
      src={imgUrl}
      alt=""
      class="absolute inset-0 object-contain image-animation"
    />
  {:else}
    <div class="text-primary-100 text-center p-4"></div>
  {/if}
</div>

<style>
  .image-animation {
    animation: imageFade 1s ease-in-out;
  }

  .overlay-animation {
    animation: overlayFade 1s ease-in-out;
  }

  @keyframes imageFade {
    0% {
      opacity: 0;
    }
    10% {
      opacity: 0.5;
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 1;
    }
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
