import mongoose, { Document, Schema } from 'mongoose';

export interface IVitalSign extends Document {
  patient: mongoose.Types.ObjectId;
  nurse: mongoose.Types.ObjectId;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  weight?: number;
  height?: number;
  notes?: string;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const vitalSignSchema = new Schema<IVitalSign>(
  {
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IVitalSign>('VitalSign', vitalSignSchema);
