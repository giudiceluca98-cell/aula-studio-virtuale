const OFFICIAL_ORIGIN = "https://aula-studio-virtuale.vercel.app";
const DESKTOP_PROTOCOLS = new Set(["tauri:", "asset:"]);
let contextPromise;

export function isDesktopApp() {
  return Boolean(globalThis.__TAURI_INTERNALS__) ||
    DESKTOP_PROTOCOLS.has(location.protocol) ||
    location.hostname === "tauri.localhost";
}

export function isLocalPreview() {
  return location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(location.hostname);
}

export function appRoute(route) {
  const clean = route.startsWith("/") ? route : `/${route}`;
  if (!isDesktopApp()) return clean;
  if (clean === "/") return "/index.html";
  if (/\.[a-z0-9]+(?:[?#]|$)/i.test(clean)) return clean;
  const [pathname, suffix = ""] = clean.split(/(?=[?#])/);
  return `${pathname.replace(/\/$/, "")}/index.html${suffix}`;
}

export function apiUrl(path) {
  return isDesktopApp() || isLocalPreview() ? `${OFFICIAL_ORIGIN}${path}` : path;
}

function safeNext(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export function redirectToLogin(next = `${location.pathname}${location.search}${location.hash}`) {
  const destination = new URL(appRoute("/login"), location.origin);
  destination.searchParams.set("next", safeNext(next));
  location.replace(destination.href);
}

export function destinationAfterAuth() {
  const next = safeNext(new URLSearchParams(location.search).get("next"));
  return appRoute(next);
}

async function createContext() {
  if (!globalThis.supabase?.createClient) {
    throw new Error("Il client degli account non è disponibile.");
  }
  const response = await fetch(apiUrl("/api/auth/config"), {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  const config = await response.json().catch(() => ({}));
  if (!response.ok || !config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error(config.error || "Il servizio degli account non è configurato.");
  }
  const client = globalThis.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return { client, session: data.session, user: data.session?.user || null };
}

export function getAuthContext() {
  contextPromise ||= createContext();
  return contextPromise;
}

export function displayName(user) {
  const metadataName = String(user?.user_metadata?.display_name || "").trim();
  if (metadataName) return metadataName;
  const emailName = String(user?.email || "").split("@")[0].trim();
  return emailName || "studente";
}

export async function signOut() {
  const { client } = await getAuthContext();
  await client.auth.signOut();
  location.replace(appRoute("/login"));
}

async function protectCurrentPage() {
  if (document.body?.dataset.authRequired !== "true") return;
  try {
    const context = await getAuthContext();
    if (!context.session) {
      redirectToLogin();
      return;
    }
    document.querySelectorAll("[data-auth-display-name]").forEach((node) => {
      node.textContent = displayName(context.user);
    });
    document.querySelectorAll("[data-auth-email]").forEach((node) => {
      node.textContent = context.user?.email || "";
    });
    document.querySelectorAll("[data-auth-logout]").forEach((button) => {
      button.addEventListener("click", signOut);
    });
    document.documentElement.dataset.authState = "ready";
  } catch (error) {
    document.documentElement.dataset.authState = "error";
    const banner = document.createElement("div");
    banner.className = "auth-runtime-error";
    banner.setAttribute("role", "alert");
    banner.textContent = `Accesso non disponibile: ${error.message}`;
    document.body.prepend(banner);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", protectCurrentPage, { once: true });
} else {
  protectCurrentPage();
}
