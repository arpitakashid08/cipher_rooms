import { ensureSchema, getUserByEmail, comparePassword, safeUser, signToken, setSessionCookie, rateLimit } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await ensureSchema();
  if (!rateLimit(req, res, { key: "login", limit: 10, windowMs: 15 * 60 * 1000 })) return;
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing credentials" });
  const user = await getUserByEmail(String(email).toLowerCase());
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken(user.id);
  setSessionCookie(res, token);
  return res.json({ user: safeUser(user) });
}
