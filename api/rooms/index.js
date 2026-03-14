import { ensureSchema, authUser, iconMap, makeCode, rid, toRoomPayload } from "../_db.js";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  await ensureSchema();
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
    return res.json({ rooms });
  }

  if (req.method === "POST") {
    if (user.role !== "admin") return res.status(403).json({ error: "Admin only" });
    const { name, type, access, description } = req.body || {};
    if (!name) return res.status(400).json({ error: "Room name is required" });
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
    return res.json({ room: await toRoomPayload(rows[0]) });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
