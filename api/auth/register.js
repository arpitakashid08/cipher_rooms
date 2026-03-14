import { ensureSchema, countUsers, getUserByUsername, hashPassword, safeUser, signToken, uid } from "../_db.js";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await ensureSchema();
  const { name, username, password } = req.body || {};
  if (!name || !username || !password) return res.status(400).json({ error: "Missing fields" });
  if (String(password).length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  const existing = await getUserByUsername(username);
  if (existing) return res.status(409).json({ error: "Username already exists" });
  const isFirst = (await countUsers()) === 0;
  const role = isFirst ? "admin" : "member";
  const avatar = role === "admin" ? "👑" : "👤";
  const id = uid();
  const passwordHash = await hashPassword(password);
  await sql`
    INSERT INTO users (id, username, name, role, avatar, password_hash, created_at)
    VALUES (${id}, ${username}, ${name}, ${role}, ${avatar}, ${passwordHash}, NOW())
  `;
  const token = signToken(id);
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return res.json({ token, user: safeUser(rows[0]) });
}
