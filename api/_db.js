import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "dev_cipherrooms_secret";

export const iconMap = { tech: "⚛", design: "◇", finance: "◈", research: "⬡", aiml: "🧠", devops: "⬟" };

export const ensureSchema = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      access TEXT NOT NULL,
      description TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by TEXT NOT NULL REFERENCES users(id),
      leaders JSONB NOT NULL DEFAULT '[]'::jsonb,
      members JSONB NOT NULL DEFAULT '[]'::jsonb,
      pending JSONB NOT NULL DEFAULT '[]'::jsonb,
      messages JSONB NOT NULL DEFAULT '[]'::jsonb
    );
  `;
};

export const nowIso = () => new Date().toISOString();
export const uid = () => `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
export const rid = () => `room_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
export const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const safeUser = (u) => ({
  id: u.id,
  username: u.username,
  name: u.name,
  role: u.role,
  avatar: u.avatar,
});

export const getUserById = async (id) => {
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
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

export const authUser = async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
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

  const leaderRows = leaders.length
    ? (await sql`SELECT * FROM users WHERE id = ANY(${leaders})`).rows
    : [];
  const memberRows = members.length
    ? (await sql`SELECT * FROM users WHERE id = ANY(${members})`).rows
    : [];
  const pendingRows = pending.length
    ? (await sql`SELECT * FROM users WHERE id = ANY(${pending})`).rows
    : [];

  return {
    id: room.id,
    name: room.name,
    type: room.type,
    icon: room.icon,
    access: room.access,
    description: room.description,
    code: room.code,
    active: room.active,
    createdAt: room.created_at,
    leaders: leaderRows.map(safeUser),
    members: memberRows.map(safeUser),
    pending: pendingRows.map(safeUser),
    messages: room.messages || [],
  };
};
