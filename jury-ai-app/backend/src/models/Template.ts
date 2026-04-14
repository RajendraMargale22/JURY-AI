import mongoose, { Schema } from 'mongoose';
import { ITemplate } from '../types/interfaces';

const fieldSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'number', 'date', 'select']
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [String]
});

const templateSchema = new Schema<ITemplate>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  fields: [fieldSchema],
  downloads: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // File upload related fields
  filePath: {
    type: String,
    required: false
  },
  fileName: {
    type: String,
    required: false
  },
  fileSize: {
    type: Number,
    required: false
  },
  mimeType: {
    type: String,
    required: false
  },
  fileData: {
    type: Buffer,
    required: false,
    select: false // Exclude from default queries to avoid loading large binary data
  }
}, {
  timestamps: true
});

export default mongoose.model<ITemplate>('Template', templateSchema);
