import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5174;
const JWT_SECRET = process.env.JWT_SECRET || "dev_cipherrooms_secret";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.DB_PATH || path.join(__dirname, "data", "cipherrooms.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT NOT NULL,
    access TEXT NOT NULL,
    description TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    active INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    leaders TEXT NOT NULL,
    members TEXT NOT NULL,
    pending TEXT NOT NULL,
    messages TEXT NOT NULL
  );
`);

const now = () => new Date().toISOString();
const uid = () => `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const rid = () => `room_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const iconMap = { tech: "⚛", design: "◇", finance: "◈", research: "⬡", aiml: "🧠", devops: "⬟" };

const safeUser = (u) => ({ id: u.id, username: u.username, name: u.name, role: u.role, avatar: u.avatar });
const getUserById = (id) => db.prepare("SELECT * FROM users WHERE id = ?").get(id);
const getUserByUsername = (username) => db.prepare("SELECT * FROM users WHERE username = ?").get(username);
const countUsers = () => db.prepare("SELECT COUNT(*) as c FROM users").get().c;

const parseArr = (val) => {
  try {
    return JSON.parse(val || "[]");
  } catch {
    return [];
  }
};
const toRoomPayload = (room) => {
  const leaders = parseArr(room.leaders);
  const members = parseArr(room.members);
  const pending = parseArr(room.pending);
  return {
    id: room.id,
    name: room.name,
    type: room.type,
    icon: room.icon,
    access: room.access,
    description: room.description,
    code: room.code,
    active: !!room.active,
    createdAt: room.created_at,
    leaders: leaders.map(getUserById).filter(Boolean).map(safeUser),
    members: members.map(getUserById).filter(Boolean).map(safeUser),
    pending: pending.map(getUserById).filter(Boolean).map(safeUser),
    messages: parseArr(room.messages),
  };
};

const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const u = getUserById(payload.sub);
    if (!u) return res.status(401).json({ error: "Invalid token" });
    req.user = u;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
};

app.post("/auth/register", async (req, res) => {
  const { name, username, password } = req.body || {};
  if (!name || !username || !password) return res.status(400).json({ error: "Missing fields" });
  if (String(password).length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (getUserByUsername(username)) return res.status(409).json({ error: "Username already exists" });
  const isFirst = countUsers() === 0;
  const role = isFirst ? "admin" : "member";
  const avatar = role === "admin" ? "👑" : "👤";
  const id = uid();
  const passwordHash = await bcrypt.hash(password, 10);
  db.prepare(
    "INSERT INTO users (id, username, name, role, avatar, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, username, name, role, avatar, passwordHash, now());
  const token = jwt.sign({ sub: id }, JWT_SECRET, { expiresIn: "8h" });
  return res.json({ token, user: safeUser(getUserById(id)) });
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
  const u = getUserByUsername(username);
  if (!u) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ sub: u.id }, JWT_SECRET, { expiresIn: "8h" });
  return res.json({ token, user: safeUser(u) });
});

app.get("/auth/me", auth, (req, res) => {
  return res.json({ user: safeUser(req.user) });
});

app.get("/users", auth, adminOnly, (_req, res) => {
  const rows = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  return res.json({ users: rows.map(safeUser) });
});

app.post("/users/:id/role", auth, adminOnly, (req, res) => {
  const { role } = req.body || {};
  if (!role || !["admin", "leader", "member"].includes(role)) return res.status(400).json({ error: "Invalid role" });
  const u = getUserById(req.params.id);
  if (!u) return res.status(404).json({ error: "User not found" });
  const avatar = role === "admin" ? "👑" : role === "leader" ? "⬡" : "👤";
  db.prepare("UPDATE users SET role = ?, avatar = ? WHERE id = ?").run(role, avatar, u.id);
  return res.json({ user: safeUser(getUserById(u.id)) });
});

app.get("/rooms", auth, (req, res) => {
  const rows = db.prepare("SELECT * FROM rooms ORDER BY created_at DESC").all();
  const rooms = req.user.role === "admin"
    ? rows
    : rows.filter((r) => {
        const leaders = parseArr(r.leaders);
        const members = parseArr(r.members);
        const pending = parseArr(r.pending);
        return leaders.includes(req.user.id) || members.includes(req.user.id) || pending.includes(req.user.id);
      });
  return res.json({ rooms: rooms.map(toRoomPayload) });
});

app.post("/rooms", auth, adminOnly, (req, res) => {
  const { name, type, access, description } = req.body || {};
  if (!name) return res.status(400).json({ error: "Room name is required" });
  const room = {
    id: rid(),
    name,
    type: type || "tech",
    icon: iconMap[type] || "⬡",
    access: access || "private",
    description: description || "",
    code: makeCode(),
    active: 1,
    created_at: now(),
    created_by: req.user.id,
    leaders: JSON.stringify([]),
    members: JSON.stringify([]),
    pending: JSON.stringify([]),
    messages: JSON.stringify([]),
  };
  db.prepare(
    `INSERT INTO rooms (id, name, type, icon, access, description, code, active, created_at, created_by, leaders, members, pending, messages)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    room.id, room.name, room.type, room.icon, room.access, room.description, room.code,
    room.active, room.created_at, room.created_by, room.leaders, room.members, room.pending, room.messages
  );
  return res.json({ room: toRoomPayload(db.prepare("SELECT * FROM rooms WHERE id = ?").get(room.id)) });
});

app.post("/rooms/join", auth, (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: "Room code is required" });
  const room = db.prepare("SELECT * FROM rooms WHERE code = ?").get(String(code).toUpperCase());
  if (!room) return res.status(404).json({ error: "No room found with that code" });
  const pending = parseArr(room.pending);
  const leaders = parseArr(room.leaders);
  const members = parseArr(room.members);
  if (leaders.includes(req.user.id) || members.includes(req.user.id) || pending.includes(req.user.id)) {
    return res.json({ status: "already_requested" });
  }
  pending.push(req.user.id);
  db.prepare("UPDATE rooms SET pending = ? WHERE id = ?").run(JSON.stringify(pending), room.id);
  return res.json({ status: "pending" });
});

app.post("/rooms/:id/approve", auth, adminOnly, (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "User ID required" });
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  const pending = parseArr(room.pending).filter((id) => id !== userId);
  const members = parseArr(room.members);
  if (!members.includes(userId)) members.push(userId);
  db.prepare("UPDATE rooms SET pending = ?, members = ? WHERE id = ?").run(
    JSON.stringify(pending),
    JSON.stringify(members),
    room.id
  );
  return res.json({ room: toRoomPayload(db.prepare("SELECT * FROM rooms WHERE id = ?").get(room.id)) });
});

app.post("/rooms/:id/reject", auth, adminOnly, (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "User ID required" });
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  const pending = parseArr(room.pending).filter((id) => id !== userId);
  db.prepare("UPDATE rooms SET pending = ? WHERE id = ?").run(JSON.stringify(pending), room.id);
  return res.json({ room: toRoomPayload(db.prepare("SELECT * FROM rooms WHERE id = ?").get(room.id)) });
});

app.post("/rooms/:id/assign-leader", auth, adminOnly, (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "User ID required" });
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  const leaders = parseArr(room.leaders);
  const members = parseArr(room.members);
  if (!leaders.includes(userId)) leaders.push(userId);
  if (!members.includes(userId)) members.push(userId);
  db.prepare("UPDATE rooms SET leaders = ?, members = ? WHERE id = ?").run(
    JSON.stringify(leaders),
    JSON.stringify(members),
    room.id
  );
  return res.json({ room: toRoomPayload(db.prepare("SELECT * FROM rooms WHERE id = ?").get(room.id)) });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`CipherRooms API running on http://localhost:${PORT}`);
});
