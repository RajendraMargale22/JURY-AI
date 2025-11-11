import mongoose, { Schema } from 'mongoose';
import { IDocument } from '../types/interfaces';

const analysisResultSchema = new Schema({
  documentType: String,
  keyPoints: [String],
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  suggestions: [String],
  summary: String
});

const documentSchema = new Schema<IDocument>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  analysisStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  analysisResult: analysisResultSchema
}, {
  timestamps: true
});

export default mongoose.model<IDocument>('Document', documentSchema);
