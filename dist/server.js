import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { httpRequestDurationSeconds, httpRequestsTotal, register } from './utils/metrics.js';
import { setupMongooseMetrics } from './utils/queryMetrics.js';
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
import profileRoutes from './routes/profileRoutes.js';
// Initialize app
const app = express();
// Avoid framework fingerprinting in HTTP responses.
app.disable('x-powered-by');
// Trust Nginx reverse proxy so secure cookies and client IPs behave correctly
app.set('trust proxy', 1);
// Connect to database
connectDatabase();
// Setup MongoDB query metrics tracking
setupMongooseMetrics();
// Security middleware
app.use(helmet());
// Cookie parser middleware (required before auth routes)
app.use(cookieParser());
// CORS configuration — allow multiple origins for local dev
const allowedOrigins = [
    'http://localhost:5173', // Vite dev server (HTTP behind Nginx)
    'https://localhost:5173',
    'https://localhost',
    'https://medsecure.com',
    'https://www.medsecure.com',
    'https://medsecure.local',
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, same-origin, etc.)
        if (!origin)
            return callback(null, true);
        // In development, be more permissive
        if (process.env.NODE_ENV === 'development') {
            // Allow any localhost (http or https) or medsecure domain
            if (origin.startsWith('http://localhost') ||
                origin.startsWith('https://localhost') ||
                origin.includes('medsecure')) {
                return callback(null, true);
            }
        }
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
// Body parser middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
// Prometheus HTTP request metrics middleware
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
        const statusCode = String(res.statusCode);
        const routePath = req.route?.path
            ? `${req.baseUrl || ''}${req.route.path}`
            : req.path.replace(/\/[0-9a-fA-F]{24}(?=\/|$)/g, '/:id');
        httpRequestDurationSeconds.labels(req.method, routePath, statusCode).observe(durationSeconds);
        httpRequestsTotal.labels(req.method, routePath, statusCode).inc();
    });
    next();
});
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
app.use('/api/profile', profileRoutes);
app.use('/api', ipfsLabFileRoutes);
// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
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
