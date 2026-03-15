import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev_cipherrooms_secret";

export const iconMap = { tech: "⚛", design: "◇", finance: "◈", research: "⬡", aiml: "🧠", devops: "⬟" };

export const ensureSchema = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      reset_token_hash TEXT,
      reset_token_expires TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ`;
  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      access TEXT NOT NULL,
      description TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      encrypted BOOLEAN NOT NULL DEFAULT FALSE,
      enc_key TEXT,
      access_grants JSONB NOT NULL DEFAULT '[]'::jsonb,
      pending_access JSONB NOT NULL DEFAULT '[]'::jsonb,
      pinned JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by TEXT NOT NULL REFERENCES users(id),
      leaders JSONB NOT NULL DEFAULT '[]'::jsonb,
      members JSONB NOT NULL DEFAULT '[]'::jsonb,
      pending JSONB NOT NULL DEFAULT '[]'::jsonb,
      messages JSONB NOT NULL DEFAULT '[]'::jsonb
    );
  `;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS parent_id TEXT`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS encrypted BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS enc_key TEXT`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS access_grants JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS pending_access JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS pinned JSONB NOT NULL DEFAULT '[]'::jsonb`;
};

export const nowIso = () => new Date().toISOString();
export const uid = () => `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
export const rid = () => `room_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
export const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const safeUser = (u) => ({
  id: u.id,
  name: u.name,
  username: u.username,
  email: u.email,
  role: u.role,
  avatar: u.avatar,
});

export const getUserById = async (id) => {
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
};

export const getUserByEmail = async (email) => {
  const { rows } = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return rows[0] || null;
};
export const getUserByUsername = async (username) => {
  const { rows } = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
  return rows[0] || null;
};

export const countUsers = async () => {
  const { rows } = await sql`SELECT COUNT(*)::int AS c FROM users`;
  return rows[0]?.c || 0;
};

export const hashPassword = async (password) => bcrypt.hash(password, 10);
export const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

export const signToken = (userId) => jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "8h" });
export const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

export const parseCookies = (header = "") => {
  const out = {};
  header.split(";").forEach((pair) => {
    const [k, ...rest] = pair.split("=");
    if (!k) return;
    out[k.trim()] = decodeURIComponent(rest.join("=").trim());
  });
  return out;
};

export const setSessionCookie = (res, token) => {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  res.setHeader(
    "Set-Cookie",
    `cr_session=${token}; Path=/; HttpOnly; SameSite=Lax; ${secure}Max-Age=28800`
  );
};

export const clearSessionCookie = (res) => {
  res.setHeader("Set-Cookie", "cr_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
};

export const authUser = async (req, res) => {
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  const cookies = parseCookies(req.headers.cookie || "");
  const token = bearer || cookies.cr_session || null;
  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return null;
  }
  try {
    const payload = verifyToken(token);
    const user = await getUserById(payload.sub);
    if (!user) {
      res.status(401).json({ error: "Invalid token" });
      return null;
    }
    return user;
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
};

export const toRoomPayload = async (room) => {
  const leaders = Array.isArray(room.leaders) ? room.leaders : [];
  const members = Array.isArray(room.members) ? room.members : [];
  const pending = Array.isArray(room.pending) ? room.pending : [];
  const accessGrants = Array.isArray(room.access_grants) ? room.access_grants : [];
  const pendingAccess = Array.isArray(room.pending_access) ? room.pending_access : [];
  const pinned = Array.isArray(room.pinned) ? room.pinned : [];

  const leaderRows = leaders.length
    ? (await sql`SELECT * FROM users WHERE id = ANY(${leaders})`).rows
    : [];
  const memberRows = members.length
    ? (await sql`SELECT * FROM users WHERE id = ANY(${members})`).rows
    : [];
  const pendingRows = pending.length
    ? (await sql`SELECT * FROM users WHERE id = ANY(${pending})`).rows
    : [];
  const pendingAccessRows = pendingAccess.length
    ? (await sql`SELECT * FROM users WHERE id = ANY(${pendingAccess})`).rows
    : [];

  return {
    id: room.id,
    parentId: room.parent_id || null,
    name: room.name,
    type: room.type,
    icon: room.icon,
    access: room.access,
    description: room.description,
    code: room.code,
    active: room.active,
    createdAt: room.created_at,
    createdBy: room.created_by,
    encrypted: room.encrypted,
    encKey: room.enc_key || null,
    accessGrants,
    pendingAccess: pendingAccessRows.map(safeUser),
    pinned,
    leaders: leaderRows.map(safeUser),
    members: memberRows.map(safeUser),
    pending: pendingRows.map(safeUser),
    messages: room.messages || [],
  };
};

const rateStore = new Map();
export const rateLimit = (req, res, { key, limit, windowMs }) => {
  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").toString().split(",")[0].trim();
  const now = Date.now();
  const bucketKey = `${key}:${ip}`;
  const entry = rateStore.get(bucketKey) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  rateStore.set(bucketKey, entry);
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
  if (entry.count > limit) {
    res.status(429).json({ error: "Too many requests, please try again later" });
    return false;
  }
  return true;
};

export const makeResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
};
