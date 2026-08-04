import mongoose from 'mongoose';

const JobApplicationSchema = new mongoose.Schema({
    //Refs
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

    coverLetter: { type: String, trim: true },

    status: {
        type: String,
        enum: ['applied', 'under_review', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn'],
        default: 'applied',
    },

    statusHistory: [{
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, trim: true },
    }],

    notes: { type: String, trim: true }, // internal employer/recruiter notes, not visible to applicant

}, { timestamps: true });

// Prevent the same user applying to the same job twice
JobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
JobApplicationSchema.index({ applicant: 1, status: 1 });
JobApplicationSchema.index({ company: 1, status: 1 });

const JobApplication = mongoose.model('JobApplication', JobApplicationSchema);
export default JobApplication;