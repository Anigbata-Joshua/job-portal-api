import Notification from '../models/notification.model.js';
import notificationTemplates from './notificationTemplates.js';

const createNotification = async ({ user, type, templateArg, relatedApplication, relatedJob, relatedInterview }) => {
    const { title, message } = notificationTemplates[type](templateArg);

    return Notification.create({
        user,
        type,
        title,
        message,
        relatedApplication,
        relatedJob,
        relatedInterview,
    });
};

export default createNotification;