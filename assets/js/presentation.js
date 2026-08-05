

const routeUrls = {
  presentation: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  catalog: "/catalog",
  aula: "/room/"
};

function navigatePortal(route) {
  const destination = routeUrls[route] || routeUrls.presentation;
  window.location.assign(destination);
}

function portalNotify(message) {
  const toast = document.getElementById("portalToast") || document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(portalNotify.timeout);
  portalNotify.timeout = window.setTimeout(() => toast.classList.remove("visible"), 2300);
}

function portalScrollTo(elementId) {
  const target = document.getElementById(elementId);
  if (!target) return;
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start"
  });
}

function readVisualPreferences() {
  try {
    return JSON.parse(localStorage.getItem("aula-demo-layout-reale") || "{}") || {};
  } catch {
    return {};
  }
}

function writeVisualPreferences(next) {
  try {
    localStorage.setItem("aula-demo-layout-reale", JSON.stringify(next));
  } catch {
    // La pagina resta utilizzabile anche quando la persistenza locale è bloccata.
  }
}

function applySharedVisualPreferences() {
  const preferences = readVisualPreferences();
  document.body.classList.toggle("dark", Boolean(preferences.dark));
  document.body.dataset.graphicsMode = ["full", "optimized", "reduced"].includes(preferences.graphicsMode)
    ? preferences.graphicsMode
    : "optimized";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const preferences = readVisualPreferences();
  preferences.dark = document.body.classList.contains("dark");
  writeVisualPreferences(preferences);
}

applySharedVisualPreferences();

document.body.dataset.routeReady = "true";


/* API usata dagli attributi interattivi della demo canonica. */
if (typeof navigatePortal === "function") window.navigatePortal = navigatePortal;
if (typeof portalNotify === "function") window.portalNotify = portalNotify;
if (typeof portalScrollTo === "function") window.portalScrollTo = portalScrollTo;
if (typeof toggleDarkMode === "function") window.toggleDarkMode = toggleDarkMode;
