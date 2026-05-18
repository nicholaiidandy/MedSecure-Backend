import User from '../models/User.js';
import { logAudit } from '../utils/auditLogger.js';
import jwt from 'jsonwebtoken';
import { withMetrics } from '../utils/queryMetrics.js';
// Local generateToken
const generateToken = (id) => {
    const expiresIn = (process.env.JWT_EXPIRE || '7d');
    return jwt.sign({ id }, process.env.JWT_SECRET || 'default-secret', {
        expiresIn,
    });
};
// @desc    Admin create doctor
// @route   POST /api/users/create-doctor
// @access  Private/Admin
export const createDoctor = async (req, res) => {
    const { name, email, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    try {
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password',
            });
        }
        const userExists = await withMetrics(User.findOne({ email }), 'User', 'findOne_check');
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists',
            });
        }
        const doctor = await withMetrics(User.create({
            name,
            email,
            password,
            role: 'doctor'
        }), 'User', 'create');
        await logAudit(req.user, 'CREATE_DOCTOR', 'user', ipAddress, {
            resourceId: doctor._id.toString(),
            metadata: { email, role: 'doctor' }
        });
        const token = generateToken(doctor._id.toString());
        res.status(201).json({
            success: true,
            doctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                role: doctor.role,
            },
            token,
        });
    }
    catch (error) {
        console.error('Create doctor error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
// Get all users
export const getUsers = async (req, res) => {
    try {
        const users = await withMetrics(User.find().select('-password').sort({ createdAt: -1 }), 'User', 'find_all');
        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
// Get single user
export const getUser = async (req, res) => {
    try {
        const user = await withMetrics(User.findById(req.params.id).select('-password'), 'User', 'findById');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
// Update user
export const updateUser = async (req, res) => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    try {
        const { password, ...updateData } = req.body;
        const user = await withMetrics(User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        }).select('-password'), 'User', 'findByIdAndUpdate');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        if (req.user) {
            await logAudit(req.user, 'UPDATE_USER', 'user', ipAddress, {
                resourceId: user._id.toString(),
                metadata: { email: user.email },
            });
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
// Delete user
export const deleteUser = async (req, res) => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    try {
        const user = await withMetrics(User.findByIdAndDelete(req.params.id), 'User', 'findByIdAndDelete');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        if (req.user) {
            await logAudit(req.user, 'DELETE_USER', 'user', ipAddress, {
                resourceId: user._id.toString(),
                metadata: { email: user.email },
            });
        }
        res.status(200).json({
            success: true,
            message: 'User deleted',
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
// Unlock user account
export const unlockUser = async (req, res) => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    try {
        const user = await User.findByIdAndUpdate(req.params.id, {
            isLocked: false,
            failedAttempts: 0,
            lockedUntil: null,
        }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        if (req.user) {
            await logAudit(req.user, 'UNLOCK_USER', 'user', ipAddress, {
                resourceId: user._id.toString(),
                metadata: { email: user.email },
            });
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error('Unlock user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
