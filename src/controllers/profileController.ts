import { Response } from 'express';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLogger.js';
import { withMetrics } from '../utils/queryMetrics.js';
import { logSecurityEvent } from '../utils/securityLogger.js';

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const user = await withMetrics(
      User.findById(userId).select('-password'),
      'User',
      'findById_profile'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        twoFactorEnabled: user.twoFactorEnabled,
        failedAttempts: user.failedAttempts,
        isLocked: user.isLocked,
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user password (self-service)
// @route   PUT /api/profile/password  
// @access  Private
export const updatePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await withMetrics(
      User.findById(userId).select('+password'),
      'User',
      'findById_change_password_profile'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        console.warn('Failed password change attempt by', user.email, ipAddress);
      
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit(user, 'UPDATE_OWN_PASSWORD', 'profile', ipAddress);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Toggle 2FA for current user
// @route   PUT /api/profile/2fa
// @access  Private
export const toggle2FA = async (req: AuthRequest, res: Response) => {
  const { enabled } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Enabled must be boolean'
      });
    }

    const user = await withMetrics(
      User.findByIdAndUpdate(
        userId,
        { twoFactorEnabled: enabled },
        { new: true, runValidators: true }
      ).select('-password'),
      'User',
      'findByIdAndUpdate_2fa'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await logAudit(user, 'TOGGLE_2FA', 'profile', ipAddress, {
      metadata: { twoFactorEnabled: enabled }
    });

    res.status(200).json({
      success: true,
      data: {
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('Toggle 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
