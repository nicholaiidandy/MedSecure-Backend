# MedSecure Backend API

Backend API untuk sistem medical record MedSecure dengan MongoDB dan blockchain verification.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- MongoDB running locally atau MongoDB Atlas
- pnpm (recommended) atau npm

### Installation

```bash
cd backend
pnpm install
```

### Environment Setup

1. Copy `.env.example` ke `.env`:
```bash
cp .env.example .env
```

2. Update `.env` dengan konfigurasi Anda:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medsecure
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# IPFS provider (recommended)
PINATA_JWT=your-pinata-jwt
PINATA_API_URL=https://api.pinata.cloud/pinning/pinFileToIPFS

# Optional fallback provider
IPFS_API_URL=https://ipfs.infura.io:5001/api/v0
INFURA_PROJECT_ID=your-infura-project-id
INFURA_PROJECT_SECRET=your-infura-project-secret
```

### Running the Server

```bash
# Development mode with auto-reload
pnpm dev

# Production mode
pnpm build
pnpm start
```

Server akan berjalan di `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── patientController.ts
│   │   ├── medicalRecordController.ts
│   │   ├── auditLogController.ts
│   │   ├── securityEventController.ts
│   │   ├── vitalSignController.ts
│   │   └── userController.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Patient.ts
│   │   ├── MedicalRecord.ts
│   │   ├── AuditLog.ts
│   │   ├── SecurityEvent.ts
│   │   └── VitalSign.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── patientRoutes.ts
│   │   ├── medicalRecordRoutes.ts
│   │   ├── auditLogRoutes.ts
│   │   ├── securityEventRoutes.ts
│   │   ├── vitalSignRoutes.ts
│   │   └── userRoutes.ts
│   ├── middleware/
│   │   └── auth.ts              # JWT & role-based auth
│   ├── utils/
│   │   ├── auditLogger.ts
│   │   └── securityLogger.ts
│   └── server.ts                # Main entry point
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user (Admin only)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Update password

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get single patient
- `POST /api/patients` - Create patient (Doctor/Admin)
- `PUT /api/patients/:id` - Update patient (Doctor/Admin)
- `DELETE /api/patients/:id` - Delete patient (Admin)

### Medical Records
- `GET /api/medical-records` - Get all records (Admin)
- `GET /api/medical-records/patient/:patientId` - Get records by patient
- `POST /api/medical-records` - Create record (Doctor)
- `POST /api/medical-records/verify` - Verify blockchain hash

### Audit Logs
- `GET /api/audit-logs` - Get all audit logs (Admin)
- `GET /api/audit-logs/stats` - Get audit statistics (Admin)

### Security Events
- `GET /api/security-events` - Get all security events (Admin)
- `GET /api/security-events/stats` - Get security statistics (Admin)

### Vital Signs
- `GET /api/vital-signs` - Get all vital signs
- `GET /api/vital-signs/patient/:patientId` - Get vital signs by patient
- `POST /api/vital-signs` - Create vital sign (Nurse/Doctor)

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get single user (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)
- `PUT /api/users/:id/unlock` - Unlock user account (Admin)

## 🔒 Security Features

- JWT authentication
- Role-based access control (Admin, Doctor, Nurse)
- Password hashing with bcrypt
- Account lockout after 5 failed login attempts
- Rate limiting (100 requests per 15 minutes)
- Security event logging
- Audit trail for all actions
- Blockchain hashing for medical records
- CORS protection
- Helmet.js security headers

## 🧪 Demo Users

Setelah seeding, gunakan credentials berikut untuk testing:

- **Doctor**: nicholai@doctor.com / nicholai123
- **Nurse**: nurse@medical.com / nurse123
- **Admin**: admin@medical.com / admin123

## 🗄️ Database Models

### User
- Authentication & authorization
- Failed login tracking
- Account locking mechanism

### Patient
- Patient demographics
- Contact information
- Auto-generated patient ID

### MedicalRecord
- Diagnosis & treatment
- Blockchain hash verification
- Links to patient & doctor

### AuditLog
- Action tracking
- IP address logging
- Blockchain verification

### SecurityEvent
- Failed login attempts
- Account locks
- Suspicious activities

### VitalSign
- Blood pressure, heart rate, etc.
- Nurse recorded data
- Patient monitoring

## 🔗 Blockchain Verification

Medical records secara otomatis di-hash menggunakan SHA-256 saat dibuat. Hash ini disimpan dan dapat diverifikasi untuk memastikan data integrity.

```typescript
// Verify medical record
POST /api/medical-records/verify
{
  "recordId": "record_id_here"
}
```

## 📝 Audit & Security Logging

Setiap action penting secara otomatis di-log:

- User login/logout
- Patient CRUD operations
- Medical record creation
- User management actions
- Security events (failed logins, account locks, etc.)

## 🚨 Error Handling

API mengembalikan error dengan format:
```json
{
  "success": false,
  "message": "Error message here"
}
```

Status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## 📄 License

ISC
