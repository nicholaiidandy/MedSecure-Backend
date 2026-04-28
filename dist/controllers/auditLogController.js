import AuditLog from '../models/AuditLog.js';
// @desc    Get all audit logs
// @route   GET /api/audit-logs
// @access  Private (Admin)
export const getAuditLogs = async (req, res) => {
    try {
        const { user, action, startDate, endDate } = req.query;
        const filter = {};
        if (user) {
            filter.user = user;
        }
        if (action) {
            filter.action = action;
        }
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                filter.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.timestamp.$lte = new Date(endDate);
            }
        }
        const logs = await AuditLog.find(filter)
            .populate('user', 'name email role')
            .sort({ timestamp: -1 })
            .limit(100);
        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs,
        });
    }
    catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
// @desc    Get audit log stats
// @route   GET /api/audit-logs/stats
// @access  Private (Admin)
export const getAuditStats = async (req, res) => {
    try {
        const totalLogs = await AuditLog.countDocuments();
        const successCount = await AuditLog.countDocuments({ status: 'success' });
        const failedCount = await AuditLog.countDocuments({ status: 'failed' });
        const actionStats = await AuditLog.aggregate([
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
        ]);
        res.status(200).json({
            success: true,
            data: {
                total: totalLogs,
                success: successCount,
                failed: failedCount,
                byAction: actionStats,
            },
        });
    }
    catch (error) {
        console.error('Get audit stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
