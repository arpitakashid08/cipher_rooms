import { ensureSchema, countUsers, getUserByEmail, hashPassword, safeUser, signToken, uid, setSessionCookie, rateLimit } from "../_db.js";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await ensureSchema();
  if (!rateLimit(req, res, { key: "register", limit: 10, windowMs: 15 * 60 * 1000 })) return;
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return res.status(400).json({ error: "Invalid email" });
  if (String(name).trim().length < 2) return res.status(400).json({ error: "Name is too short" });
  if (String(password).length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  const existing = await getUserByEmail(String(email).toLowerCase());
  if (existing) return res.status(409).json({ error: "Email already exists" });
  const isFirst = (await countUsers()) === 0;
  const role = isFirst ? "admin" : "member";
  const avatar = role === "admin" ? "👑" : "👤";
  const id = uid();
  const passwordHash = await hashPassword(password);
  await sql`
    INSERT INTO users (id, name, email, role, avatar, password_hash, created_at)
    VALUES (${id}, ${name.trim()}, ${String(email).toLowerCase()}, ${role}, ${avatar}, ${passwordHash}, NOW())
  `;
  const token = signToken(id);
  setSessionCookie(res, token);
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return res.json({ user: safeUser(rows[0]) });
}
