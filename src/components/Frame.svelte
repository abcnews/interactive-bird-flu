<script lang="ts">
  import Base62Str from "base62str";
  import {
    parse as parseCoreHash,
    type Coerced,
  } from "@abcnews/core-hash-converter";
  import { getMountValue, selectMounts } from "@abcnews/mount-utils";

  const base62 = Base62Str.createInstance();

  type Coerced = boolean | null | number | string;
  type Annotation = {
    text: Coerced;
    top: number;
    left: number;
  };

  $effect(() => {
    const frameEl = document.querySelector('[data-key="journey"]');
    frameEl?.classList.add("interactive-component-journey-frame");
    frameEl?.classList.add("u-full");

    const mounts = selectMounts("annotation");

    for (const mount of mounts) {
      mount.classList.add("interactive-annotation-mount");

      const value = getMountValue(mount);
      const parsedValues = parseCoreHash(value) as Annotation;
      const annotationText = parsedValues.text;
      const decodedValues = {
        ...parsedValues,
        text: base62.decodeStr(
          typeof parsedValues.text === "string" ? parsedValues.text : "",
        ),
      };

      mount.innerText = decodedValues.text;

      mount.style.setProperty("--annotation-top", `${decodedValues.top}%`);
      mount.style.setProperty("--annotation-left", `${decodedValues.left}%`);
    }

    return () => {
      frameEl?.classList.remove("interactive-component-journey-frame");
      frameEl?.classList.remove("u-full");

      for (const mount of mounts) {
        mount.classList.remove("interactive-annotation-mount");
        mount.style.removeProperty("--annotation-top");
        mount.style.removeProperty("--annotation-left");
        mount.innerText = "";
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
        position: absolute;
        top: var(--annotation-top);
        left: var(--annotation-left);
        transform: translate(-50%, -50%);
      }
    }
  }
</style>
