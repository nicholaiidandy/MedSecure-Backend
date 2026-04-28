import { Response } from 'express';
import SecurityEvent from '../models/SecurityEvent.js';
import { AuthRequest } from '../middleware/auth.js';

// @desc    Get all security events
// @route   GET /api/security-events
// @access  Private (Admin)
export const getSecurityEvents = async (req: AuthRequest, res: Response) => {
  try {
    const { eventType, severity, startDate, endDate } = req.query;

    const filter: any = {};

    if (eventType) {
      filter.eventType = eventType;
    }

    if (severity) {
      filter.severity = severity;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate as string);
      }
    }

    const events = await SecurityEvent.find(filter)
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('Get security events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get security event stats
// @route   GET /api/security-events/stats
// @access  Private (Admin)
export const getSecurityStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEvents = await SecurityEvent.countDocuments();
    const todayEvents = await SecurityEvent.countDocuments({ timestamp: { $gte: today } });
    const criticalEvents = await SecurityEvent.countDocuments({ severity: 'critical' });
    const failedLogins = await SecurityEvent.countDocuments({ eventType: 'failed_login' });
    const lockedAccounts = await SecurityEvent.countDocuments({ eventType: 'account_locked' });

    const eventsByType = await SecurityEvent.aggregate([
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
    ]);

    const eventsBySeverity = await SecurityEvent.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalEvents,
        today: todayEvents,
        critical: criticalEvents,
        failedLogins,
        lockedAccounts,
        byType: eventsByType,
        bySeverity: eventsBySeverity,
      },
    });
  } catch (error) {
    console.error('Get security stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
