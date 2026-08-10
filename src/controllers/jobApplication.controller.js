import JobApplication from '../models/job-application.model.js';
import Job from '../models/job.model.js';
import Resume from '../models/resume.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import createNotification from '../utils/createNotification.js';
// @route   POST /api/applications
// @access  Job Seeker only
export const applyToJob = asyncHandler(async (req, res) => {
    const { jobId, resumeId, coverLetter } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    if (job.status !== 'open') {
        throw new ApiError(400, 'This job is not currently accepting applications');
    }

    const resume = await Resume.findById(resumeId);
    if (!resume || !resume.user.equals(req.user._id)) {
        throw new ApiError(404, 'Resume not found');
    }

    const existing = await JobApplication.findOne({ job: jobId, applicant: req.user._id });
    if (existing) {
        throw new ApiError(409, 'You have already applied to this job');
    }

    const application = await JobApplication.create({
        job: job._id,
        applicant: req.user._id,
        resume: resume._id,
        company: job.company,
        coverLetter,
        statusHistory: [{ status: 'applied', changedBy: req.user._id }],
    });

    job.applicationsCount += 1;
    await job.save();

    res.status(201).json({ success: true, application });
});

// @route   GET /api/applications/my
// @access  Job Seeker only
export const getMyApplications = asyncHandler(async (req, res) => {
    const applications = await JobApplication.find({ applicant: req.user._id })
        .populate('job', 'title location employmentType status')
        .populate('company', 'name logo')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: applications.length, applications });
});

// @route   GET /api/applications/job/:jobId
// @access  Employer/recruiter belonging to the job's company
export const getApplicationsForJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    if (!job.company.equals(req.user.companyId)) {
        throw new ApiError(403, 'You do not have permission to view these applications');
    }

    const applications = await JobApplication.find({ job: job._id })
        .populate('applicant', 'name email')
        .populate('resume')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: applications.length, applications });
});

// @route   PATCH /api/applications/:id/status
// @access  Employer/recruiter belonging to the application's company
export const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { status, note } = req.body;

    const validStatuses = ['applied', 'under_review', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, 'Invalid status value');
    }

    const application = await JobApplication.findById(req.params.id);
    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    if (!application.company.equals(req.user.companyId)) {
        throw new ApiError(403, 'You do not have permission to update this application');
    }

    application.status = status;
    application.statusHistory.push({ status, changedBy: req.user._id, note });
    await application.save();

        await createNotification({
        user: application.applicant,
        type: 'application_status_change',
        templateArg: status,
        relatedApplication: application._id,
        relatedJob: application.job,
    });

    res.status(200).json({ success: true, application });
});

// @route   PATCH /api/applications/:id/withdraw
// @access  The applicant who owns this application
export const withdrawApplication = asyncHandler(async (req, res) => {
    const application = await JobApplication.findById(req.params.id);
    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    if (!application.applicant.equals(req.user._id)) {
        throw new ApiError(403, 'You can only withdraw your own applications');
    }

    application.status = 'withdrawn';
    application.statusHistory.push({ status: 'withdrawn', changedBy: req.user._id });
    await application.save();

    res.status(200).json({ success: true, application });
});