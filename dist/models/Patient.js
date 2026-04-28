import mongoose, { Schema } from 'mongoose';
const patientSchema = new Schema({
    patientId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide patient name'],
        trim: true,
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Please provide date of birth'],
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true,
    },
    bloodType: {
        type: String,
        required: [true, 'Please provide blood type'],
    },
    contactInfo: {
        phone: String,
        email: String,
        address: String,
    },
    lastVisit: {
        type: Date,
    },
}, {
    timestamps: true,
});
export default mongoose.model('Patient', patientSchema);
