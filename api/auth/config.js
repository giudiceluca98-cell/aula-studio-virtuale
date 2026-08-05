import { allow, json, publicAuthConfig } from "../_lib/agenda-server.js";

export default async function handler(req, res) {
  if (!allow(req, res, ["GET"])) return;
  try {
    return json(res, 200, publicAuthConfig());
  } catch {
    return json(res, 503, { error: "Accesso non configurato sul server" });
  }
}
