import { ensureSchema, getUserByUsername, comparePassword, safeUser, signToken } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await ensureSchema();
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
  const user = await getUserByUsername(username);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken(user.id);
  return res.json({ token, user: safeUser(user) });
}
