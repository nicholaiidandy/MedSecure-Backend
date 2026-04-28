import mongoose, { Schema } from 'mongoose';
const auditLogSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    resource: {
        type: String,
        required: true,
    },
    resourceId: {
        type: String,
    },
    ipAddress: {
        type: String,
        required: true,
    },
    userAgent: {
        type: String,
    },
    status: {
        type: String,
        enum: ['success', 'failed'],
        default: 'success',
    },
    blockchainHash: {
        type: String,
    },
    metadata: {
        type: Schema.Types.Mixed,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
export default mongoose.model('AuditLog', auditLogSchema);
