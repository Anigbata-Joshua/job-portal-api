import SavedJob from '../models/saved-jobs.model.js';
import Job from '../models/job.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// @route   POST /api/saved-jobs
// @access  Job Seeker only
export const saveJob = asyncHandler(async (req, res) => {
    const { jobId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    // Avoid duplicates of savedJobs
    const existing = await SavedJob.findOne({ user: req.user._id, job: jobId });
    if (existing) {
        throw new ApiError(409, 'Job is already saved');
    }

    const savedJob = await SavedJob.create({ user: req.user._id, job: jobId });

    res.status(201).json({ success: true, savedJob });
});

// @route   GET /api/saved-jobs
// @access  Job Seeker only
export const getSavedJobs = asyncHandler(async (req, res) => {
    const savedJobs = await SavedJob.find({ user: req.user._id })
        .populate({
            path: 'job',
            select: 'title location employmentType workMode status',
            populate: { path: 'company', select: 'name logo' },
        })
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: savedJobs.length, savedJobs });
});

// @route   DELETE /api/saved-jobs/:jobId
// @access  Job Seeker only — unsave by job ID, not SavedJob document ID
export const unsaveJob = asyncHandler(async (req, res) => {
    const savedJob = await SavedJob.findOneAndDelete({
        user: req.user._id,
        job: req.params.jobId,
    });

    if (!savedJob) {
        throw new ApiError(404, 'Saved job not found');
    }

    res.status(200).json({ success: true, message: 'Job removed from saved list' });
});