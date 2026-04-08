import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettingsDocument extends Document {
  key: string;
  settings: Record<string, unknown>;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettingsDocument>({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'global'
  },
  settings: {
    type: Schema.Types.Mixed,
    required: true,
    default: {}
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.model<ISystemSettingsDocument>('SystemSettings', systemSettingsSchema);
