import { describe, it, expect, vi } from 'vitest';

// Mock asyncHandler as a simple pass-through to let tests directly await the async controllers
vi.mock('../src/utils/asyncHandler.js', () => {
    return {
        default: (fn) => fn
    };
});

import { getSeekerReport, getEmployerReport, getAdminReport } from '../src/controllers/report.controller.js';
import JobApplication from '../src/models/job-application.model.js';
import Interview from '../src/models/interview.model.js';
import SavedJob from '../src/models/saved-jobs.model.js';
import User from '../src/models/user.model.js';
import Company from '../src/models/company.model.js';
import Job from '../src/models/job.model.js';

vi.mock('../src/models/job-application.model.js');
vi.mock('../src/models/interview.model.js');
vi.mock('../src/models/saved-jobs.model.js');
vi.mock('../src/models/user.model.js');
vi.mock('../src/models/company.model.js');
vi.mock('../src/models/job.model.js');

describe('Reports & Analytics Controller Tests', () => {

    it('getSeekerReport should return correct aggregation results for seeker', async () => {
        const mockApplicationsBreakdown = [
            { _id: 'applied', count: 3 },
            { _id: 'interview', count: 1 }
        ];

        JobApplication.aggregate = vi.fn().mockResolvedValue(mockApplicationsBreakdown);
        Interview.countDocuments = vi.fn().mockResolvedValue(1);
        SavedJob.countDocuments = vi.fn().mockResolvedValue(4);

        const req = {
            user: { _id: 'seeker-123' }
        };

        let responseStatus = null;
        let responseJson = null;

        const res = {
            status: (code) => {
                responseStatus = code;
                return res;
            },
            json: (data) => {
                responseJson = data;
                return res;
            }
        };

        await getSeekerReport(req, res);

        expect(responseStatus).toBe(200);
        expect(responseJson.success).toBe(true);
        expect(responseJson.data.totalApplications).toBe(4);
        expect(responseJson.data.upcomingInterviews).toBe(1);
        expect(responseJson.data.savedJobsCount).toBe(4);
        expect(responseJson.data.applicationsBreakdown).toEqual(mockApplicationsBreakdown);
    });

    it('getEmployerReport should throw error if employer is not associated with a company', async () => {
        const req = {
            user: { _id: 'employer-123', companyId: null }
        };

        const res = {};

        await expect(getEmployerReport(req, res)).rejects.toThrow('User is not associated with any company');
    });

    it('getEmployerReport should return correct company metrics', async () => {
        Job.countDocuments = vi.fn().mockResolvedValue(5);
        JobApplication.aggregate = vi.fn().mockResolvedValue([{ _id: 'applied', count: 10 }]);
        Interview.countDocuments = vi.fn().mockResolvedValue(2);

        const req = {
            user: { _id: 'employer-123', companyId: 'company-123' }
        };

        let responseStatus = null;
        let responseJson = null;

        const res = {
            status: (code) => {
                responseStatus = code;
                return res;
            },
            json: (data) => {
                responseJson = data;
                return res;
            }
        };

        await getEmployerReport(req, res);

        expect(responseStatus).toBe(200);
        expect(responseJson.success).toBe(true);
        expect(responseJson.data.jobsCount).toBe(5);
        expect(responseJson.data.totalApplications).toBe(10);
        expect(responseJson.data.upcomingInterviews).toBe(2);
    });

    it('getAdminReport should retrieve aggregate statistics across the platform', async () => {
        User.aggregate = vi.fn().mockResolvedValue([
            { _id: 'job_seeker', count: 100 },
            { _id: 'employer', count: 10 }
        ]);
        Company.aggregate = vi.fn().mockResolvedValue([
            { _id: true, count: 8 },
            { _id: false, count: 2 }
        ]);
        Job.aggregate = vi.fn().mockResolvedValue([
            { _id: 'open', count: 15 }
        ]);
        JobApplication.countDocuments = vi.fn().mockResolvedValue(50);

        const req = {
            user: { _id: 'admin-123', role: 'admin' }
        };

        let responseStatus = null;
        let responseJson = null;

        const res = {
            status: (code) => {
                responseStatus = code;
                return res;
            },
            json: (data) => {
                responseJson = data;
                return res;
            }
        };

        await getAdminReport(req, res);

        expect(responseStatus).toBe(200);
        expect(responseJson.success).toBe(true);
        expect(responseJson.data.totalUsers).toBe(110);
        expect(responseJson.data.totalCompanies).toBe(10);
        expect(responseJson.data.totalJobs).toBe(15);
        expect(responseJson.data.totalApplications).toBe(50);
    });
});
