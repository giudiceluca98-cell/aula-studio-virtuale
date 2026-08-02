import { admin, allow, authenticatedUser, json, subscriptionSchema } from "../_lib/agenda-server.js";
export default async function handler(req, res) {
  if (!allow(req, res, ["GET","POST","DELETE"])) return;
  const user = await authenticatedUser(req);
  if (!user) return json(res, 401, { error: "Sessione non valida" });
  const db = admin();
  if (req.method === "GET") {
    const { data, error } = await db.from("push_subscriptions").select("id,device_name,enabled,last_used_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false });
    return error ? json(res, 500, { error: "Impossibile leggere i dispositivi" }) : json(res, 200, { subscriptions: data });
  }
  if (req.method === "DELETE") {
    const id = String(req.query.id || "");
    const { error } = await db.from("push_subscriptions").update({ enabled: false }).eq("id", id).eq("user_id", user.id);
    return error ? json(res, 400, { error: "Dispositivo non disattivato" }) : json(res, 200, { ok: true });
  }
  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) return json(res, 400, { error: "Subscription non valida" });
  const value = parsed.data;
  const { data, error } = await db.from("push_subscriptions").upsert({
    user_id: user.id, endpoint: value.endpoint, p256dh: value.keys.p256dh, auth: value.keys.auth,
    device_name: value.deviceName, user_agent: String(req.headers["user-agent"] || "").slice(0,500), enabled: true, last_used_at: new Date().toISOString()
  }, { onConflict: "user_id,endpoint" }).select("id,device_name,enabled").single();
  return error ? json(res, 400, { error: "Subscription non salvata" }) : json(res, 201, data);
}
