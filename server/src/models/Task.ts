import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  roomId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  assignedTo?: mongoose.Types.ObjectId;
  status: 'Pending' | 'InProgress' | 'Completed';
  createdAt: Date;
}

const TaskSchema: Schema = new Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  title: { type: String, required: true },
  description: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'InProgress', 'Completed'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
