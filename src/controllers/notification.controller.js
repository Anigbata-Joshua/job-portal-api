import Notification from '../models/notification.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// @route   GET /api/notifications
// @access  Any authenticated user — their own notifications
export const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    res.status(200).json({ success: true, count: notifications.length, unreadCount, notifications });
});

// @route   PATCH /api/notifications/:id/read
// @access  Owner only
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    if (!notification.user.equals(req.user._id)) {
        throw new ApiError(403, 'You can only manage your own notifications');
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, notification });
});

// @route   PATCH /api/notifications/read-all
// @access  Any authenticated user
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// @route   DELETE /api/notifications/:id
// @access  Owner only
export const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    if (!notification.user.equals(req.user._id)) {
        throw new ApiError(403, 'You can only manage your own notifications');
    }

    await notification.deleteOne();

    res.status(200).json({ success: true, message: 'Notification deleted' });
});