import SecurityEvent from '../models/SecurityEvent.js';

export const logSecurityEvent = async (
  eventType: 'failed_login' | 'account_locked' | 'suspicious_ip' | 'rate_limit' | 'unauthorized_access',
  ipAddress: string,
  description: string,
  options?: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    email?: string;
    actionTaken?: string;
    metadata?: Record<string, any>;
  }
) => {
  try {
    await SecurityEvent.create({
      eventType,
      severity: options?.severity || 'medium',
      user: options?.userId,
      email: options?.email,
      ipAddress,
      description,
      actionTaken: options?.actionTaken,
      metadata: options?.metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Security event log error:', error);
  }
};
