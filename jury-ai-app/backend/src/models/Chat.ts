import mongoose, { Schema } from 'mongoose';
import { IChat } from '../types/interfaces';

const messageSchema = new Schema({
  sender: {
    type: String,
    required: true,
    enum: ['user', 'ai', 'lawyer']
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  attachments: [String]
});

const chatSchema = new Schema<IChat>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  lawyerId: {
    type: String,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: ['ai', 'lawyer']
  },
  title: {
    type: String,
    required: true
  },
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'closed', 'pending'],
    default: 'active'
  },
  category: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IChat>('Chat', chatSchema);
