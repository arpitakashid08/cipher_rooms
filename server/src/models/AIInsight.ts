import mongoose, { Schema, Document } from 'mongoose';

export interface IAIInsight extends Document {
  roomId: mongoose.Types.ObjectId;
  type: 'Summary' | 'TaskExtraction' | 'Transcription' | 'CollaborationAnalysis' | 'ProductivityScore' | 'ConflictDetection' | 'SmartRecommendation';
  content: string;
  score?: number;
  createdAt: Date;
}

const AIInsightSchema: Schema = new Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  type: { 
    type: String, 
    enum: [
      'Summary', 'TaskExtraction', 'Transcription', 
      'CollaborationAnalysis', 'ProductivityScore', 
      'ConflictDetection', 'SmartRecommendation'
    ], 
    required: true 
  },
  content: { type: String, required: true },
  score: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.AIInsight || mongoose.model<IAIInsight>('AIInsight', AIInsightSchema);
