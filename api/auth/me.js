import { ensureSchema, authUser, safeUser } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  await ensureSchema();
  const user = await authUser(req, res);
  if (!user) return;
  return res.json({ user: safeUser(user) });
}
