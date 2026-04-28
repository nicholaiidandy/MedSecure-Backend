import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface ILabFile {
  filename: string;
  ipfsCid: string;
  hash: string;
  txHash: string;
  uploadedAt: Date;
}

export interface IMedicalRecord extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  date: Date;
  diagnosis: string;
  symptoms: string;
  prescription: string;
  labResults?: string;
  labFiles?: ILabFile[];
  blockchainHash: string;
  blockchainTimestamp: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  generateBlockchainHash(): string;
}

const medicalRecordSchema = new Schema<IMedicalRecord>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    diagnosis: {
      type: String,
      required: [true, 'Please provide diagnosis'],
    },
    symptoms: {
      type: String,
      required: true,
    },
    prescription: {
      type: String,
      required: true,
    },
    labResults: {
      type: String,
    },
    // New field for IPFS lab files
    labFiles: [
      {
        filename: { type: String, required: true },
        ipfsCid: { type: String, required: true },
        hash: { type: String, required: true },
        txHash: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      }
    ],
    blockchainHash: {
      type: String,
      required: true,
    },
    blockchainTimestamp: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate blockchain hash
medicalRecordSchema.methods.generateBlockchainHash = function (): string {
  const patientId = typeof this.patient === 'string'
    ? this.patient
    : this.patient?._id?.toString() || this.patient?.toString();
  const dateValue = this.date instanceof Date ? this.date.toISOString() : this.date;
  const data = `${patientId}-${this.diagnosis}-${this.symptoms}-${this.prescription}-${dateValue}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Auto-generate hash before saving
medicalRecordSchema.pre('save', function (next) {
  if (this.isNew) {
    this.blockchainHash = this.generateBlockchainHash();
    this.blockchainTimestamp = new Date();
  }
  next();
});

export default mongoose.model<IMedicalRecord>('MedicalRecord', medicalRecordSchema);
