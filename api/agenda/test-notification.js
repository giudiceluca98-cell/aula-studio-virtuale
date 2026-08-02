import { admin, allow, authenticatedUser, json, sendToSubscription } from "../_lib/agenda-server.js";
export default async function handler(req, res) {
  if (!allow(req, res, ["POST"])) return;
  const user = await authenticatedUser(req);
  if (!user) return json(res, 401, { error: "Sessione non valida" });
  const db = admin();
  const since = new Date(Date.now() - 60000).toISOString();
  const { count } = await db.from("notification_test_attempts").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("attempted_at", since);
  if (count) return json(res, 429, { error: "Attendi un minuto prima di riprovare" });
  await db.from("notification_test_attempts").insert({ user_id: user.id });
  const { data: subscriptions } = await db.from("push_subscriptions").select("*").eq("user_id", user.id).eq("enabled", true);
  if (!subscriptions?.length) return json(res, 409, { error: "Nessun dispositivo registrato" });
  let sent = 0;
  for (const subscription of subscriptions) {
    try {
      await sendToSubscription(subscription, JSON.stringify({ title: "Agenda pronta", body: "Le notifiche di Aula Studio funzionano correttamente.", tag: `agenda-test-${Date.now()}`, data: { url: "/agenda" } }));
      sent += 1;
    } catch (error) {
      if ([404,410].includes(error.statusCode)) await db.from("push_subscriptions").update({ enabled: false }).eq("id", subscription.id);
    }
  }
  return sent ? json(res, 200, { ok: true, sent }) : json(res, 502, { error: "Notifica non consegnata" });
}
