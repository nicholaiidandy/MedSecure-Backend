import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  patientId: string;
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodType: string;
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  lastVisit?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPatient>('Patient', patientSchema);
