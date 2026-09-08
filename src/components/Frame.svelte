<script lang="ts">
  import Base62Str from "base62str";
  import {
    parse as parseCoreHash,
    type Coerced,
  } from "@abcnews/core-hash-converter";
  import { getMountValue, selectMounts } from "@abcnews/mount-utils";

  const base62 = Base62Str.createInstance();

  type Coerced = boolean | null | number | string;

  $effect(() => {
    const frameEl = document.querySelector('[data-key="journey"]');
    frameEl?.classList.add("interactive-component-journey-frame");
    frameEl?.classList.add("u-full");

    const mounts = selectMounts("annotation");

    console.log(mounts);

    for (const mount of mounts) {
      const value = getMountValue(mount);
      const parsedValues = parseCoreHash(value);
      const decodedValues = {
        ...parsedValues,
        text: base62.decodeStr(
          typeof parsedValues.text === "string" ? parsedValues.text : "",
        ),
      };

      console.log(decodedValues);
    }

    return () => {
      frameEl?.classList.remove("interactive-component-journey-frame");
      frameEl?.classList.remove("u-full");
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
    }
  }
</style>
