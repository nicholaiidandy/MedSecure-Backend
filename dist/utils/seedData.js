import dotenv from 'dotenv';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import MedicalRecord from '../models/MedicalRecord.js';
import { connectDatabase } from '../config/database.js';
import { generateBlockchainHash } from './hash.js';
dotenv.config();
const seedData = async () => {
    try {
        await connectDatabase();
        // Clear existing data
        await User.deleteMany({});
        await Patient.deleteMany({});
        await MedicalRecord.deleteMany({});
        console.log('📝 Cleared existing data');
        // =====================
        // CREATE USERS
        // =====================
        const doctor = await User.create({
            name: 'Dr. John Smith',
            email: 'doctor@medical.com',
            password: 'doctor123',
            role: 'doctor',
        });
        const nurse = await User.create({
            name: 'Nurse Sarah Johnson',
            email: 'nurse@medical.com',
            password: 'nurse123',
            role: 'nurse',
        });
        const admin = await User.create({
            name: 'Admin Michael Brown',
            email: 'admin@medical.com',
            password: 'admin123',
            role: 'admin',
        });
        console.log('✅ Created demo users');
        // =====================
        // CREATE PATIENTS
        // =====================
        const patients = await Patient.create([
            {
                patientId: 'P001',
                name: 'John Anderson',
                dateOfBirth: new Date('1985-05-15'),
                gender: 'male',
                bloodType: 'A+',
                contactInfo: {
                    phone: '+1234567890',
                    email: 'john.anderson@email.com',
                    address: '123 Main St, City',
                },
                lastVisit: new Date('2026-03-02'),
            },
            {
                patientId: 'P002',
                name: 'Sarah Williams',
                dateOfBirth: new Date('1990-08-22'),
                gender: 'female',
                bloodType: 'O+',
                contactInfo: {
                    phone: '+1234567891',
                    email: 'sarah.williams@email.com',
                    address: '456 Oak Ave, City',
                },
                lastVisit: new Date('2026-03-01'),
            },
            {
                patientId: 'P003',
                name: 'Michael Chen',
                dateOfBirth: new Date('1978-11-30'),
                gender: 'male',
                bloodType: 'B+',
                contactInfo: {
                    phone: '+1234567892',
                    email: 'michael.chen@email.com',
                    address: '789 Pine Rd, City',
                },
                lastVisit: new Date('2026-02-28'),
            },
        ]);
        console.log('✅ Created demo patients');
        // =====================
        // CREATE MEDICAL RECORDS
        // =====================
        const records = [
            {
                patient: patients[0]._id,
                doctor: doctor._id,
                date: new Date('2026-03-02'),
                diagnosis: 'Seasonal Allergies',
                symptoms: 'Sneezing, runny nose, watery eyes',
                prescription: 'Antihistamine 10mg once daily',
                labResults: 'Blood test: Normal',
            },
            {
                patient: patients[1]._id,
                doctor: doctor._id,
                date: new Date('2026-03-01'),
                diagnosis: 'Hypertension',
                symptoms: 'Elevated blood pressure, headaches',
                prescription: 'ACE inhibitor 5mg daily, reduce salt intake',
                labResults: 'BP: 145/95 mmHg',
            },
            {
                patient: patients[2]._id,
                doctor: doctor._id,
                date: new Date('2026-02-28'),
                diagnosis: 'Type 2 Diabetes',
                symptoms: 'Fatigue, increased thirst, frequent urination',
                prescription: 'Metformin 500mg twice daily, dietary changes',
                labResults: 'HbA1c: 7.2%, Fasting glucose: 145 mg/dL',
            },
        ];
        // =====================
        // ADD BLOCKCHAIN HASH
        // =====================
        const recordsWithHash = records.map((record) => ({
            ...record,
            blockchainHash: generateBlockchainHash(record),
        }));
        await MedicalRecord.create(recordsWithHash);
        console.log('✅ Created demo medical records');
        // =====================
        // SUCCESS MESSAGE
        // =====================
        console.log('\n🎉 Seeding completed successfully!');
        console.log('\n📋 Demo Credentials:');
        console.log('Doctor: doctor@medical.com / doctor123');
        console.log('Nurse: nurse@medical.com / nurse123');
        console.log('Admin: admin@medical.com / admin123');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};
seedData();
