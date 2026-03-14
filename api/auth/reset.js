import { ensureSchema, getUserByEmail, hashPassword, makeResetToken, rateLimit } from "../_db.js";
import { sql } from "@vercel/postgres";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await ensureSchema();
  if (!rateLimit(req, res, { key: "reset", limit: 5, windowMs: 15 * 60 * 1000 })) return;
  const { email, token, newPassword } = req.body || {};
  if (!email || !token || !newPassword) return res.status(400).json({ error: "Missing fields" });
  if (String(newPassword).length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  const user = await getUserByEmail(String(email).toLowerCase());
  if (!user || !user.reset_token_hash || !user.reset_token_expires) {
    return res.status(400).json({ error: "Invalid token" });
  }
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  if (hash !== user.reset_token_hash) return res.status(400).json({ error: "Invalid token" });
  const expires = new Date(user.reset_token_expires);
  if (Date.now() > expires.getTime()) return res.status(400).json({ error: "Token expired" });
  const passwordHash = await hashPassword(newPassword);
  await sql`
    UPDATE users
    SET password_hash = ${passwordHash}, reset_token_hash = NULL, reset_token_expires = NULL
    WHERE id = ${user.id}
  `;
  return res.json({ ok: true });
}
