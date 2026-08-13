import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDatabase, closeDatabase } from './config/db.js';
import User from './models/user.model.js';

// Test users to seed. Passwords must satisfy the model's password
// validator: at least one uppercase letter, one digit, and one
// special character.
const testUsers = [
    {
        name: 'Test Job Seeker',
        email: 'test@example.com',
        password: 'Test123456!',
        role: 'job_seeker',
    },
    {
        name: 'Test Employer',
        email: 'employer@example.com',
        password: 'Test123456!',
        role: 'job_seeker', // Will be upgraded to 'employer' when they create a company
    },
];

async function seedDatabase() {
    try {
        await connectDatabase();

        console.log('🌱 Seeding database...');

        for (const userData of testUsers) {
            const existing = await User.findOne({ email: userData.email });

            if (existing) {
                console.log(`⏭️  Skipped ${userData.email} — already exists (ID: ${existing._id})`);
                continue;
            }

            const user = await User.create(userData);
            console.log(`✅ Created ${user.role}:`);
            console.log(`   ID: ${user._id}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Email: ${user.email}`);
        }

        console.log('\n📊 Seeding complete!');
        console.log('🔗 Go to MongoDB Atlas → Browse Collections to see your data');

        await closeDatabase();
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        await closeDatabase();
        process.exit(1);
    }
}

seedDatabase();