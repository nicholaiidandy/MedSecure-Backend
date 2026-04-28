import SecurityEvent from '../models/SecurityEvent.js';
export const logSecurityEvent = async (eventType, ipAddress, description, options) => {
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
    }
    catch (error) {
        console.error('Security event log error:', error);
    }
};
