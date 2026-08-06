// controllers/interview.controller.js
import Interview from '../models/interview.model.js';
import JobApplication from '../models/job-application.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// @route   POST /api/interviews
// @access  Employer/recruiter belonging to the application's company
export const scheduleInterview = asyncHandler(async (req, res) => {
    const { applicationId, scheduledAt, duration, mode, location, round, interviewers } = req.body;

    const application = await JobApplication.findById(applicationId);
    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    if (!application.company.equals(req.user.companyId)) {
        throw new ApiError(403, 'You do not have permission to schedule an interview for this application');
    }

    // ⬇️ NEW: block a duplicate *active* interview for the same round
    const existingActive = await Interview.findOne({
        application: application._id,
        round: round || 'screening',
        status: 'scheduled',
    });

    if (existingActive) {
        throw new ApiError(409, 'An active interview for this round has already been scheduled');
    }
    // ⬆️ NEW ends here

    const interview = await Interview.create({
        application: application._id,
        job: application.job,
        candidate: application.applicant,
        company: application.company,
        scheduledBy: req.user._id,
        scheduledAt,
        duration,
        mode,
        location,
        round,
        interviewers,
    });

    application.status = 'interview';
    application.statusHistory.push({
        status: 'interview',
        changedBy: req.user._id,
        note: `Interview scheduled (${round || 'screening'} round)`,
    });
    await application.save();

    res.status(201).json({ success: true, interview });
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
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, 'Invalid status value');
    }

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
        throw new ApiError(404, 'Interview not found');
    }

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
    if (!interview) {
        throw new ApiError(404, 'Interview not found');
    }

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