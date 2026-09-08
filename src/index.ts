import { whenOdysseyLoaded } from "@abcnews/env-utils";
import { getMountValue, selectMounts } from "@abcnews/mount-utils";
import App from "./App.svelte";
import { mount } from "svelte";

await whenOdysseyLoaded;

mount(App, {
  target: document.body,
});

export default App;
