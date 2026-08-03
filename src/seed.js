import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDatabase, closeDatabase } from './config/db.js';
import User from './models/user.model.js';

async function seedDatabase() {
    try {
        await connectDatabase();

        console.log('🌱 Seeding database...');

        // Check if users already exist
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log(`📊 Database already has ${userCount} users.`);
            console.log('✅ To view your data, go to MongoDB Atlas → Browse Collections');
            await closeDatabase();
            return;
        }

        // Create a test user
        const testUser = await User.create({
            name: 'Test Job Seeker',
            email: 'test@example.com',
            password: 'Test123456',
            role: 'job_seeker',
        });

        console.log('✅ Test user created successfully:');
        console.log(`   ID: ${testUser._id}`);
        console.log(`   Name: ${testUser.name}`);
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Role: ${testUser.role}`);

        // Create a second user (employer)
        const employer = await User.create({
            name: 'Test Employer',
            email: 'employer@example.com',
            password: 'Test123456',
            role: 'job_seeker', // Will be upgraded when they create a company
        });

        console.log('✅ Employer user created successfully:');
        console.log(`   ID: ${employer._id}`);
        console.log(`   Name: ${employer.name}`);
        console.log(`   Email: ${employer.email}`);
        console.log(`   Role: ${employer.role}`);

        console.log('\n📊 Database seeded successfully!');
        console.log('🔗 Go to MongoDB Atlas → Browse Collections to see your data');

        await closeDatabase();
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        await closeDatabase();
        process.exit(1);
    }
}

seedDatabase();