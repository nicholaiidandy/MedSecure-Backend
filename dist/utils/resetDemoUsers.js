import dotenv from 'dotenv';
import { connectDatabase } from '../config/database.js';
import User from '../models/User.js';
dotenv.config();
const demoUsers = [
    {
        previousEmail: 'doctor@medical.com',
        email: 'nicholai@doctor.com',
        name: 'Dr. Nicholai',
        role: 'doctor',
        password: 'nicholai123',
    },
    {
        email: 'nurse@medical.com',
        name: 'Nurse Sarah Johnson',
        role: 'nurse',
        password: 'nurse123',
    },
    {
        email: 'admin@medical.com',
        name: 'Admin Michael Brown',
        role: 'admin',
        password: 'admin123',
    },
];
const resetDemoUsers = async () => {
    try {
        await connectDatabase();
        for (const demoUser of demoUsers) {
            let user = await User.findOne({ email: demoUser.email });
            if (!user && demoUser.previousEmail) {
                user = await User.findOne({ email: demoUser.previousEmail });
            }
            if (!user) {
                user = new User({
                    name: demoUser.name,
                    email: demoUser.email,
                    password: demoUser.password,
                    role: demoUser.role,
                });
            }
            else {
                user.name = demoUser.name;
                user.email = demoUser.email;
                user.role = demoUser.role;
                user.password = demoUser.password;
            }
            user.failedAttempts = 0;
            user.isLocked = false;
            user.lockedUntil = undefined;
            user.twoFactorEnabled = false;
            await user.save();
            console.log(`✅ Reset ${demoUser.email}`);
        }
        console.log('\nDemo users are ready:');
        console.log('Doctor: nicholai@doctor.com / nicholai123');
        console.log('Nurse: nurse@medical.com / nurse123');
        console.log('Admin: admin@medical.com / admin123');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Reset demo users failed:', error);
        process.exit(1);
    }
};
resetDemoUsers();
