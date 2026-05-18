import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['admin', 'doctor', 'nurse', 'patient'],
        default: 'patient',
    },
    lastLogin: {
        type: Date,
    },
    failedAttempts: {
        type: Number,
        default: 0,
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    lockedUntil: {
        type: Date,
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
export default mongoose.model('User', userSchema);
