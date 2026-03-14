import { sql } from "@vercel/postgres";
import {
  ensureSchema,
  countUsers,
  getUserByEmail,
  getUserById,
  hashPassword,
  comparePassword,
  safeUser,
  signToken,
  setSessionCookie,
  clearSessionCookie,
  authUser,
  rateLimit,
  makeResetToken,
  iconMap,
  rid,
  makeCode,
  toRoomPayload,
} from "./_db.js";
import crypto from "crypto";

const json = (res, code, body) => res.status(code).json(body);

export default async function handler(req, res) {
  await ensureSchema();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, "") || "/";

  // Health
  if (req.method === "GET" && path === "/health") {
    return json(res, 200, { ok: true });
  }

  // Auth: Register
  if (req.method === "POST" && path === "/auth/register") {
    if (!rateLimit(req, res, { key: "register", limit: 10, windowMs: 15 * 60 * 1000 })) return;
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return json(res, 400, { error: "Missing fields" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return json(res, 400, { error: "Invalid email" });
    if (String(name).trim().length < 2) return json(res, 400, { error: "Name is too short" });
    if (String(password).length < 6) return json(res, 400, { error: "Password must be at least 6 characters" });
    const existing = await getUserByEmail(String(email).toLowerCase());
    if (existing) return json(res, 409, { error: "Email already exists" });
    const isFirst = (await countUsers()) === 0;
    const role = isFirst ? "admin" : "member";
    const avatar = role === "admin" ? "👑" : "👤";
    const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const passwordHash = await hashPassword(password);
    await sql`
      INSERT INTO users (id, name, email, role, avatar, password_hash, created_at)
      VALUES (${id}, ${name.trim()}, ${String(email).toLowerCase()}, ${role}, ${avatar}, ${passwordHash}, NOW())
    `;
    setSessionCookie(res, signToken(id));
    const user = await getUserById(id);
    return json(res, 200, { user: safeUser(user) });
  }

  // Auth: Login
  if (req.method === "POST" && path === "/auth/login") {
    if (!rateLimit(req, res, { key: "login", limit: 10, windowMs: 15 * 60 * 1000 })) return;
    const { email, password } = req.body || {};
    if (!email || !password) return json(res, 400, { error: "Missing credentials" });
    const user = await getUserByEmail(String(email).toLowerCase());
    if (!user) return json(res, 401, { error: "Invalid credentials" });
    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return json(res, 401, { error: "Invalid credentials" });
    setSessionCookie(res, signToken(user.id));
    return json(res, 200, { user: safeUser(user) });
  }

  // Auth: Me
  if (req.method === "GET" && path === "/auth/me") {
    const user = await authUser(req, res);
    if (!user) return;
    return json(res, 200, { user: safeUser(user) });
  }

  // Auth: Logout
  if (req.method === "POST" && path === "/auth/logout") {
    clearSessionCookie(res);
    return json(res, 200, { ok: true });
  }

  // Auth: Forgot
  if (req.method === "POST" && path === "/auth/forgot") {
    if (!rateLimit(req, res, { key: "forgot", limit: 5, windowMs: 15 * 60 * 1000 })) return;
    const { email } = req.body || {};
    if (!email) return json(res, 400, { error: "Missing email" });
    const user = await getUserByEmail(String(email).toLowerCase());
    if (!user) return json(res, 200, { ok: true });
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
        // ignore email failures
      }
    }
    const response = { ok: true };
    if (process.env.NODE_ENV !== "production") {
      response.resetToken = token;
      response.resetLink = resetLink;
    }
    return json(res, 200, response);
  }

  // Auth: Reset
  if (req.method === "POST" && path === "/auth/reset") {
    if (!rateLimit(req, res, { key: "reset", limit: 5, windowMs: 15 * 60 * 1000 })) return;
    const { email, token, newPassword } = req.body || {};
    if (!email || !token || !newPassword) return json(res, 400, { error: "Missing fields" });
    if (String(newPassword).length < 6) return json(res, 400, { error: "Password must be at least 6 characters" });
    const user = await getUserByEmail(String(email).toLowerCase());
    if (!user || !user.reset_token_hash || !user.reset_token_expires) {
      return json(res, 400, { error: "Invalid token" });
    }
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    if (hash !== user.reset_token_hash) return json(res, 400, { error: "Invalid token" });
    if (Date.now() > new Date(user.reset_token_expires).getTime()) return json(res, 400, { error: "Token expired" });
    const passwordHash = await hashPassword(newPassword);
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}, reset_token_hash = NULL, reset_token_expires = NULL
      WHERE id = ${user.id}
    `;
    return json(res, 200, { ok: true });
  }

  // Users: list (admin)
  if (req.method === "GET" && path === "/users") {
    const user = await authUser(req, res);
    if (!user) return;
    if (user.role !== "admin") return json(res, 403, { error: "Admin only" });
    const { rows } = await sql`SELECT * FROM users ORDER BY created_at DESC`;
    return json(res, 200, { users: rows.map(safeUser) });
  }

  // Users: role update (admin)
  const roleMatch = path.match(/^\/users\/([^/]+)\/role$/);
  if (req.method === "POST" && roleMatch) {
    const user = await authUser(req, res);
    if (!user) return;
    if (user.role !== "admin") return json(res, 403, { error: "Admin only" });
    const { role } = req.body || {};
    if (!role || !["admin", "leader", "member"].includes(role)) return json(res, 400, { error: "Invalid role" });
    const id = roleMatch[1];
    const avatar = role === "admin" ? "👑" : role === "leader" ? "⬡" : "👤";
    await sql`UPDATE users SET role = ${role}, avatar = ${avatar} WHERE id = ${id}`;
    const u = await getUserById(id);
    if (!u) return json(res, 404, { error: "User not found" });
    return json(res, 200, { user: safeUser(u) });
  }

  // Rooms: list or create
  if ((req.method === "GET" || req.method === "POST") && path === "/rooms") {
    const user = await authUser(req, res);
    if (!user) return;
    if (req.method === "GET") {
      const { rows } = await sql`SELECT * FROM rooms ORDER BY created_at DESC`;
      const filtered = user.role === "admin"
        ? rows
        : rows.filter((r) => {
            const leaders = r.leaders || [];
            const members = r.members || [];
            const pending = r.pending || [];
            return leaders.includes(user.id) || members.includes(user.id) || pending.includes(user.id);
          });
      const rooms = [];
      for (const room of filtered) rooms.push(await toRoomPayload(room));
      return json(res, 200, { rooms });
    }
    if (user.role !== "admin") return json(res, 403, { error: "Admin only" });
    const { name, type, access, description } = req.body || {};
    if (!name) return json(res, 400, { error: "Room name is required" });
    const id = rid();
    const code = makeCode();
    const roomType = type || "tech";
    const icon = iconMap[roomType] || "⬡";
    await sql`
      INSERT INTO rooms (id, name, type, icon, access, description, code, active, created_at, created_by, leaders, members, pending, messages)
      VALUES (${id}, ${name}, ${roomType}, ${icon}, ${access || "private"}, ${description || ""}, ${code}, true, NOW(), ${user.id},
        ${JSON.stringify([])}, ${JSON.stringify([])}, ${JSON.stringify([])}, ${JSON.stringify([])})
    `;
    const { rows } = await sql`SELECT * FROM rooms WHERE id = ${id} LIMIT 1`;
    return json(res, 200, { room: await toRoomPayload(rows[0]) });
  }

  // Rooms: join
  if (req.method === "POST" && path === "/rooms/join") {
    const user = await authUser(req, res);
    if (!user) return;
    const { code } = req.body || {};
    if (!code) return json(res, 400, { error: "Room code is required" });
    const { rows } = await sql`SELECT * FROM rooms WHERE code = ${String(code).toUpperCase()} LIMIT 1`;
    const room = rows[0];
    if (!room) return json(res, 404, { error: "No room found with that code" });
    const pending = room.pending || [];
    const leaders = room.leaders || [];
    const members = room.members || [];
    if (leaders.includes(user.id) || members.includes(user.id) || pending.includes(user.id)) {
      return json(res, 200, { status: "already_requested" });
    }
    pending.push(user.id);
    await sql`UPDATE rooms SET pending = ${JSON.stringify(pending)} WHERE id = ${room.id}`;
    const updated = (await sql`SELECT * FROM rooms WHERE id = ${room.id} LIMIT 1`).rows[0];
    return json(res, 200, { status: "pending", room: await toRoomPayload(updated) });
  }

  // Rooms: approve/reject/assign leader
  const approveMatch = path.match(/^\/rooms\/([^/]+)\/approve$/);
  const rejectMatch = path.match(/^\/rooms\/([^/]+)\/reject$/);
  const leaderMatch = path.match(/^\/rooms\/([^/]+)\/assign-leader$/);
  if (req.method === "POST" && (approveMatch || rejectMatch || leaderMatch)) {
    const user = await authUser(req, res);
    if (!user) return;
    if (user.role !== "admin") return json(res, 403, { error: "Admin only" });
    const { userId } = req.body || {};
    if (!userId) return json(res, 400, { error: "User ID required" });
    const roomId = (approveMatch || rejectMatch || leaderMatch)[1];
    const { rows } = await sql`SELECT * FROM rooms WHERE id = ${roomId} LIMIT 1`;
    const room = rows[0];
    if (!room) return json(res, 404, { error: "Room not found" });
    const pending = room.pending || [];
    const members = room.members || [];
    const leaders = room.leaders || [];
    if (approveMatch) {
      const nextPending = pending.filter((id) => id !== userId);
      if (!members.includes(userId)) members.push(userId);
      await sql`UPDATE rooms SET pending = ${JSON.stringify(nextPending)}, members = ${JSON.stringify(members)} WHERE id = ${room.id}`;
    } else if (rejectMatch) {
      const nextPending = pending.filter((id) => id !== userId);
      await sql`UPDATE rooms SET pending = ${JSON.stringify(nextPending)} WHERE id = ${room.id}`;
    } else if (leaderMatch) {
      if (!leaders.includes(userId)) leaders.push(userId);
      if (!members.includes(userId)) members.push(userId);
      await sql`UPDATE rooms SET leaders = ${JSON.stringify(leaders)}, members = ${JSON.stringify(members)} WHERE id = ${room.id}`;
    }
    const updated = (await sql`SELECT * FROM rooms WHERE id = ${room.id} LIMIT 1`).rows[0];
    return json(res, 200, { room: await toRoomPayload(updated) });
  }

  return json(res, 404, { error: "Not found" });
}
