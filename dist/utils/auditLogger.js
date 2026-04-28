import AuditLog from '../models/AuditLog.js';
export const logAudit = async (user, action, resource, ipAddress, options) => {
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
    }
    catch (error) {
        console.error('Audit log error:', error);
    }
};
