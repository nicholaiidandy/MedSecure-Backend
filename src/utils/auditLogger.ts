import AuditLog from '../models/AuditLog.js';
import { IUser } from '../models/User.js';

export const logAudit = async (
  user: IUser,
  action: string,
  resource: string,
  ipAddress: string,
  options?: {
    resourceId?: string;
    status?: 'success' | 'failed';
    metadata?: Record<string, any>;
  }
) => {
  try {
    await AuditLog.create({
      user: user._id,
      action,
      resource,
      resourceId: options?.resourceId,
      ipAddress,
      status: options?.status || 'success',
      metadata: options?.metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};
