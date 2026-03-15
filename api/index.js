import { sql } from "@vercel/postgres";
import {
  ensureSchema,
  countUsers,
  getUserByEmail,
  getUserByUsername,
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
    const { name, email, username, password } = req.body || {};
    if (!name || !password || (!email && !username)) return json(res, 400, { error: "Missing fields" });
    const finalUsername = username ? String(username).trim() : null;
    const finalEmail = email
      ? String(email).toLowerCase()
      : finalUsername
      ? `${finalUsername}@cipher.local`
      : null;
    if (!finalEmail) return json(res, 400, { error: "Email required" });
    if (String(name).trim().length < 2) return json(res, 400, { error: "Name is too short" });
    if (String(password).length < 6) return json(res, 400, { error: "Password must be at least 6 characters" });
    const existingEmail = await getUserByEmail(finalEmail);
    const existingUsername = finalUsername ? await getUserByUsername(finalUsername) : null;
    if (existingEmail || existingUsername) return json(res, 409, { error: "User already exists" });
    const isFirst = (await countUsers()) === 0;
    const role = isFirst ? "admin" : "member";
    const avatar = role === "admin" ? "👑" : "👤";
    const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const passwordHash = await hashPassword(password);
    await sql`
      INSERT INTO users (id, name, username, email, role, avatar, password_hash, created_at)
      VALUES (${id}, ${name.trim()}, ${finalUsername}, ${finalEmail}, ${role}, ${avatar}, ${passwordHash}, NOW())
    `;
    const token = signToken(id);
    setSessionCookie(res, token);
    const user = await getUserById(id);
    return json(res, 200, { token, user: safeUser(user) });
  }

  // Auth: Login
  if (req.method === "POST" && path === "/auth/login") {
    if (!rateLimit(req, res, { key: "login", limit: 10, windowMs: 15 * 60 * 1000 })) return;
    const { email, username, password } = req.body || {};
    if ((!email && !username) || !password) return json(res, 400, { error: "Missing credentials" });
    const user = email
      ? await getUserByEmail(String(email).toLowerCase())
      : await getUserByUsername(String(username).trim());
    if (!user) return json(res, 401, { error: "Invalid credentials" });
    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return json(res, 401, { error: "Invalid credentials" });
    const token = signToken(user.id);
    setSessionCookie(res, token);
    return json(res, 200, { token, user: safeUser(user) });
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
  if (req.method === "POST" && path === "/users") {
    const user = await authUser(req, res);
    if (!user) return;
    if (user.role !== "admin") return json(res, 403, { error: "Admin only" });
    const { name, username, password, role } = req.body || {};
    if (!name || !username || !password) return json(res, 400, { error: "Missing fields" });
    const existing = await getUserByUsername(String(username).trim());
    if (existing) return json(res, 409, { error: "Username already exists" });
    const userRole = role && ["admin", "leader", "member"].includes(role) ? role : "member";
    const avatar = userRole === "admin" ? "👑" : userRole === "leader" ? "⬡" : "👤";
    const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const passwordHash = await hashPassword(password);
    const email = `${String(username).trim()}@cipher.local`;
    await sql`
      INSERT INTO users (id, name, username, email, role, avatar, password_hash, created_at)
      VALUES (${id}, ${name.trim()}, ${String(username).trim()}, ${email}, ${userRole}, ${avatar}, ${passwordHash}, NOW())
    `;
    const created = await getUserById(id);
    return json(res, 200, { user: safeUser(created) });
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
      INSERT INTO rooms (id, parent_id, name, type, icon, access, description, code, active, encrypted, enc_key, access_grants, pending_access, pinned, created_at, created_by, leaders, members, pending, messages)
      VALUES (${id}, ${null}, ${name}, ${roomType}, ${icon}, ${access || "private"}, ${description || ""}, ${code}, true, false, ${null},
        ${JSON.stringify([])}, ${JSON.stringify([])}, ${JSON.stringify([])}, NOW(), ${user.id},
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
  const memberMatch = path.match(/^\/rooms\/([^/]+)\/assign-member$/);
  if (req.method === "POST" && (approveMatch || rejectMatch || leaderMatch || memberMatch)) {
    const user = await authUser(req, res);
    if (!user) return;
    if (user.role !== "admin") return json(res, 403, { error: "Admin only" });
    const { userId } = req.body || {};
    if (!userId) return json(res, 400, { error: "User ID required" });
    const roomId = (approveMatch || rejectMatch || leaderMatch || memberMatch)[1];
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
    } else if (memberMatch) {
      if (!members.includes(userId)) members.push(userId);
      const grants = room.access_grants || [];
      if (!grants.includes(userId)) grants.push(userId);
      await sql`UPDATE rooms SET members = ${JSON.stringify(members)}, access_grants = ${JSON.stringify(grants)} WHERE id = ${room.id}`;
    }
    const updated = (await sql`SELECT * FROM rooms WHERE id = ${room.id} LIMIT 1`).rows[0];
    return json(res, 200, { room: await toRoomPayload(updated) });
  }

  const subroomMatch = path.match(/^\/rooms\/([^/]+)\/subroom$/);
  if (req.method === "POST" && subroomMatch) {
    const user = await authUser(req, res);
    if (!user) return;
    if (user.role !== "admin") return json(res, 403, { error: "Admin only" });
    const { name, type, access, leaderId, memberIds, encrypted, encKey } = req.body || {};
    if (!name) return json(res, 400, { error: "Room name is required" });
    const parentId = subroomMatch[1];
    const { rows } = await sql`SELECT * FROM rooms WHERE id = ${parentId} LIMIT 1`;
    const parent = rows[0];
    if (!parent) return json(res, 404, { error: "Main room not found" });
    const id = rid();
    const roomType = type || "tech";
    const icon = iconMap[roomType] || "⬡";
    const leaders = leaderId ? [leaderId] : [];
    const members = [...leaders, ...(memberIds || [])];
    const grants = members;
    await sql`
      INSERT INTO rooms (id, parent_id, name, type, icon, access, description, code, active, encrypted, enc_key, access_grants, pending_access, pinned, created_at, created_by, leaders, members, pending, messages)
      VALUES (${id}, ${parentId}, ${name}, ${roomType}, ${icon}, ${access || "private"}, ${""}, ${makeCode()}, true, ${!!encrypted}, ${encKey || null},
        ${JSON.stringify(grants)}, ${JSON.stringify([])}, ${JSON.stringify([])}, NOW(), ${parent.created_by},
        ${JSON.stringify(leaders)}, ${JSON.stringify(members)}, ${JSON.stringify([])}, ${JSON.stringify([])})
    `;
    const updated = (await sql`SELECT * FROM rooms WHERE id = ${id} LIMIT 1`).rows[0];
    return json(res, 200, { room: await toRoomPayload(updated) });
  }

  const requestAccessMatch = path.match(/^\/rooms\/([^/]+)\/request-access$/);
  if (req.method === "POST" && requestAccessMatch) {
    const user = await authUser(req, res);
    if (!user) return;
    const roomId = requestAccessMatch[1];
    const { rows } = await sql`SELECT * FROM rooms WHERE id = ${roomId} LIMIT 1`;
    const room = rows[0];
    if (!room) return json(res, 404, { error: "Room not found" });
    const grants = room.access_grants || [];
    if (grants.includes(user.id)) return json(res, 200, { status: "granted" });
    const pendingAccess = room.pending_access || [];
    if (!pendingAccess.includes(user.id)) pendingAccess.push(user.id);
    await sql`UPDATE rooms SET pending_access = ${JSON.stringify(pendingAccess)} WHERE id = ${room.id}`;
    return json(res, 200, { status: "pending" });
  }

  const grantAccessMatch = path.match(/^\/rooms\/([^/]+)\/grant-access$/);
  if (req.method === "POST" && grantAccessMatch) {
    const user = await authUser(req, res);
    if (!user) return;
    if (user.role !== "admin") return json(res, 403, { error: "Admin only" });
    const { userId } = req.body || {};
    if (!userId) return json(res, 400, { error: "User ID required" });
    const roomId = grantAccessMatch[1];
    const { rows } = await sql`SELECT * FROM rooms WHERE id = ${roomId} LIMIT 1`;
    const room = rows[0];
    if (!room) return json(res, 404, { error: "Room not found" });
    const pendingAccess = (room.pending_access || []).filter((id) => id !== userId);
    const grants = room.access_grants || [];
    if (!grants.includes(userId)) grants.push(userId);
    await sql`UPDATE rooms SET pending_access = ${JSON.stringify(pendingAccess)}, access_grants = ${JSON.stringify(grants)} WHERE id = ${room.id}`;
    const updated = (await sql`SELECT * FROM rooms WHERE id = ${room.id} LIMIT 1`).rows[0];
    return json(res, 200, { room: await toRoomPayload(updated) });
  }

  const messageMatch = path.match(/^\/rooms\/([^/]+)\/message$/);
  if (req.method === "POST" && messageMatch) {
    const user = await authUser(req, res);
    if (!user) return;
    const { message } = req.body || {};
    if (!message) return json(res, 400, { error: "Message required" });
    const roomId = messageMatch[1];
    const { rows } = await sql`SELECT * FROM rooms WHERE id = ${roomId} LIMIT 1`;
    const room = rows[0];
    if (!room) return json(res, 404, { error: "Room not found" });
    const messages = room.messages || [];
    messages.push(message);
    await sql`UPDATE rooms SET messages = ${JSON.stringify(messages)} WHERE id = ${room.id}`;
    const updated = (await sql`SELECT * FROM rooms WHERE id = ${room.id} LIMIT 1`).rows[0];
    return json(res, 200, { room: await toRoomPayload(updated) });
  }

  const pinMatch = path.match(/^\/rooms\/([^/]+)\/pin$/);
  if (req.method === "POST" && pinMatch) {
    const user = await authUser(req, res);
    if (!user) return;
    const { messageId } = req.body || {};
    if (!messageId) return json(res, 400, { error: "Message ID required" });
    const roomId = pinMatch[1];
    const { rows } = await sql`SELECT * FROM rooms WHERE id = ${roomId} LIMIT 1`;
    const room = rows[0];
    if (!room) return json(res, 404, { error: "Room not found" });
    const pinned = room.pinned || [];
    const next = pinned.includes(messageId) ? pinned.filter((id) => id !== messageId) : [messageId, ...pinned];
    await sql`UPDATE rooms SET pinned = ${JSON.stringify(next)} WHERE id = ${room.id}`;
    const updated = (await sql`SELECT * FROM rooms WHERE id = ${room.id} LIMIT 1`).rows[0];
    return json(res, 200, { room: await toRoomPayload(updated) });
  }

  return json(res, 404, { error: "Not found" });
}
