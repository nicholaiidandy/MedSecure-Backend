import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  // Try Authorization header first (backward compatibility)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && (req as any).cookies?.token) {
    token = (req as any).cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as { id: string };
    req.user = (await User.findById(decoded.id)) ?? undefined;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (req.user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked',
      });
    }

    // Tambahkan log user dan role untuk debug
    console.log('[AUTH] User:', req.user._id, 'Role:', req.user.role, 'Email:', req.user.email);

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user?.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

export const adminOnly = authorize('admin');

