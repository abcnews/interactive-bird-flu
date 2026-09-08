<script lang="ts">
  $effect(() => {
    const frameEl = document.querySelector('[data-key="journey"]');
    frameEl?.classList.add("interactive-component-journey-frame");
    frameEl?.classList.add("u-full");

    return () => {
      frameEl?.classList.remove("interactive-component-journey-frame");
      frameEl?.classList.remove("u-full");
    };
  });
</script>

<style lang="scss">
  :global {
    .interactive-component-journey-frame {
      position: relative;

      figure[data-component="Figure"] {
        max-width: 100%;
        margin-inline: 0;
      }
    }
  }
</style>
