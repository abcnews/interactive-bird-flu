<script lang="ts">
  import Base62Str from "base62str";
  import {
    parse as parseCoreHash,
    type Coerced,
  } from "@abcnews/core-hash-converter";
  import { getMountValue, selectMounts } from "@abcnews/mount-utils";
  import tinycolor from "tinycolor2";
  import * as v from "@valibot/valibot";

  const base62 = Base62Str.createInstance();

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
    colour: v.optional(Colour, "#DB7093"),
    top: v.optional(Percent, 50),
    left: v.optional(Percent, 50),
  });

  const BoundingBoxSchema = v.object({
    topX: Percent,
    topY: Percent,
    bottomX: Percent,
    bottomY: Percent,
    colour: v.optional(Colour, "aqua"),
    strokeWidth: v.optional(v.pipe(v.number(), v.minValue(0)), 2),
  });

  type Annotation = v.InferOutput<typeof AnnotationSchema>;
  type BoundingBox = v.InferOutput<typeof BoundingBoxSchema>;

  $effect(() => {
    const frameEl = document.querySelector('[data-key="journey"]');
    frameEl?.classList.add("interactive-component-journey-frame");
    frameEl?.classList.add("u-full");

    // Annotation text mounts
    // ----------------------

    const annotationMounts = selectMounts("annotation", {
      includeOwnUsed: true,
    });

    for (const mount of annotationMounts) {
      mount.classList.add("interactive-annotation-mount");

      const mountValue = getMountValue(mount);

      const parsedResult = v.safeParse(
        AnnotationSchema,
        parseCoreHash(mountValue),
      );

      if (!parsedResult.success) {
        console.warn(parsedResult.issues);
        continue;
      }

      const { text, colour, top, left } = parsedResult.output;

      const span = document.createElement("span");
      span.className = "annotation-text";
      span.textContent = text;
      span.setAttribute("data-text", text);
      mount.replaceChildren(span);

      mount.style.setProperty("--annotation-top", `${top}%`);
      mount.style.setProperty("--annotation-left", `${left}%`);
      mount.style.setProperty("--annotation-colour", colour);
    }

    // Bounting box mounts
    // -------------------

    const boundingBoxMounts = selectMounts("boundingBox", {
      includeOwnUsed: true,
    });

    for (const mount of boundingBoxMounts) {
      mount.classList.add("interactive-boundingbox-mount");

      // Global styles target `div[id]:empty` and override our styles
      // so let's make not empty to fix.
      mount.innerHTML = "<span></span>";

      const mountValue = getMountValue(mount);

      const parsedResult = v.safeParse(
        BoundingBoxSchema,
        parseCoreHash(mountValue),
      );

      if (!parsedResult.success) {
        console.warn(parsedResult.issues);
        continue;
      }

      const { topX, topY, bottomX, bottomY, colour } = parsedResult.output;

      mount.style.setProperty(
        "--boundingbox-left",
        `${Math.min(topX, bottomX)}%`,
      );
      mount.style.setProperty(
        "--boundingbox-top",
        `${Math.min(topY, bottomY)}%`,
      );
      mount.style.setProperty(
        "--boundingbox-width",
        `${Math.abs(bottomX - topX)}%`,
      );
      mount.style.setProperty(
        "--boundingbox-height",
        `${Math.abs(bottomY - topY)}%`,
      );

      const boxColour = tinycolor(colour);
      mount.style.setProperty("--boundingbox-colour", boxColour.toHexString());
    }

    // Cleanup function (put everything back how we found it)
    return () => {
      frameEl?.classList.remove("interactive-component-journey-frame");
      frameEl?.classList.remove("u-full");

      for (const mount of annotationMounts) {
        mount.classList.remove("interactive-annotation-mount");
        mount.style.removeProperty("--annotation-top");
        mount.style.removeProperty("--annotation-left");
        mount.style.removeProperty("--annotation-colour");
        mount.innerHTML = "";
      }

      for (const mount of boundingBoxMounts) {
        mount.classList.remove("interactive-boundingbox-mount");

        mount.innerHTML = "";

        mount.style.removeProperty("--boundingbox-top");
        mount.style.removeProperty("--boundingbox-left");
        mount.style.removeProperty("--boundingbox-width");
        mount.style.removeProperty("--boundingbox-height");
        mount.style.removeProperty("--boundingbox-colour");
      }
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
          -webkit-text-stroke: 2px hsl(0deg, 0%, 98%);
          z-index: -1;
        }
      }

      .interactive-boundingbox-mount {
        position: absolute;
        top: var(--boundingbox-top);
        left: var(--boundingbox-left);
        width: var(--boundingbox-width);
        height: var(--boundingbox-height);
        border: 2px solid var(--boundingbox-colour);
        box-sizing: border-box;
        pointer-events: none;
        margin: 0;
        border-radius: 6px;
      }
    }
  }
</style>
