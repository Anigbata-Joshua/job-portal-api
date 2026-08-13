// cleanup.js — run once, then delete this file
import { connectDatabase, closeDatabase } from './config/db.js';
import Company from './models/company.model.js';
import Job from './models/job.model.js';
import Resume from './models/resume.model.js';
import JobApplication from './models/job-application.model.js';
import Interview from './models/interview.model.js';
import SavedJob from './models/saved-jobs.model.js';
import Notification from './models/notification.model.js';

await connectDatabase();

const results = await Promise.all([
    Company.deleteMany({}),
    Job.deleteMany({}),
    Resume.deleteMany({}),
    JobApplication.deleteMany({}),
    Interview.deleteMany({}),
    SavedJob.deleteMany({}),
    Notification.deleteMany({}),
]);

console.log('🗑️  Cleared:', {
    companies: results[0].deletedCount,
    jobs: results[1].deletedCount,
    resumes: results[2].deletedCount,
    applications: results[3].deletedCount,
    interviews: results[4].deletedCount,
    savedJobs: results[5].deletedCount,
    notifications: results[6].deletedCount,
});

await closeDatabase();