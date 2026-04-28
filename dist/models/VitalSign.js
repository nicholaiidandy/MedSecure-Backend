import mongoose, { Schema } from 'mongoose';
const vitalSignSchema = new Schema({
    patient: {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    nurse: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bloodPressure: {
        systolic: {
            type: Number,
            required: true,
        },
        diastolic: {
            type: Number,
            required: true,
        },
    },
    heartRate: {
        type: Number,
        required: true,
    },
    temperature: {
        type: Number,
        required: true,
    },
    oxygenSaturation: {
        type: Number,
        required: true,
    },
    respiratoryRate: {
        type: Number,
        required: true,
    },
    weight: {
        type: Number,
    },
    height: {
        type: Number,
    },
    notes: {
        type: String,
    },
    recordedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
export default mongoose.model('VitalSign', vitalSignSchema);
