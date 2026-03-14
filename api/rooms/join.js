import { ensureSchema, authUser, toRoomPayload } from "../_db.js";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await ensureSchema();
  const user = await authUser(req, res);
  if (!user) return;
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: "Room code is required" });
  const { rows } = await sql`SELECT * FROM rooms WHERE code = ${String(code).toUpperCase()} LIMIT 1`;
  const room = rows[0];
  if (!room) return res.status(404).json({ error: "No room found with that code" });
  const pending = room.pending || [];
  const leaders = room.leaders || [];
  const members = room.members || [];
  if (leaders.includes(user.id) || members.includes(user.id) || pending.includes(user.id)) {
    return res.json({ status: "already_requested" });
  }
  pending.push(user.id);
  await sql`UPDATE rooms SET pending = ${JSON.stringify(pending)} WHERE id = ${room.id}`;
  const updated = (await sql`SELECT * FROM rooms WHERE id = ${room.id} LIMIT 1`).rows[0];
  return res.json({ status: "pending", room: await toRoomPayload(updated) });
}
