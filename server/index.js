import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;
const JWT_SECRET = process.env.JWT_SECRET || "dev_cipherrooms_secret";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.DB_PATH || path.join(__dirname, "data", "cipherrooms.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

app.use(cors({ origin: CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json());

// Serve frontend (Vite build) from the same server
const webDist = path.join(__dirname, "..", "dist");
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
}

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
    parent_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT NOT NULL,
    access TEXT NOT NULL,
    description TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    active INTEGER NOT NULL,
    encrypted INTEGER NOT NULL,
    enc_key TEXT,
    access_grants TEXT NOT NULL,
    pending_access TEXT NOT NULL,
    pinned TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    leaders TEXT NOT NULL,
    members TEXT NOT NULL,
    pending TEXT NOT NULL,
    messages TEXT NOT NULL
  );
`);

const ensureRoomColumns = () => {
  const cols = db.prepare("PRAGMA table_info(rooms)").all().map(c => c.name);
  const add = (name, def) => { if(!cols.includes(name)) db.exec(`ALTER TABLE rooms ADD COLUMN ${name} ${def}`); };
  add("parent_id", "TEXT");
  add("encrypted", "INTEGER NOT NULL DEFAULT 0");
  add("enc_key", "TEXT");
  add("access_grants", "TEXT NOT NULL DEFAULT '[]'");
  add("pending_access", "TEXT NOT NULL DEFAULT '[]'");
  add("pinned", "TEXT NOT NULL DEFAULT '[]'");
};
ensureRoomColumns();

const now = () => new Date().toISOString();
const uid = () => `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const rid = () => `room_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const iconMap = { tech: "⚛", design: "◇", finance: "◈", research: "⬡", aiml: "🧠", devops: "⬟" };

const safeUser = (u) => ({ id: u.id, username: u.username, name: u.name, role: u.role, avatar: u.avatar });
const getUserById = (id) => db.prepare("SELECT * FROM users WHERE id = ?").get(id);
const getUserByUsername = (username) => db.prepare("SELECT * FROM users WHERE username = ?").get(username);
const getUserByName = (name) => db.prepare("SELECT * FROM users WHERE name = ?").get(name);
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
    parentId: room.parent_id || null,
    name: room.name,
    type: room.type,
    icon: room.icon,
    access: room.access,
    description: room.description,
    code: room.code,
    active: !!room.active,
    encrypted: !!room.encrypted,
    encKey: room.enc_key || null,
    accessGrants: parseArr(room.access_grants),
    pendingAccess: parseArr(room.pending_access).map(getUserById).filter(Boolean).map(safeUser),
    pinned: parseArr(room.pinned),
    createdAt: room.created_at,
    createdBy: room.created_by,
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
const roomAdminOnly = (req, res, next) => {
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (req.user.role === "admin" || room.created_by === req.user.id) {
    req.room = room;
    return next();
  }
  return res.status(403).json({ error: "Room owner only" });
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
  const u = getUserByUsername(username) || getUserByName(username);
  if (!u) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ sub: u.id }, JWT_SECRET, { expiresIn: "8h" });
  return res.json({ token, user: safeUser(u) });
});

app.get("/auth/me", auth, (req, res) => {
  return res.json({ user: safeUser(req.user) });
});

app.get("/users", auth, (_req, res) => {
  const rows = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  return res.json({ users: rows.map(safeUser) });
});

app.post("/users", auth, async (req, res) => {
  const { name, username, password, role } = req.body || {};
  if (!name || !username || !password) return res.status(400).json({ error: "Missing fields" });
  if (getUserByUsername(username)) return res.status(409).json({ error: "Username already exists" });
  const userRole = role && ["admin", "leader", "member"].includes(role) ? role : "member";
  const avatar = userRole === "admin" ? "👑" : userRole === "leader" ? "⬡" : "👤";
  const id = uid();
  const passwordHash = await bcrypt.hash(password, 10);
  db.prepare(
    "INSERT INTO users (id, username, name, role, avatar, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, username, name, userRole, avatar, passwordHash, now());
  return res.json({ user: safeUser(getUserById(id)) });
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

app.post("/rooms", auth, (req, res) => {
  const { name, type, access, description } = req.body || {};
  if (!name) return res.status(400).json({ error: "Room name is required" });
  if (req.user.role !== "admin") {
    const avatar = "👑";
    db.prepare("UPDATE users SET role = ?, avatar = ? WHERE id = ?").run("admin", avatar, req.user.id);
    req.user = getUserById(req.user.id);
  }
  const room = {
    id: rid(),
    parent_id: null,
    name,
    type: type || "tech",
    icon: iconMap[type] || "⬡",
    access: access || "private",
    description: description || "",
    code: makeCode(),
    active: 1,
    encrypted: 0,
    enc_key: null,
    access_grants: JSON.stringify([]),
    pending_access: JSON.stringify([]),
    pinned: JSON.stringify([]),
    created_at: now(),
    created_by: req.user.id,
    leaders: JSON.stringify([]),
    members: JSON.stringify([]),
    pending: JSON.stringify([]),
    messages: JSON.stringify([]),
  };
  db.prepare(
    `INSERT INTO rooms (id, parent_id, name, type, icon, access, description, code, active, encrypted, enc_key, access_grants, pending_access, pinned, created_at, created_by, leaders, members, pending, messages)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    room.id, room.parent_id, room.name, room.type, room.icon, room.access, room.description, room.code,
    room.active, room.encrypted, room.enc_key, room.access_grants, room.pending_access, room.pinned,
    room.created_at, room.created_by, room.leaders, room.members, room.pending, room.messages
  );
  return res.json({ room: toRoomPayload(db.prepare("SELECT * FROM rooms WHERE id = ?").get(room.id)) });
});

app.post("/rooms/join", auth, (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: "Room code is required" });
  const room = db.prepare("SELECT * FROM rooms WHERE code = ?").get(String(code).toUpperCase());
  if (!room) return res.status(404).json({ error: "No room found with that code" });
  if (room.parent_id) return res.status(400).json({ error: "Only main rooms accept join requests" });
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

app.post("/rooms/:id/approve", auth, roomAdminOnly, (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "User ID required" });
  const room = req.room;
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

app.post("/rooms/:id/reject", auth, roomAdminOnly, (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "User ID required" });
  const room = req.room;
  const pending = parseArr(room.pending).filter((id) => id !== userId);
  db.prepare("UPDATE rooms SET pending = ? WHERE id = ?").run(JSON.stringify(pending), room.id);
  return res.json({ room: toRoomPayload(db.prepare("SELECT * FROM rooms WHERE id = ?").get(room.id)) });
});

app.post("/rooms/:id/assign-leader", auth, roomAdminOnly, (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "User ID required" });
  const room = req.room;
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

app.post("/rooms/:id/assign-member", auth, roomAdminOnly, (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "User ID required" });
  const room = req.room;
  const members = parseArr(room.members);
  if (!members.includes(userId)) members.push(userId);
  const grants = parseArr(room.access_grants);
  if (!grants.includes(userId)) grants.push(userId);
  db.prepare("UPDATE rooms SET members = ?, access_grants = ? WHERE id = ?").run(
    JSON.stringify(members),
    JSON.stringify(grants),
    room.id
  );
  return res.json({ room: toRoomPayload(db.prepare("SELECT * FROM rooms WHERE id = ?").get(room.id)) });
});

app.post("/rooms/:id/subroom", auth, roomAdminOnly, (req, res) => {
  const { name, type, access, leaderId, memberIds, encrypted, encKey } = req.body || {};
  if (!name) return res.status(400).json({ error: "Room name is required" });
  const parent = req.room;
  const room = {
    id: rid(),
    parent_id: parent.id,
    name,
    type: type || "tech",
    icon: iconMap[type] || "⬡",
    access: access || "private",
    description: "",
    code: makeCode(),
    active: 1,
    encrypted: encrypted ? 1 : 0,
    enc_key: encKey || null,
    access_grants: JSON.stringify([...(leaderId ? [leaderId] : []), ...(memberIds || [])]),
    pending_access: JSON.stringify([]),
    pinned: JSON.stringify([]),
    created_at: now(),
    created_by: parent.created_by,
    leaders: JSON.stringify(leaderId ? [leaderId] : []),
    members: JSON.stringify([...(leaderId ? [leaderId] : []), ...(memberIds || [])]),
    pending: JSON.stringify([]),
    messages: JSON.stringify([]),
  };
  db.prepare(
    `INSERT INTO rooms (id, parent_id, name, type, icon, access, description, code, active, encrypted, enc_key, access_grants, pending_access, pinned, created_at, created_by, leaders, members, pending, messages)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    room.id, room.parent_id, room.name, room.type, room.icon, room.access, room.description, room.code,
    room.active, room.encrypted, room.enc_key, room.access_grants, room.pending_access, room.pinned,
    room.created_at, room.created_by, room.leaders, room.members, room.pending, room.messages
  );
  return res.json({ room: toRoomPayload(db.prepare("SELECT * FROM rooms WHERE id = ?").get(room.id)) });
});

app.post("/rooms/:id/request-access", auth, (req, res) => {
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  const pending = parseArr(room.pending_access);
  const grants = parseArr(room.access_grants);
  if (grants.includes(req.user.id)) return res.json({ status: "granted" });
  if (!pending.includes(req.user.id)) pending.push(req.user.id);
  db.prepare("UPDATE rooms SET pending_access = ? WHERE id = ?").run(JSON.stringify(pending), room.id);
  return res.json({ status: "pending" });
});

app.post("/rooms/:id/grant-access", auth, (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "User ID required" });
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  const leaders = parseArr(room.leaders);
  if (!leaders.includes(req.user.id)) return res.status(403).json({ error: "Leader only" });
  const pending = parseArr(room.pending_access).filter((id) => id !== userId);
  const grants = parseArr(room.access_grants);
  if (!grants.includes(userId)) grants.push(userId);
  db.prepare("UPDATE rooms SET pending_access = ?, access_grants = ? WHERE id = ?").run(
    JSON.stringify(pending),
    JSON.stringify(grants),
    room.id
  );
  return res.json({ room: toRoomPayload(db.prepare("SELECT * FROM rooms WHERE id = ?").get(room.id)) });
});

app.post("/rooms/:id/message", auth, (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "Message required" });
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  const messages = parseArr(room.messages);
  messages.push(message);
  db.prepare("UPDATE rooms SET messages = ? WHERE id = ?").run(JSON.stringify(messages), room.id);
  return res.json({ room: toRoomPayload(db.prepare("SELECT * FROM rooms WHERE id = ?").get(room.id)) });
});

app.post("/rooms/:id/pin", auth, (req, res) => {
  const { messageId } = req.body || {};
  if (!messageId) return res.status(400).json({ error: "Message ID required" });
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  const pinned = parseArr(room.pinned);
  const next = pinned.includes(messageId) ? pinned.filter(id => id !== messageId) : [messageId, ...pinned];
  db.prepare("UPDATE rooms SET pinned = ? WHERE id = ?").run(JSON.stringify(next), room.id);
  return res.json({ room: toRoomPayload(db.prepare("SELECT * FROM rooms WHERE id = ?").get(room.id)) });
});

const callOpenAI = async (prompt) => {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are CipherMind, a concise collaboration assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(errText || "OpenAI request failed");
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "No response.";
};

app.post("/ai/summary", auth, async (req, res) => {
  try {
    const { transcript } = req.body || {};
    if (!transcript) return res.status(400).json({ error: "Transcript required" });
    const out = await callOpenAI(`Summarize this room conversation in 5 bullet points:\n${transcript}`);
    return res.json({ text: out });
  } catch (e) {
    return res.status(500).json({ error: e.message || "AI error" });
  }
});

app.post("/ai/suggest", auth, async (req, res) => {
  try {
    const { transcript } = req.body || {};
    if (!transcript) return res.status(400).json({ error: "Transcript required" });
    const out = await callOpenAI(`Generate 5 actionable suggestions based on this conversation:\n${transcript}`);
    return res.json({ text: out });
  } catch (e) {
    return res.status(500).json({ error: e.message || "AI error" });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// SPA fallback
app.use((req, res) => {
  if (!fs.existsSync(webDist)) return res.status(404).end();
  res.sendFile(path.join(webDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`CipherRooms API running on http://localhost:${PORT}`);
});
