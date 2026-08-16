import Job from '../models/job.model.js';
import JobApplication from '../models/job-application.model.js';
import Interview from '../models/interview.model.js';
import SavedJob from '../models/saved-jobs.model.js';
import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// @desc    Get reports & analytics for Job Seekers
// @route   GET /api/reports/seeker
// @access  Private (Job Seeker)
export const getSeekerReport = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1. Applications breakdown
    const applicationsBreakdownRaw = await JobApplication.aggregate([
        { $match: { applicant: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    // Rename the aggregation's grouping key (_id) to something meaningful
    // for API consumers — "status" reads far more clearly than "_id",
    // which normally implies a document ID rather than a grouped value.
    const applicationsBreakdown = applicationsBreakdownRaw.map((item) => ({
        status: item._id,
        count: item.count,
    }));

    const totalApplications = applicationsBreakdown.reduce((sum, item) => sum + item.count, 0);

    // 2. Upcoming interviews count
    const upcomingInterviews = await Interview.countDocuments({
        candidate: userId,
        status: 'scheduled',
        scheduledAt: { $gte: new Date() }
    });

    // 3. Saved jobs count
    const savedJobsCount = await SavedJob.countDocuments({ user: userId });

    res.status(200).json({
        success: true,
        data: {
            totalApplications,
            applicationsBreakdown,
            upcomingInterviews,
            savedJobsCount
        }
    });
});

// @desc    Get reports & analytics for Employers / Recruiters
// @route   GET /api/reports/employer
// @access  Private (Employer / Recruiter)
export const getEmployerReport = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    if (!companyId) {
        throw new ApiError(400, 'User is not associated with any company');
    }

    // 1. Get total jobs posted by the company
    const jobsCount = await Job.countDocuments({ company: companyId });

    // 2. Get applications breakdown for all jobs posted by the company
    const applicationsBreakdownRaw = await JobApplication.aggregate([
        { $match: { company: companyId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const applicationsBreakdown = applicationsBreakdownRaw.map((item) => ({
        status: item._id,
        count: item.count,
    }));

    const totalApplications = applicationsBreakdown.reduce((sum, item) => sum + item.count, 0);

    // 3. Upcoming interviews count for the company
    const upcomingInterviews = await Interview.countDocuments({
        company: companyId,
        status: 'scheduled',
        scheduledAt: { $gte: new Date() }
    });

    res.status(200).json({
        success: true,
        data: {
            jobsCount,
            totalApplications,
            applicationsBreakdown,
            upcomingInterviews
        }
    });
});

// @desc    Get system-wide reports for Administrators
// @route   GET /api/reports/admin
// @access  Private (Admin)
export const getAdminReport = asyncHandler(async (req, res) => {
    // 1. Total users by role
    const usersByRoleRaw = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const usersByRole = usersByRoleRaw.map((item) => ({ role: item._id, count: item.count }));

    const totalUsers = usersByRole.reduce((sum, item) => sum + item.count, 0);

    // 2. Total companies & verification status
    const companiesVerificationRaw = await Company.aggregate([
        { $group: { _id: '$isVerified', count: { $sum: 1 } } }
    ]);
    const companiesVerification = companiesVerificationRaw.map((item) => ({
        isVerified: item._id,
        count: item.count,
    }));

    const totalCompanies = companiesVerification.reduce((sum, item) => sum + item.count, 0);

    // 3. Total jobs count by status
    const jobsByStatusRaw = await Job.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const jobsByStatus = jobsByStatusRaw.map((item) => ({ status: item._id, count: item.count }));

    const totalJobs = jobsByStatus.reduce((sum, item) => sum + item.count, 0);

    // 4. Total applications count
    const totalApplications = await JobApplication.countDocuments({});

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            usersByRole,
            totalCompanies,
            companiesVerification,
            totalJobs,
            jobsByStatus,
            totalApplications
        }
    });
});