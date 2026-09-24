<script lang="ts">
  import type { Component } from "svelte";
  import { fade } from "svelte/transition";

  import Seagull from "./outlines/Seagull.svelte";
  import Dolphins from "./outlines/Dolphins.svelte";
  import Quoll from "./outlines/Quoll.svelte";

  const FADE_DURATION = 1000;

  type Outline = {
    name: string;
    component: Component;
  };

  type Props = { width?: number; height?: number; activeOutlines?: string[] };

  let { width = 4000, height = 13578, activeOutlines = [] }: Props = $props();

  const outlines: Map<string, Outline> = new Map([
    ["seagull", { name: "seagull", component: Seagull }],
    ["dolphins", { name: "dolphins", component: Dolphins }],
    ["quoll", { name: "quoll", component: Quoll }],
  ]);

  const activeData = $derived.by(() =>
    activeOutlines.flatMap((outlineName) => outlines.get(outlineName) ?? []),
  );
</script>

<svg
  id="Layer_1"
  data-name="Layer 1"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {width} {height}"
  class:is-active={activeData.length > 0}
  style:--fade-duration={`${FADE_DURATION}ms`}
>
  <defs></defs>

  <!-- The darkening layer, with the shape cut out of it -->
  <!-- <rect width="100%" height="100%" class="scrim" mask="url(#spotlight-holes)" /> -->

  {#each activeData as outline (outline.name)}
    <g
      class="outline"
      fill="none"
      stroke="MediumSpringGreen"
      stroke-width="5"
      stroke-miterlimit="10"
      out:fade={{ duration: FADE_DURATION }}
    >
      <outline.component />
    </g>
  {/each}
</svg>

<style>
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--fade-duration) ease;
  }
  svg.is-active {
    opacity: 1;
  }
  /*.scrim {
    fill: rgb(0 0 0 / 0.6);
  }*/
</style>
