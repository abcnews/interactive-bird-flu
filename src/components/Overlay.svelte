<script lang="ts">
  import type { Component } from "svelte";
  import { onMount } from "svelte";
  import { getMountValue, selectMounts } from "@abcnews/mount-utils";
  import { fade } from "svelte/transition";
  import { IsInViewport } from "runed";
  import * as v from "@valibot/valibot";

  import Seagull from "./outlines/Seagull.svelte";
  import Dolphins from "./outlines/Dolphins.svelte";
  import Quoll from "./outlines/Quoll.svelte";
  import Kangaroo from "./outlines/Kangaroo.svelte";

  import { OutlineTriggerFromHash } from "../schemas.ts";

  const FADE_DURATION = 1000;

  type Outline = {
    name: string;
    component: Component;
  };

  type Props = { width?: number; height?: number };

  let { width = 4000, height = 13578 }: Props = $props();

  const outlines = new Map<string, Component>([
    ["seagull", Seagull],
    ["dolphins", Dolphins],
    ["quoll", Quoll],
    ["kangaroo", Kangaroo],
  ]);

  type Trigger = {
    name: string;
    colour: string;
    strokeWidth: number;
    component: Component;
    viewport: IsInViewport;
  };

  let triggers = $state<Trigger[]>([]);

  const activeData = $derived(triggers.filter((t) => t.viewport.current));

  onMount(() => {
    const mounts = selectMounts("outline", { includeOwnUsed: true });

    triggers = mounts.flatMap((mount) => {
      const result = v.safeParse(OutlineTriggerFromHash, getMountValue(mount));

      if (!result.success) {
        console.warn("outline:", result.issues);
        return [];
      }

      const component = outlines.get(result.output.name);

      if (!component) {
        console.warn(`outline: no shape named "${result.output.name}"`);
        return [];
      }

      mount.classList.add("interactive-outline-trigger");
      mount.style.setProperty("--outline-trigger-top", `${result.output.top}%`);

      // The DLS global styles shift `div[id]:empty` and `a:not([href])[id]:empty`
      // up by 2.7rem below 543px, which overrides our absolute positioning.
      // A child element stops the `:empty` selector matching. Don't remove.
      mount.innerHTML = "<span></span>";

      const { name, colour, strokeWidth, inset } = result.output;

      const viewport = new IsInViewport(() => mount, {
        rootMargin: `-${inset}% 0px`,
      });

      return [{ name, colour, strokeWidth, component, viewport }];
    });

    return () => {
      for (const mount of mounts) {
        mount.classList.remove("interactive-outline-trigger");
        mount.style.removeProperty("--outline-trigger-top");
        mount.innerHTML = "";
      }
      triggers = [];
    };
  });
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">
  {#each activeData as trigger (trigger.name)}
    <g
      class="outline"
      fill="none"
      stroke={trigger.colour}
      stroke-width={trigger.strokeWidth}
      stroke-linejoin="round"
      stroke-linecap="round"
      transition:fade={{ duration: FADE_DURATION }}
    >
      <trigger.component />
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
  }

  :global(.interactive-outline-trigger) {
    position: absolute;
    top: var(--outline-trigger-top);
    left: 0;
    width: 100%;
    height: 0;
    pointer-events: none;
  }
</style>
