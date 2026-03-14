import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  roomId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text: string;
  fileUrl?: string;
  reactions: {
    like: number;
    dislike: number;
    suggestion: number;
    improvement: number;
  };
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  fileUrl: { type: String },
  reactions: {
    like: { type: Number, default: 0 },
    dislike: { type: Number, default: 0 },
    suggestion: { type: Number, default: 0 },
    improvement: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
