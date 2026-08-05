import Job from '../models/job.model.js';
import Company from '../models/company.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

//  Authenticated employer/recruiter, belonging to a VERIFIED company
export const createJob = asyncHandler(async (req, res) => {

    // Check if an employer belongs to a company before posting their jobs
    if (!req.user.companyId) {
        throw new ApiError(400, 'You must belong to a company before posting a job');
    };

    //Find the company ther belong to
    const company = await Company.findById(req.user.companyId);
    if (!company) {
        throw new ApiError(404, 'Associated company not found');
    }

    // This gate allows only verified employers to post jobs to avoid malicious activities.
    if (!company.isVerified) {
        throw new ApiError(403, 'Your company must be verified by an admin before posting jobs');
    };

    // Avoid duplicate creation of the same Job
    const existing = await Job.findOne({
        postedBy: req.user._id,
        title: req.body.title,
        company: req.body.company,
    });
    if (existing) {
        throw new ApiError(409, 'You already have a job with this title at this company.');
    }

    //The request body
    const {
        title, description, requirements, responsibilities,
        location, workMode, employmentType,
        salaryMin, salaryMax, currency,
        experienceLevel, skills, status, applicationDeadline,
    } = req.body;

    // Create a Job
    const job = await Job.create({
        title, description, requirements, responsibilities,
        location, workMode, employmentType,
        salaryMin, salaryMax, currency,
        experienceLevel, skills, status, applicationDeadline,
        company: company._id,
        postedBy: req.user._id,
    });

    res.status(201).json({ success: true, job });
});

// GET /api/jobs
export const getJobs = asyncHandler(async (req, res) => {
    const { search, location, workMode, employmentType, experienceLevel } = req.query;

    // Only ever expose 'open' jobs on the public search endpoint — drafts
    // and closed jobs stay private to the company that owns them.
    const filter = { status: 'open' };

    if (search) filter.$text = { $search: search };
    if (location) filter.location = new RegExp(location, 'i')
    if (workMode) filter.workMode = workMode;
    if (employmentType) filter.employmentType = employmentType;
    if (experienceLevel) filter.experienceLevel = experienceLevel;

    const jobs = await Job.find(filter)
        .populate('company', 'name logo industry isVerified')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: jobs.length, jobs });
});

// GET /api/jobs/:id
export const getJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id).populate('company', 'name logo industry isVerified');
    if (!job) {
        throw new ApiError(404, 'Job not found');
    }
    res.status(200).json({ success: true, job });
});

// PATCH /api/jobs/:id
// @access  Employer/recruiter who belongs to the job's company
export const updateJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    // Ownership check — same .equals() pattern as Company, but comparing
    // against a single companyId rather than an owners array, since a
    // Job belongs to exactly one company.
    if (!job.company.equals(req.user.companyId)) {
        throw new ApiError(403, 'You do not have permission to update this job');
    }

    const allowedUpdates = [
        'title', 'description', 'requirements', 'responsibilities',
        'location', 'workMode', 'employmentType',
        'salaryMin', 'salaryMax', 'currency',
        'experienceLevel', 'skills', 'status', 'applicationDeadline',
    ];

    allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) job[field] = req.body[field];
    });

    await job.save();
    res.status(200).json({ success: true, job });
});

// @route   DELETE /api/jobs/:id
// @access  Employer/recruiter who belongs to the job's company
export const deleteJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    if (!job.company.equals(req.user.companyId)) {
        throw new ApiError(403, 'You do not have permission to delete this job');
    }

    await job.deleteOne();
    res.status(200).json({ success: true, message: 'Job deleted successfully' });
});