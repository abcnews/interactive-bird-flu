function load() {
  const url = "https://abc-mqpt7p6220.aus.aunty.abc.net.au:8000/src/index.ts";
  import(url)
    .then(() => console.log("Dev module loaded..."))
    .catch((error) => console.error("Dev module not loaded...", error));
}
load();
