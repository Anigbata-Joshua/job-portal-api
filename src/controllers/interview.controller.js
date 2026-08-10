// controllers/interview.controller.js
import mongoose from 'mongoose';
import Interview from '../models/interview.model.js';
import JobApplication from '../models/job-application.model.js';
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import createNotification from '../utils/createNotification.js';

// @route   POST /api/interviews
// @access  Employer/recruiter belonging to the application's company
export const scheduleInterview = asyncHandler(async (req, res) => {
    const { applicationId, scheduledAt, duration, mode, location, round, interviewers } = req.body;

    const application = await JobApplication.findById(applicationId);
    // Ensure the application actually exists
    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    // Guard against a recruiter from one company scheduling an interview
    // for an application that belongs to a different company
    if (!application.company.equals(req.user.companyId)) {
        throw new ApiError(403, 'You do not have permission to schedule an interview for this application');
    }

    // Check if the application is inactive (withdrawn or rejected)
    if (['withdrawn', 'rejected'].includes(application.status)) {
        throw new ApiError(400, `Cannot schedule interview for a ${application.status} application`);
    }

    // Validate that all interviewers exist
    if (interviewers && interviewers.length > 0) {
        const uniqueInterviewers = [...new Set(interviewers)];
        const count = await User.countDocuments({ _id: { $in: uniqueInterviewers } });
        if (count !== uniqueInterviewers.length) {
            throw new ApiError(400, 'One or more interviewer IDs are invalid');
        }
    }

    const scheduledDate = new Date(scheduledAt);
    const durationMinutes = duration || 30;
    const endDate = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000);

    // Check for candidate scheduling conflicts
    const candidateCollision = await Interview.findOne({
        candidate: application.applicant,
        status: 'scheduled',
        $expr: {
            $and: [
                { $lt: ['$scheduledAt', endDate] },
                { $gt: [{ $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] }, scheduledDate] }
            ]
        }
    });
    if (candidateCollision) {
        throw new ApiError(409, 'Candidate has an overlapping interview scheduled during this slot');
    }

    // Check for interviewer scheduling conflicts
    if (interviewers && interviewers.length > 0) {
        const interviewerCollision = await Interview.findOne({
            interviewers: { $in: interviewers },
            status: 'scheduled',
            $expr: {
                $and: [
                    { $lt: ['$scheduledAt', endDate] },
                    { $gt: [{ $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] }, scheduledDate] }
                ]
            }
        });
        if (interviewerCollision) {
            throw new ApiError(409, 'One or more interviewers have an overlapping interview scheduled during this slot');
        }
    }

    // Block a duplicate *active* interview for the same round
    const existingActive = await Interview.findOne({
        application: application._id,
        round: round || 'screening',
        status: 'scheduled',
    });

    // Prevent double-booking: if there's already a "scheduled" interview
    // for this round, don't allow another one to be created
    if (existingActive) {
        throw new ApiError(409, 'An active interview for this round has already been scheduled');
    }

    // Transaction execution
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [interview] = await Interview.create([{
            application: application._id,
            job: application.job,
            candidate: application.applicant,
            company: application.company,
            scheduledBy: req.user._id,
            scheduledAt: scheduledDate,
            duration: durationMinutes,
            mode,
            location,
            round,
            interviewers,
        }], { session });

        application.status = 'interview';
        application.statusHistory.push({
            status: 'interview',
            changedBy: req.user._id,
            note: `Interview scheduled (${round || 'screening'} round)`,
        });
        await application.save({ session });

        // Create notification
        await createNotification({
            user: application.applicant,
            type: 'interview_scheduled',
            relatedApplication: application._id,
            relatedInterview: interview._id,
            relatedJob: application.job,
        });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ success: true, interview });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// @route   GET /api/interviews/my
// @access  Job Seeker only — interviews scheduled for them
export const getMyInterviews = asyncHandler(async (req, res) => {
    const interviews = await Interview.find({ candidate: req.user._id })
        .populate('job', 'title location')
        .populate('company', 'name logo')
        .sort({ scheduledAt: 1 });

    res.status(200).json({ success: true, count: interviews.length, interviews });
});

// @route   GET /api/interviews/company
// @access  Employer/recruiter — all interviews for their company
export const getCompanyInterviews = asyncHandler(async (req, res) => {
    // A user without a companyId (e.g. not yet assigned/onboarded) has no
    // company-scoped interviews to fetch, so reject early
    if (!req.user.companyId) {
        throw new ApiError(400, 'You do not belong to a company');
    }

    const interviews = await Interview.find({ company: req.user.companyId })
        .populate('candidate', 'name email')
        .populate('job', 'title')
        .sort({ scheduledAt: 1 });

    res.status(200).json({ success: true, count: interviews.length, interviews });
});

// @route   PATCH /api/interviews/:id/status
// @access  Employer/recruiter belonging to the interview's company
export const updateInterviewStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const validStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'];
    // Reject any status value that isn't one of the allowed enum values,
    // to keep the interview.status field from drifting out of sync with the schema
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, 'Invalid status value');
    }

    const interview = await Interview.findById(req.params.id);
    // Make sure the interview being updated actually exists
    if (!interview) {
        throw new ApiError(404, 'Interview not found');
    }

    // Only allow recruiters/employers from the owning company to change status
    if (!interview.company.equals(req.user.companyId)) {
        throw new ApiError(403, 'You do not have permission to update this interview');
    }

    interview.status = status;
    await interview.save();

    res.status(200).json({ success: true, interview });
});

// @route   PATCH /api/interviews/:id/feedback
// @access  Employer/recruiter belonging to the interview's company
export const submitFeedback = asyncHandler(async (req, res) => {
    const { rating, comments, recommendation } = req.body;

    const interview = await Interview.findById(req.params.id);
    // Can't attach feedback to an interview that doesn't exist
    if (!interview) {
        throw new ApiError(404, 'Interview not found');
    }

    // Restrict feedback submission to recruiters/employers belonging to
    // the same company the interview was scheduled under
    if (!interview.company.equals(req.user.companyId)) {
        throw new ApiError(403, 'You do not have permission to submit feedback for this interview');
    }

    interview.feedback = {
        rating,
        comments,
        recommendation,
        submittedBy: req.user._id,
    };

    // Submitting feedback implies the interview happened — mark it completed
    // unless it's already been explicitly cancelled/no-showed.
    if (interview.status === 'scheduled') {
        interview.status = 'completed';
    }

    await interview.save();

    res.status(200).json({ success: true, interview });
});