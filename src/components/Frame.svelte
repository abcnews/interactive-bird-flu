<script lang="ts">
  import { onMount } from "svelte";

  onMount(() => {
    const frameEl = document.querySelector('[data-key="journey"]');
    frameEl?.classList.add("u-full");
  });
</script>

<style lang="scss">
  :global {
    [data-key="journey"] {
      position: relative;

      figure[data-component="Figure"] {
        max-width: 100%;
        margin-inline: 0;
      }
    }
  }
</style>
