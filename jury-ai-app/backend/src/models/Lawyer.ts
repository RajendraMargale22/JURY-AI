import mongoose, { Schema } from 'mongoose';
import { ILawyer } from '../types/interfaces';

const lawyerSchema = new Schema<ILawyer>({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  specialization: [{
    type: String,
    required: true
  }],
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  barId: {
    type: String,
    required: true,
    unique: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalCases: {
    type: Number,
    default: 0
  },
  completedCases: {
    type: Number,
    default: 0
  },
  documents: {
    license: String,
    certificates: [String]
  },
  availability: {
    hours: {
      type: String,
      default: '9:00 AM - 5:00 PM'
    },
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }]
  },
  consultationFee: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model<ILawyer>('Lawyer', lawyerSchema);
