import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Please provide a job title'], trim: true },
    description: { type: String, required: [true, 'Please provide a job description'] },
    requirements: [{ type: String, trim: true }],
    responsibilities: [{ type: String, trim: true }],

    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    location: { type: String, required: [true, 'Please provide a location'], trim: true },
    workMode: { type: String, enum: ['on-site', 'remote', 'hybrid'], required: true },
    employmentType: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary'],
        required: true,
    },

    salaryMin: { type: Number },
    salaryMax: { type: Number },    
    currency: { type: String, enum: ['NGN', 'USD'], default: 'NGN' },
    experienceLevel: {
        type: String,
        enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
        required: true,
    },
    skills: [{ type: String, trim: true }],

    status: { type: String, enum: ['open', 'closed', 'draft'], default: 'draft' },
    applicationDeadline: { type: Date },

    applicationsCount: { type: Number, default: 0 },
}, { timestamps: true });

// Useful indexes for search/filtering
JobSchema.index({ title: 'text', description: 'text', skills: 'text' });
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ company: 1 });

const Job = mongoose.model('Job', JobSchema);
export default Job;