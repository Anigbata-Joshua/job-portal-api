import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: [true, 'Please provide a resume title'], trim: true },
    // e.g. "Frontend Developer Resume" — lets a seeker keep multiple tailored resumes

    fileUrl: { type: String, required: [true, 'Please upload a resume file'] },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'doc', 'docx'], required: true },
    fileHash: { type: String, required: true },

    isDefault: { type: Boolean, default: false },
    // which resume gets auto-selected when applying, if the seeker doesn't pick one

    summary: { type: String, trim: true },
    skills: [{ type: String, trim: true }],

    experience: [{
        title: { type: String, trim: true },
        company: { type: String, trim: true },
        startDate: { type: Date },
        endDate: { type: Date },
        current: { type: Boolean, default: false },
        description: { type: String, trim: true },
    }],

    education: [{
        institution: { type: String, trim: true },
        degree: { type: String, trim: true },
        fieldOfStudy: { type: String, trim: true },
        startDate: { type: Date },
        endDate: { type: Date },
    }],

}, { timestamps: true });

ResumeSchema.index({ user: 1 });

// Enforce "no duplicate resume submission" at the database level — this is
// the real guard against the race condition where two requests both pass
// the controller's findOne pre-check before either document exists.
ResumeSchema.index({ user: 1, title: 1 }, { unique: true });
ResumeSchema.index({ user: 1, fileHash: 1 }, { unique: true });

const Resume = mongoose.model('Resume', ResumeSchema);
export default Resume;