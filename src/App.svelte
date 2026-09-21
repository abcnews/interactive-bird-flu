<script lang="ts">
  import Frame from "./components/Frame.svelte";

  let scrollY = $state<number>();
</script>

<main>
  <div class="interactive-container">
    <Frame {scrollY} />
  </div>
</main>

<svelte:window bind:scrollY />

<style lang="scss">
  :global {
    #app-container {
      overflow-x: clip;
    }
  }
</style>
