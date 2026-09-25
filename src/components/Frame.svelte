<script lang="ts">
  import { getMountValue, selectMounts } from "@abcnews/mount-utils";
  import * as v from "@valibot/valibot";

  import { onMount } from "svelte";
  import { IsInViewport, watch } from "runed";
  import Portal from "svelte-portal";

  import { AnnotationFromHash, BoundingBoxFromHash } from "../schemas.ts";

  import Overlay from "./Overlay.svelte";

  type Modification = {
    className: string;
    properties: Record<string, string>;
    viewport: IsInViewport;
  };

  const modifiedMounts = new Map<HTMLElement, Modification>();

  const sleep = async (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const init = () => {
    const frameEl = document.querySelector('[data-key="journey"]');
    frameEl?.classList.add("interactive-component-journey-frame");
    frameEl?.classList.add("u-full");

    // Add the overlay scrim before annotations and bounding boxes in the DOM
    const figureEl = frameEl?.querySelector('figure[data-component="Figure"]');
    // const overlay = overlayEl;
    // if (overlay) figureEl?.after(overlay);
    const overlayHost = document.createElement("div");
    overlayHost.id = "interactive-overlay-host";
    figureEl?.after(overlayHost);

    // Annotation text mounts
    // ----------------------

    const annotationMounts = selectMounts("annotation", {
      includeOwnUsed: true,
    });

    for (const mount of annotationMounts) {
      const validatedAnnotationConfig = v.safeParse(
        AnnotationFromHash,
        getMountValue(mount),
      );

      if (!validatedAnnotationConfig.success) {
        console.warn(validatedAnnotationConfig.issues);
        continue; // Go to next mount
      }

      const CLASS_TO_ADD = "interactive-annotation-mount";

      mount.classList.add(CLASS_TO_ADD);

      const {
        text,
        colour,
        top,
        left,
        outlineColour,
        anchor,
        width,
        name,
        inset,
      } = validatedAnnotationConfig.output;

      const span = document.createElement("span");

      span.className = "annotation-text";
      span.textContent = text;
      span.setAttribute("data-text", text);
      mount.replaceChildren(span);

      const annotationProperties = {
        "--annotation-top": `${top}%`,
        "--annotation-left": anchor === "left" ? `${left}%` : "auto",
        "--annotation-right": anchor === "right" ? `${100 - left}%` : "auto",
        "--annotation-colour": colour,
        "--annotation-outline-colour": outlineColour,
        "--annotation-width": `${width}em`,
      };

      mount.setAttribute("data-name", name);

      for (const [key, value] of Object.entries(annotationProperties)) {
        mount.style.setProperty(key, value);
      }

      const inViewport = new IsInViewport(() => mount, {
        rootMargin: `-${inset}% 0px`,
      });

      modifiedMounts.set(mount, {
        className: CLASS_TO_ADD,
        properties: annotationProperties,
        viewport: inViewport,
      });

      $effect(() => {
        mount.classList.toggle("is-hidden", !inViewport.current);
      });
    }

    // Bounding box mounts
    // -------------------

    const boundingBoxMounts = selectMounts("boundingBox", {
      includeOwnUsed: true,
    });

    for (const mount of boundingBoxMounts) {
      const validatedBoundingBoxConfig = v.safeParse(
        BoundingBoxFromHash,
        getMountValue(mount),
      );

      if (!validatedBoundingBoxConfig.success) {
        console.warn(validatedBoundingBoxConfig.issues);
        continue; // Go to next mount
      }

      const CLASS_TO_ADD = "interactive-boundingbox-mount";

      mount.classList.add(CLASS_TO_ADD);

      // The DLS global styles shift `div[id]:empty` and `a:not([href])[id]:empty`
      // up by 2.7rem below 543px, which overrides our absolute positioning.
      // A child element stops the `:empty` selector matching. Don't remove.
      mount.innerHTML = "<span></span>";

      const {
        topX,
        topY,
        bottomX,
        bottomY,
        colour,
        strokeWidth,
        borderRadius,
        fillColour,
        name,
        inset,
      } = validatedBoundingBoxConfig.output;

      const boundingBoxProperties = {
        "--boundingbox-left": `${Math.min(topX, bottomX)}%`,
        "--boundingbox-top": `${Math.min(topY, bottomY)}%`,
        "--boundingbox-width": `${Math.abs(bottomX - topX)}%`,
        "--boundingbox-height": `${Math.abs(bottomY - topY)}%`,
        "--boundingbox-colour": colour,
        "--boundingbox-stroke-width": `${strokeWidth}px`,
        "--boundingbox-border-radius": `${borderRadius}px`,
        "--boundingbox-fill-colour": fillColour,
      };

      for (const [key, value] of Object.entries(boundingBoxProperties)) {
        mount.style.setProperty(key, value);
      }

      const inViewport = new IsInViewport(() => mount, {
        rootMargin: `-${inset}% 0px`,
      });

      modifiedMounts.set(mount, {
        className: CLASS_TO_ADD,
        properties: boundingBoxProperties,
        viewport: inViewport,
      });

      mount.setAttribute("data-name", name);

      $effect(() => {
        mount.classList.toggle("is-hidden", !inViewport.current);
      });
    }

    // Cleanup function (put everything back how we found it)
    const cleanup = () => {
      overlayHost?.remove();

      frameEl?.classList.remove("interactive-component-journey-frame");
      frameEl?.classList.remove("u-full");

      for (const [mount, mod] of modifiedMounts) {
        mod.viewport.observer.stop(); // Disconnect observer
        mount.classList.remove(mod.className, "is-hidden");
        for (const key of Object.keys(mod.properties)) {
          mount.style.removeProperty(key);
        }
        mount.innerHTML = "";
      }

      // Empty internal mount tracker
      modifiedMounts.clear();
    };

    return cleanup;
  };

  onMount(() => {
    const cleanup = init();
    return cleanup;
  });
</script>

<Portal target={"#interactive-overlay-host"}>
  <Overlay />
</Portal>

<style lang="scss">
  @use "../styles/breakpoints.scss" as *;

  :global {
    .interactive-component-journey-frame {
      position: relative;

      figure[data-component="Figure"] {
        max-width: 100%;
        margin-inline: 0;
      }

      // Shared styles only. Separate styles further below.
      .interactive-annotation-mount,
      .interactive-boundingbox-mount {
        transition: opacity 750ms ease;

        &.is-hidden {
          opacity: 0;
        }
      }

      .interactive-annotation-mount {
        line-height: 1em;
        position: absolute;
        text-align: center;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: var(--annotation-colour);
        top: var(--annotation-top);
        left: var(--annotation-left, auto);
        right: var(--annotation-right, auto);
        -webkit-text-fill-color: var(--annotation-colour);
        -webkit-text-stroke: 2px transparent;
        max-width: var(--annotation-width);
        isolation: isolate;
        transform: translateY(-50%);

        font-size: 0.875rem; // 14px

        @include for-size(tablet-portrait-up) {
          font-size: 1.125rem; // 18px
        }

        @include for-size(tablet-landscape-up) {
          font-size: 1.375rem; // 22px
        }

        @include for-size(desktop-up) {
          font-size: 1.625rem; // 26px
        }

        @include for-size(big-desktop-up) {
          font-size: 1.75rem; // 28px
        }

        .annotation-text {
          position: relative;
          display: inline-block;
        }

        .annotation-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          -webkit-text-stroke: 2px var(--annotation-outline-colour);
          z-index: -1;
        }
      }

      .interactive-boundingbox-mount {
        position: absolute;
        top: var(--boundingbox-top);
        left: var(--boundingbox-left);
        width: var(--boundingbox-width);
        height: var(--boundingbox-height);
        border-width: var(--boundingbox-stroke-width);
        border-color: var(--boundingbox-colour);
        border-radius: var(--boundingbox-border-radius);
        background-color: var(--boundingbox-fill-colour);
        border-style: solid;
        box-sizing: border-box;
        pointer-events: none;
        margin: 0;
      }
    }
  }
</style>
