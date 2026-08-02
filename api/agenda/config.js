import { allow, json, publicConfig } from "../_lib/agenda-server.js";
export default async function handler(req, res) {
  if (!allow(req, res, ["GET"])) return;
  try { return json(res, 200, publicConfig()); }
  catch { return json(res, 503, { error: "Agenda non configurata sul server" }); }
}
