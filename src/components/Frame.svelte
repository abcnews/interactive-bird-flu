<script lang="ts">
  import Base62Str from "base62str";
  import { parse as parseCoreHash } from "@abcnews/core-hash-converter";
  import { getMountValue, selectMounts } from "@abcnews/mount-utils";
  import tinycolor from "tinycolor2";
  import * as v from "@valibot/valibot";
  import { onMount } from "svelte";

  const base62 = Base62Str.createInstance();

  const DEFAULTS = {
    annotation: { colour: "#DB7093", top: 50, left: 50 },
    boundingBox: { colour: "aqua", strokeWidth: 2, borderRadius: 6 },
  } as const;

  // Valibot schemas
  // ---------------

  /** 0–100, as authored in the hash. */
  const Percent = v.pipe(v.number(), v.minValue(0), v.maxValue(100));

  /** Any tinycolor-parseable colour, normalised to a hex string. */
  const Colour = v.pipe(
    v.string(),
    v.check((s) => tinycolor(s).isValid(), "Not a recognised colour"),
    v.transform((s) => tinycolor(s).toHexString()),
  );

  /** Base62 output can be all digits, so `coerce` may hand us a number. */
  const Base62Text = v.pipe(
    v.union([v.string(), v.pipe(v.number(), v.transform(String))]),
    v.transform((s) => base62.decodeStr(s)),
  );

  const AnnotationSchema = v.object({
    text: Base62Text,
    colour: v.optional(Colour, DEFAULTS.annotation.colour),
    top: v.optional(Percent, DEFAULTS.annotation.top),
    left: v.optional(Percent, DEFAULTS.annotation.left),
  });

  const AnnotationFromHash = v.pipe(
    v.string("Expected a mount value"),
    v.nonEmpty("Mount value is empty"),
    v.transform(parseCoreHash),
    AnnotationSchema,
  );

  const BoundingBoxSchema = v.object({
    topX: Percent,
    topY: Percent,
    bottomX: Percent,
    bottomY: Percent,
    colour: v.optional(Colour, DEFAULTS.boundingBox.colour),
    strokeWidth: v.optional(
      v.pipe(v.number(), v.minValue(0)),
      DEFAULTS.boundingBox.strokeWidth,
    ),
    borderRadius: v.optional(v.number(), DEFAULTS.boundingBox.borderRadius),
  });

  const BoundingBoxFromHash = v.pipe(
    v.string("Expected a mount value"),
    v.nonEmpty("Mount value is empty"),
    v.transform(parseCoreHash),
    BoundingBoxSchema,
  );

  const modifiedMounts = new Map<HTMLElement, Record<string, string>>();

  const init = () => {
    const frameEl = document.querySelector('[data-key="journey"]');
    frameEl?.classList.add("interactive-component-journey-frame");
    frameEl?.classList.add("u-full");

    // Annotation text mounts
    // ----------------------

    const annotationMounts = selectMounts("annotation", {
      includeOwnUsed: true,
    });

    for (const mount of annotationMounts) {
      const validatedResult = v.safeParse(
        AnnotationFromHash,
        getMountValue(mount),
      );

      if (!validatedResult.success) {
        console.warn(validatedResult.issues);
        continue; // Go to next mount
      }

      mount.classList.add("interactive-annotation-mount");

      const { text, colour, top, left } = validatedResult.output;

      const span = document.createElement("span");

      span.className = "annotation-text";
      span.textContent = text;
      span.setAttribute("data-text", text);
      mount.replaceChildren(span);

      const annotationProperties = {
        "--annotation-top": `${top}%`,
        "--annotation-left": `${left}%`,
        "--annotation-colour": colour,
      };

      for (const [key, value] of Object.entries(annotationProperties)) {
        mount.style.setProperty(key, value);
      }

      modifiedMounts.set(mount, annotationProperties);
    }

    // Bounding box mounts
    // -------------------

    const boundingBoxMounts = selectMounts("boundingBox", {
      includeOwnUsed: true,
    });

    for (const mount of boundingBoxMounts) {
      const validatedResult = v.safeParse(
        BoundingBoxFromHash,
        getMountValue(mount),
      );

      if (!validatedResult.success) {
        console.warn(validatedResult.issues);
        continue; // Go to next mount
      }

      mount.classList.add("interactive-boundingbox-mount");

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
      } = validatedResult.output;

      const boundingBoxProperties = {
        "--boundingbox-left": `${Math.min(topX, bottomX)}%`,
        "--boundingbox-top": `${Math.min(topY, bottomY)}%`,
        "--boundingbox-width": `${Math.abs(bottomX - topX)}%`,
        "--boundingbox-height": `${Math.abs(bottomY - topY)}%`,
        "--boundingbox-colour": colour,
        "--boundingbox-stroke-width": `${strokeWidth}px`,
        "--boundingbox-border-radius": `${borderRadius}px`,
      };

      for (const [key, value] of Object.entries(boundingBoxProperties)) {
        mount.style.setProperty(key, value);
      }

      modifiedMounts.set(mount, boundingBoxProperties);
    }

    // Cleanup function (put everything back how we found it)
    const cleanup = () => {
      frameEl?.classList.remove("interactive-component-journey-frame");
      frameEl?.classList.remove("u-full");

      for (const mount of annotationMounts) {
        mount.classList.remove("interactive-annotation-mount");
        mount.innerHTML = "";
      }

      for (const mount of boundingBoxMounts) {
        mount.classList.remove("interactive-boundingbox-mount");
        mount.innerHTML = "";
      }

      // Loop through and remove CSS vars from mounts
      for (const [mount, props] of modifiedMounts) {
        for (const key of Object.keys(props)) {
          mount.style.removeProperty(key);
        }
      }
    };

    return cleanup;
  };

  onMount(init);
</script>

<style lang="scss">
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
        transition: opacity 600ms ease;

        &.is-hidden {
          opacity: 0;
        }
      }

      .interactive-annotation-mount {
        font-size: 22px;
        line-height: 1em;
        position: absolute;
        text-align: center;
        font-weight: 700;
        letter-spacing: 1.4px;
        color: var(--annotation-colour);
        top: var(--annotation-top);
        left: var(--annotation-left);
        transform: translate(-50%, -50%);
        max-width: 8em;
        -webkit-text-fill-color: var(--annotation-colour);
        -webkit-text-stroke: 2px transparent;

        .annotation-text {
          position: relative;
          display: inline-block;
        }

        .annotation-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          -webkit-text-stroke: 2px hsl(0deg, 0%, 100%);
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
        border-style: solid;
        box-sizing: border-box;
        pointer-events: none;
        margin: 0;
      }
    }
  }
</style>
