import mongoose, { Document, Schema } from 'mongoose';

export interface ISecurityEvent extends Document {
  eventType: 'failed_login' | 'account_locked' | 'suspicious_ip' | 'rate_limit' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user?: mongoose.Types.ObjectId;
  email?: string;
  ipAddress: string;
  description: string;
  actionTaken?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const securityEventSchema = new Schema<ISecurityEvent>(
  {
    eventType: {
      type: String,
      enum: ['failed_login', 'account_locked', 'suspicious_ip', 'rate_limit', 'unauthorized_access'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    email: {
      type: String,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    actionTaken: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISecurityEvent>('SecurityEvent', securityEventSchema);
