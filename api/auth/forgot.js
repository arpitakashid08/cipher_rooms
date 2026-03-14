import { ensureSchema, getUserByEmail, makeResetToken, rateLimit } from "../_db.js";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await ensureSchema();
  if (!rateLimit(req, res, { key: "forgot", limit: 5, windowMs: 15 * 60 * 1000 })) return;
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Missing email" });
  const user = await getUserByEmail(String(email).toLowerCase());
  if (!user) return res.json({ ok: true });
  const { token, hash } = makeResetToken();
  await sql`
    UPDATE users
    SET reset_token_hash = ${hash}, reset_token_expires = NOW() + INTERVAL '1 hour'
    WHERE id = ${user.id}
  `;
  const response = { ok: true };
  if (process.env.NODE_ENV !== "production") response.resetToken = token;
  return res.json(response);
}
