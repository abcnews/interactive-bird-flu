<script lang="ts">
  import Frame from "./components/Frame.svelte";
</script>

<main>
  <div class="container">
    <Frame />
  </div>
</main>

<style lang="scss">
  :global {
    html body {
      overflow-x: clip;
    }
  }
</style>
