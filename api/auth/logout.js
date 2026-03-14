import { ensureSchema, clearSessionCookie } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await ensureSchema();
  clearSessionCookie(res);
  return res.json({ ok: true });
}
