import VitalSign from '../models/VitalSign.js';
import Patient from '../models/Patient.js';
import { logAudit } from '../utils/auditLogger.js';
// @desc    Get vital signs by patient
// @route   GET /api/vital-signs/patient/:patientId
// @access  Private
export const getVitalSignsByPatient = async (req, res) => {
    try {
        const vitalSigns = await VitalSign.find({ patient: req.params.patientId })
            .populate('nurse', 'name email')
            .sort({ recordedAt: -1 });
        res.status(200).json({
            success: true,
            count: vitalSigns.length,
            data: vitalSigns,
        });
    }
    catch (error) {
        console.error('Get vital signs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
// @desc    Create vital sign record
// @route   POST /api/vital-signs
// @access  Private (Nurse)
export const createVitalSign = async (req, res) => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    try {
        const { patientId, bloodPressure, heartRate, temperature, oxygenSaturation, respiratoryRate, weight, height, notes } = req.body;
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }
        const vitalSign = await VitalSign.create({
            patient: patientId,
            nurse: req.user?._id,
            bloodPressure,
            heartRate,
            temperature,
            oxygenSaturation,
            respiratoryRate,
            weight,
            height,
            notes,
        });
        if (req.user) {
            await logAudit(req.user, 'CREATE_VITAL_SIGN', 'vital_sign', ipAddress, {
                resourceId: vitalSign._id.toString(),
                metadata: { patientId: patient.patientId },
            });
        }
        const populatedVitalSign = await VitalSign.findById(vitalSign._id)
            .populate('patient', 'name patientId')
            .populate('nurse', 'name email');
        res.status(201).json({
            success: true,
            data: populatedVitalSign,
        });
    }
    catch (error) {
        console.error('Create vital sign error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
// @desc    Get all vital signs
// @route   GET /api/vital-signs
// @access  Private
export const getAllVitalSigns = async (req, res) => {
    try {
        const vitalSigns = await VitalSign.find()
            .populate('patient', 'name patientId')
            .populate('nurse', 'name email')
            .sort({ recordedAt: -1 })
            .limit(50);
        res.status(200).json({
            success: true,
            count: vitalSigns.length,
            data: vitalSigns,
        });
    }
    catch (error) {
        console.error('Get all vital signs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
