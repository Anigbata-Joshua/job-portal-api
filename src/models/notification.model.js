import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    type: {
        type: String,
        enum: [
            'application_status_change',
            'interview_scheduled',
            'interview_reminder',
            'new_applicant',
            'job_posted',
        ],
        required: true,
    },

    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    relatedApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'JobApplication' },
    relatedJob: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    relatedInterview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },

    isRead: { type: Boolean, default: false },

}, { timestamps: true });

NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;