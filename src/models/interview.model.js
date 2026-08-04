import mongoose from 'mongoose';

const InterviewSchema = new mongoose.Schema({
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'JobApplication', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    scheduledAt: { type: Date, required: [true, 'Please provide an interview date/time'] },
    duration: { type: Number, default: 30 }, // in minutes

    mode: { type: String, enum: ['in-person', 'video', 'phone'], required: true, },
    location: { type: String, trim: true }, // physical address OR video link, depending on mode

    round: { type: String, enum: ['screening', 'technical', 'hr', 'final'], default: 'screening', },

    status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'], default: 'scheduled', },

    interviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        comments: { type: String, trim: true },
        recommendation: { type: String, enum: ['proceed', 'reject', 'hold'] },
        submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },

}, { timestamps: true });

InterviewSchema.index({ application: 1 });
InterviewSchema.index({ candidate: 1, status: 1 });
InterviewSchema.index({ scheduledAt: 1 });

const Interview = mongoose.model('Interview', InterviewSchema);
export default Interview;