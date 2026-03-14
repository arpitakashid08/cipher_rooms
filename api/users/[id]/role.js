import { ensureSchema, authUser, safeUser } from "../../_db.js";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await ensureSchema();
  const user = await authUser(req, res);
  if (!user) return;
  if (user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { role } = req.body || {};
  if (!role || !["admin", "leader", "member"].includes(role)) return res.status(400).json({ error: "Invalid role" });
  const id = req.query.id;
  const avatar = role === "admin" ? "👑" : role === "leader" ? "⬡" : "👤";
  await sql`UPDATE users SET role = ${role}, avatar = ${avatar} WHERE id = ${id}`;
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) return res.status(404).json({ error: "User not found" });
  return res.json({ user: safeUser(rows[0]) });
}
