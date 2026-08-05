import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { z } from "zod";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variabile ${name} non configurata`);
  return value;
};

const requiredAny = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`Configura almeno una tra: ${names.join(", ")}`);
};

export const publicAuthConfig = () => ({
  supabaseUrl: requiredAny("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: requiredAny("SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
});

export const publicConfig = () => ({
  ...publicAuthConfig(),
  vapidPublicKey: required("VAPID_PUBLIC_KEY")
});

export const admin = () => createClient(
  requiredAny("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
  requiredAny("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function authenticatedUser(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

export function allow(req, res, methods) {
  const origin = String(req.headers.origin || "");
  const trustedDevelopmentOrigin = /^https?:\/\/(?:localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(?::\d+)?$/.test(origin);
  if (["tauri://localhost","http://tauri.localhost","https://tauri.localhost"].includes(origin) || trustedDevelopmentOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", [...methods,"OPTIONS"].join(", "));
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") { res.status(204).end(); return false; }
  if (!methods.includes(req.method)) {
    res.setHeader("Allow", methods.join(", "));
    json(res, 405, { error: "Metodo non consentito" });
    return false;
  }
  return true;
}

export const subscriptionSchema = z.object({
  endpoint: z.string().url().max(4096).refine((v) => v.startsWith("https://"), "Endpoint HTTPS richiesto"),
  keys: z.object({ p256dh: z.string().min(20).max(512), auth: z.string().min(8).max(512) }),
  deviceName: z.string().trim().min(1).max(80).default("Dispositivo")
});

export function configureWebPush() {
  webpush.setVapidDetails(required("VAPID_SUBJECT"), required("VAPID_PUBLIC_KEY"), required("VAPID_PRIVATE_KEY"));
  return webpush;
}

export function notificationPayload(event, reminder, category, preferences = {}) {
  const effectiveStart = reminder.occurrence_at || event.starts_at;
  const minutes = Math.max(0, Math.round((new Date(effectiveStart).getTime() - Date.now()) / 60000));
  const generic = preferences.hide_notification_details;
  return JSON.stringify({
    title: generic ? "Promemoria Agenda" : event.title,
    body: generic
      ? `Hai un evento in programma tra ${minutes} minuti`
      : `${minutes ? `Inizia tra ${minutes} minuti` : "Inizia ora"}, alle ${new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: preferences.timezone || event.timezone }).format(new Date(effectiveStart))}${event.location ? ` · ${event.location}` : ""}`,
    tag: `agenda-reminder-${reminder.id}`,
    data: { eventId: event.id, reminderId: reminder.id, url: `/agenda?event=${encodeURIComponent(event.id)}` },
    category: category?.name || "Agenda",
    actions: [
      { action: "open", title: "Apri" },
      { action: "complete", title: "Completa" },
      { action: "snooze", title: "Tra 10 minuti" }
    ]
  });
}

export function isQuietTime(preferences, now = new Date()) {
  if (!preferences?.quiet_hours_enabled) return false;
  const parts = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: preferences.timezone || "UTC" }).format(now).split(":").map(Number);
  const current = parts[0] * 60 + parts[1];
  const toMinutes = (value) => { const [h,m] = String(value).split(":").map(Number); return h*60+m; };
  const start = toMinutes(preferences.quiet_hours_start);
  const end = toMinutes(preferences.quiet_hours_end);
  return start <= end ? current >= start && current < end : current >= start || current < end;
}

export async function sendToSubscription(subscription, payload) {
  return configureWebPush().sendNotification({
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth }
  }, payload, { TTL: 3600, urgency: "normal" });
}
