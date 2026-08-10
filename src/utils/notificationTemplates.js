// Centralized notification content — this defines what each
// notification type says, so controllers don't repeat/duplicate strings.
const notificationTemplates = {
    application_status_change: (status) => ({
        title: 'Application Status Updated',
        message: `Your application status has changed to "${status}".`,
    }),

    interview_scheduled: () => ({
        title: 'Interview Scheduled',
        message: 'An interview has been scheduled for your application.',
    }),

    interview_reminder: () => ({
        title: 'Interview Reminder',
        message: 'You have an upcoming interview soon.',
    }),

    new_applicant: (jobTitle) => ({
        title: 'New Applicant',
        message: `A new candidate has applied to "${jobTitle}".`,
    }),

    job_posted: (jobTitle) => ({
        title: 'Job Posted',
        message: `Your job posting "${jobTitle}" is now live.`,
    }),
};

export default notificationTemplates;
