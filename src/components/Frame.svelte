<script lang="ts">
  import Base62Str from "base62str";
  import {
    parse as parseCoreHash,
    type Coerced,
  } from "@abcnews/core-hash-converter";
  import { getMountValue, selectMounts } from "@abcnews/mount-utils";
  import tinycolor from "tinycolor2";

  const base62 = Base62Str.createInstance();

  type Annotation = {
    text: Coerced;
    colour: string;
    top: number; // %
    left: number; // %
  };

  type BoundingBox = {
    topX: number; // %
    topY: number; // %
    bottomX: number; // %
    bottomY: number; // %
    colour: string;
  };

  $effect(() => {
    const frameEl = document.querySelector('[data-key="journey"]');
    frameEl?.classList.add("interactive-component-journey-frame");
    frameEl?.classList.add("u-full");

    const mounts = selectMounts("annotation", { includeOwnUsed: true });

    for (const mount of mounts) {
      mount.classList.add("interactive-annotation-mount");

      const value = getMountValue(mount);
      const parsedValues = parseCoreHash(value) as Annotation;
      const annotationText =
        typeof parsedValues.text === "string" ? parsedValues.text : "";
      const decodedValues = {
        ...parsedValues,
        text: base62.decodeStr(annotationText),
      };

      mount.innerHTML = `<span class="annotation-text" data-text="${decodedValues.text}">${decodedValues.text}</span>`;

      mount.style.setProperty("--annotation-top", `${decodedValues.top}%`);
      mount.style.setProperty("--annotation-left", `${decodedValues.left}%`);

      const colour = tinycolor(decodedValues.colour);
      mount.style.setProperty("--annotation-colour", colour.toHexString());
    }

    const boundingBoxMounts = selectMounts("boundingBox", {
      includeOwnUsed: true,
    });

    for (const mount of boundingBoxMounts) {
      mount.classList.add("interactive-boundingbox-mount");

      const value = getMountValue(mount);
      const { topX, topY, bottomX, bottomY, colour } = parseCoreHash(
        value,
      ) as BoundingBox;

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

    return () => {
      frameEl?.classList.remove("interactive-component-journey-frame");
      frameEl?.classList.remove("u-full");

      for (const mount of mounts) {
        mount.classList.remove("interactive-annotation-mount");
        mount.style.removeProperty("--annotation-top");
        mount.style.removeProperty("--annotation-left");
        mount.innerHTML = "";
      }

      for (const mount of boundingBoxMounts) {
        mount.classList.remove("interactive-boundingbox-mount");
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
      }
    }
  }
</style>
