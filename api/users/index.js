import { ensureSchema, authUser, safeUser } from "../_db.js";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  await ensureSchema();
  const user = await authUser(req, res);
  if (!user) return;
  if (user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { rows } = await sql`SELECT * FROM users ORDER BY created_at DESC`;
  return res.json({ users: rows.map(safeUser) });
}
