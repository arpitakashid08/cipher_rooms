import { ensureSchema, authUser, toRoomPayload } from "../../_db.js";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await ensureSchema();
  const user = await authUser(req, res);
  if (!user) return;
  if (user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "User ID required" });
  const { rows } = await sql`SELECT * FROM rooms WHERE id = ${req.query.id} LIMIT 1`;
  const room = rows[0];
  if (!room) return res.status(404).json({ error: "Room not found" });
  const pending = (room.pending || []).filter((id) => id !== userId);
  const members = room.members || [];
  if (!members.includes(userId)) members.push(userId);
  await sql`UPDATE rooms SET pending = ${JSON.stringify(pending)}, members = ${JSON.stringify(members)} WHERE id = ${room.id}`;
  const updated = (await sql`SELECT * FROM rooms WHERE id = ${room.id} LIMIT 1`).rows[0];
  return res.json({ room: await toRoomPayload(updated) });
}
