<script lang="ts">
  import Frame from "./components/Frame.svelte";
</script>

<main>
  <div class="interactive-container">
    <Frame />
  </div>
</main>

<style lang="scss">
  :global {
    #app-container {
      overflow-x: clip;
    }
  }

  :global(.interactive-component-journey-frame a:not([href])[id]:empty),
  :global(.interactive-component-journey-frame div[id]:empty) {
    position: static;
    top: auto;
  }
</style>
