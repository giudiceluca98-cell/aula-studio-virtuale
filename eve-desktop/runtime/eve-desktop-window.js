(() => {
  "use strict";

  const currentWindow = window.__TAURI__?.window?.getCurrentWindow?.();
  if (!currentWindow) return;

  let changingFullscreen = false;

  async function setFullscreen(nextValue) {
    if (changingFullscreen) return;
    changingFullscreen = true;
    try {
      await currentWindow.setFullscreen(nextValue);
      document.documentElement.dataset.desktopFullscreen = String(nextValue);
    } catch (error) {
      console.warn("Impossibile cambiare la modalità schermo intero.", error);
    } finally {
      changingFullscreen = false;
    }
  }

  async function toggleFullscreen() {
    const isFullscreen = await currentWindow.isFullscreen();
    await setFullscreen(!isFullscreen);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "F11") {
      event.preventDefault();
      if (!event.repeat) void toggleFullscreen();
      return;
    }

    if (
      event.key === "Escape" &&
      document.documentElement.dataset.desktopFullscreen === "true"
    ) {
      event.preventDefault();
      void setFullscreen(false);
    }
  });

  currentWindow
    .isFullscreen()
    .then((value) => {
      document.documentElement.dataset.desktopFullscreen = String(value);
    })
    .catch(() => {});

  async function repairPackagedPortrait() {
    const portrait = document.querySelector("#eveHqPortrait");
    const runtime = window.EveAnimationLibrary;
    if (!portrait || !runtime?.getState || !runtime?.getAsset) return;
    if (!portrait.complete || portrait.naturalWidth > 0) return;

    const asset = await runtime.getAsset(runtime.getState());
    if (!asset?.file) return;
    portrait.src = new URL(
      `eve-animation-runtime-v1.2.6/${asset.file}`,
      document.baseURI
    ).href;
  }

  window.addEventListener("load", () => {
    void repairPackagedPortrait().catch((error) => {
      console.warn("Impossibile ripristinare il ritratto Eve.", error);
    });
  }, { once: true });

  window.EveDesktopWindow = {
    enterFullscreen: () => setFullscreen(true),
    exitFullscreen: () => setFullscreen(false),
    toggleFullscreen,
    repairPackagedPortrait
  };
})();
