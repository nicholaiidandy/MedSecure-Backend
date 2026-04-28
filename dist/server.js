import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
// Load env vars
dotenv.config();
// Import routes
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import medicalRecordRoutes from './routes/medicalRecordRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import securityEventRoutes from './routes/securityEventRoutes.js';
import vitalSignRoutes from './routes/vitalSignRoutes.js';
import userRoutes from './routes/userRoutes.js';
import ipfsLabFileRoutes from './routes/ipfsLabFileRoutes.js';
// Initialize app
const app = express();
// Connect to database
connectDatabase();
// Security middleware
app.use(helmet());
// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
// Body parser middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
});
// Stricter limit for auth attempts
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // strict limit for login attempts
    message: 'Too many login attempts, please try again later',
    skipSuccessfulRequests: true, // don't count successful requests
});
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/security-events', securityEventRoutes);
app.use('/api/vital-signs', vitalSignRoutes);
app.use('/api/users', userRoutes);
app.use('/api', ipfsLabFileRoutes);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'MedSecure API is running',
        timestamp: new Date().toISOString(),
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error',
    });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
