import { Document, Types } from 'mongoose';
import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: any;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'lawyer' | 'admin';
  avatar?: string;
  phone?: string;
  bio?: string;
  isVerified: boolean;
  isEmailVerified: boolean;
  verificationToken?: string;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  accountStatus?: 'active' | 'inactive' | 'suspended';
  // Lawyer specific fields
  specialization?: string[];
  experience?: number;
  barNumber?: string;
  city?: string;
  consultationFee?: number;
  languages?: string[];
  lawyerVerificationStatus?: 'pending' | 'verified' | 'rejected' | 'suspended';
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  profile?: {
    phone?: string;
    address?: string;
    bio?: string;
  };
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ILawyer extends Document {
  userId: string;
  specialization: string[];
  experience: number;
  barId: string;
  verified: boolean;
  rating: number;
  totalCases: number;
  completedCases: number;
  documents: {
    license?: string;
    certificates?: string[];
  };
  availability: {
    hours: string;
    days: string[];
  };
  consultationFee: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat extends Document {
  userId: string;
  lawyerId?: string;
  type: 'ai' | 'lawyer';
  title: string;
  messages: {
    sender: 'user' | 'ai' | 'lawyer';
    message: string;
    timestamp: Date;
    attachments?: string[];
  }[];
  status: 'active' | 'closed' | 'pending';
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITemplate extends Document {
  name: string;
  title: string;
  description: string;
  category: string;
  content: string;
  fields: {
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }[];
  downloads: number;
  createdBy: Types.ObjectId;
  isActive: boolean;
  // File upload related fields
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocument extends Document {
  user: Types.ObjectId;
  userId: string;
  filename: string;
  originalName: string;
  type: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  analysisResult?: {
    documentType: string;
    keyPoints: string[];
    riskLevel: 'low' | 'medium' | 'high';
    suggestions: string[];
    summary: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnalytics extends Document {
  userId?: string;
  eventType: string;
  eventData: any;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
}
