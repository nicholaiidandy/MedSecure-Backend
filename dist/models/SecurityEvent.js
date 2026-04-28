import mongoose, { Schema } from 'mongoose';
const securityEventSchema = new Schema({
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
}, {
    timestamps: true,
});
export default mongoose.model('SecurityEvent', securityEventSchema);
