import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Search registered patients (Users role='patient')
// @route   GET /api/patients/search?q=
// @access  Private (Doctor/Admin)
export const searchPatients = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const orConditions: any[] = [
      { name: { $regex: query, $options: 'i' } },
      { patientId: { $regex: query, $options: 'i' } },
      { 'contactInfo.email': { $regex: query, $options: 'i' } },
    ];

    if (/^[0-9a-fA-F]{24}$/.test(query)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(query) });
    }

    const patients = await Patient.find({
      $or: orConditions,
    })
      .select('name patientId contactInfo.email _id')
      .limit(10);

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
export const getPatients = async (req: AuthRequest, res: Response) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private
export const getPatient = async (req: AuthRequest, res: Response) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Create patient
// @route   POST /api/patients
// @access  Private (Doctor, Admin)
export const createPatient = async (req: AuthRequest, res: Response) => {
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    // Parse dateOfBirth string to Date
    const patientData = { ...req.body };
    if (patientData.dateOfBirth && typeof patientData.dateOfBirth === 'string') {
      patientData.dateOfBirth = new Date(patientData.dateOfBirth);
      if (isNaN(patientData.dateOfBirth.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dateOfBirth format. Use YYYY-MM-DD.',
        });
      }
    }

    // Trim patientId
    if (patientData.patientId) {
      patientData.patientId = patientData.patientId.trim();
    }

    const patient = await Patient.create(patientData);

    if (req.user) {
      await logAudit(req.user, 'CREATE_PATIENT', 'patient', ipAddress, {
        resourceId: patient._id.toString(),
        metadata: { patientId: patient.patientId, name: patient.name },
      });
    }

    res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (error: any) {
    console.error('Create patient error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Patient ID already exists. Please use a unique Patient ID.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private (Doctor, Admin)
export const updatePatient = async (req: AuthRequest, res: Response) => {
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    if (req.user) {
      await logAudit(req.user, 'UPDATE_PATIENT', 'patient', ipAddress, {
        resourceId: patient._id.toString(),
        metadata: { patientId: patient.patientId },
      });
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (Admin)
export const deletePatient = async (req: AuthRequest, res: Response) => {
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    if (req.user) {
      await logAudit(req.user, 'DELETE_PATIENT', 'patient', ipAddress, {
        resourceId: patient._id.toString(),
        metadata: { patientId: patient.patientId },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient deleted',
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

