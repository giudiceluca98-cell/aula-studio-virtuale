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

  window.EveDesktopWindow = {
    enterFullscreen: () => setFullscreen(true),
    exitFullscreen: () => setFullscreen(false),
    toggleFullscreen
  };
})();

