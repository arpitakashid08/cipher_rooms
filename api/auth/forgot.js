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
  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const resetLink = `${appUrl}/?reset=1&email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM,
          to: user.email,
          subject: "CipherRooms password reset",
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6">
              <h2>CipherRooms Password Reset</h2>
              <p>Use the link below to reset your password. This link expires in 1 hour.</p>
              <p><a href="${resetLink}">Reset your password</a></p>
              <p>Or paste this token in the reset form:</p>
              <pre style="background:#f4f4f4;padding:12px;border-radius:6px">${token}</pre>
            </div>
          `,
        }),
      });
    } catch {
      // fall through to ok response
    }
  }

  const response = { ok: true };
  if (process.env.NODE_ENV !== "production") {
    response.resetToken = token;
    response.resetLink = resetLink;
  }
  return res.json(response);
}
