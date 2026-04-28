import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logSecurityEvent } from '../utils/securityLogger.js';
import { logAudit } from '../utils/auditLogger.js';
import { AuthRequest } from '../middleware/auth.js';

const JWT_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as jwt.SignOptions['expiresIn'],
  });
};

const setTokenCookie = (res: Response, token: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction || process.env.USE_HTTPS === 'true',
    sameSite: 'strict',
    maxAge: JWT_EXPIRE_MS,
    path: '/',
  });
};

const clearTokenCookie = (res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.USE_HTTPS === 'true',
    sameSite: 'strict',
    path: '/',
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      await logSecurityEvent('failed_login', ipAddress, `Failed login attempt for ${email}`, {
        email,
        severity: 'medium',
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.isLocked) {
      await logSecurityEvent('account_locked', ipAddress, `Login attempt on locked account: ${email}`, {
        userId: user._id.toString(),
        email,
        severity: 'high',
      });
      return res.status(403).json({
        success: false,
        message: 'Account is locked due to suspicious activity',
        isLocked: true,
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      user.failedAttempts += 1;

      if (user.failedAttempts >= 5) {
        user.isLocked = true;
        user.lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        await logSecurityEvent('account_locked', ipAddress, `Account locked after 5 failed attempts: ${email}`, {
          userId: user._id.toString(),
          email,
          severity: 'critical',
          actionTaken: 'Account locked for 24 hours',
        });

        return res.status(403).json({
          success: false,
          message: 'Account locked due to multiple failed login attempts',
          isLocked: true,
        });
      }

      await user.save();

      await logSecurityEvent('failed_login', ipAddress, `Failed login attempt ${user.failedAttempts}/5 for ${email}`, {
        userId: user._id.toString(),
        email,
        severity: user.failedAttempts >= 3 ? 'high' : 'medium',
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        failedAttempts: user.failedAttempts,
      });
    }

    // Successful login - reset failed attempts
    user.failedAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    await logAudit(user, 'LOGIN', 'auth', ipAddress);

    const token = generateToken(user._id.toString());
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Admin register user (any role)
// @route   POST /api/auth/admin/register
// @access  Private/Admin
export const adminRegisterUser = async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role',
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    if (req.user) {
      await logAudit(req.user, 'CREATE_USER', 'user', ipAddress, {
        resourceId: user._id.toString(),
        metadata: { createdUser: email, role },
      });
    }

    const token = generateToken(user._id.toString());
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Public patient self-register
// @route   POST /api/auth/register
// @access  Public
export const registerPatient = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'patient'
    });

    await logAudit(user, 'SELF_REGISTER', 'auth', ipAddress, {
      metadata: { selfRegistered: true }
    });

    const token = generateToken(user._id.toString());
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Patient register error:', error);
    res.status(500).json({
      success: false,
      message: (error as Error).message || 'Server error',
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      user: {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        lastLogin: user?.lastLogin,
        twoFactorEnabled: user?.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const user = await User.findById(req.user?._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit(user, 'UPDATE_PASSWORD', 'auth', ipAddress);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req: Request, res: Response) => {
  clearTokenCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

