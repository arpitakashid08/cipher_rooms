import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  name: string;
  code: string;
  isPublic: boolean;
  creatorId: mongoose.Types.ObjectId;
  leaderIds: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  domainName?: string;
  description?: string;
  createdAt: Date;
}

const RoomSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  isPublic: { type: Boolean, default: false },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  domainName: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
