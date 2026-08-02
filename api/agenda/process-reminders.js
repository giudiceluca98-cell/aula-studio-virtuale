import { admin, isQuietTime, json, notificationPayload, sendToSubscription } from "../_lib/agenda-server.js";
import rrulePackage from "rrule";
const { rrulestr } = rrulePackage;

async function materializeRecurringReminders(db) {
  const horizonStart = new Date(Date.now() - 60000);
  const horizonEnd = new Date(Date.now() + 48 * 3600000);
  const { data: events } = await db.from("calendar_events").select("id,user_id,starts_at,recurrence_rule,status").not("recurrence_rule", "is", null).in("status", ["confirmed","tentative"]);
  for (const event of events || []) {
    let occurrences;
    try { occurrences = rrulestr(event.recurrence_rule).between(horizonStart, horizonEnd, true); } catch { continue; }
    const { data: templates } = await db.from("event_reminders").select("offset_minutes").eq("event_id", event.id).order("created_at", { ascending: true }).limit(20);
    const offsets = [...new Set((templates || []).map((row) => row.offset_minutes))];
    const rows = occurrences.flatMap((occurrence) => offsets.map((offset) => ({
      event_id: event.id, user_id: event.user_id, offset_minutes: offset,
      occurrence_at: occurrence.toISOString(),
      scheduled_at: new Date(occurrence.getTime() - offset * 60000).toISOString(), status: "pending"
    })));
    if (rows.length) await db.from("event_reminders").upsert(rows, { onConflict: "event_id,occurrence_at,offset_minutes", ignoreDuplicates: true });
  }
}
export default async function handler(req, res) {
  const supplied = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (req.method !== "POST" || !process.env.AGENDA_CRON_SECRET || supplied !== process.env.AGENDA_CRON_SECRET) return json(res, 401, { error: "Non autorizzato" });
  const db = admin();
  await materializeRecurringReminders(db);
  const { data: claimed, error } = await db.rpc("claim_due_reminders", { p_limit: 100 });
  if (error) return json(res, 500, { error: "Impossibile acquisire i promemoria" });
  const results = { claimed: claimed.length, sent: 0, failed: 0, skipped: 0 };
  for (const reminder of claimed) {
    const [{ data: event }, { data: prefs }, { data: subscriptions }] = await Promise.all([
      db.from("calendar_events").select("*,calendar_categories(name)").eq("id", reminder.event_id).eq("user_id", reminder.user_id).maybeSingle(),
      db.from("user_calendar_preferences").select("*").eq("user_id", reminder.user_id).maybeSingle(),
      db.from("push_subscriptions").select("*").eq("user_id", reminder.user_id).eq("enabled", true)
    ]);
    if (!event || event.status === "cancelled" || event.status === "completed" || !prefs?.notifications_enabled) {
      await db.from("event_reminders").update({ status: "cancelled", processing_token: null }).eq("id", reminder.id).eq("processing_token", reminder.processing_token);
      results.skipped++; continue;
    }
    if (isQuietTime(prefs) && prefs.quiet_hours_behavior === "skip") {
      await db.from("event_reminders").update({ status: "cancelled", last_error: "Ore silenziose: notifica omessa", processing_token: null }).eq("id", reminder.id).eq("processing_token", reminder.processing_token);
      results.skipped++; continue;
    }
    if (isQuietTime(prefs) && prefs.quiet_hours_behavior === "delay") {
      await db.from("event_reminders").update({ status: "pending", scheduled_at: new Date(Date.now()+15*60000).toISOString(), processing_token: null }).eq("id", reminder.id).eq("processing_token", reminder.processing_token);
      results.skipped++; continue;
    }
    let delivered = false; let lastError = "Nessuna subscription attiva";
    for (const subscription of subscriptions || []) {
      try {
        await sendToSubscription(subscription, notificationPayload(event, reminder, event.calendar_categories, prefs));
        delivered = true;
        await db.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", subscription.id);
      } catch (sendError) {
        lastError = String(sendError.message || sendError).slice(0,1000);
        if ([404,410].includes(sendError.statusCode)) await db.from("push_subscriptions").update({ enabled: false }).eq("id", subscription.id);
      }
    }
    await db.from("event_reminders").update(delivered
      ? { status: "sent", sent_at: new Date().toISOString(), last_error: null, processing_token: null }
      : { status: reminder.attempts >= 5 ? "failed" : "pending", last_error: lastError, processing_token: null }
    ).eq("id", reminder.id).eq("processing_token", reminder.processing_token);
    delivered ? results.sent++ : results.failed++;
  }
  return json(res, 200, results);
}
