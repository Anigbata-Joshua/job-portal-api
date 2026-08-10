import { describe, it, expect, vi } from 'vitest';

describe('Job Controller Logic Tests', () => {

    it('DEMONSTRATING DRAFT DATA LEAKAGE: getJob retrieves draft/closed jobs', () => {
        // Mock DB records
        const mockJobs = {
            'job-id-1': { _id: 'job-id-1', title: 'Open Job', status: 'open' },
            'job-id-2': { _id: 'job-id-2', title: 'Draft Job', status: 'draft' },
            'job-id-3': { _id: 'job-id-3', title: 'Closed Job', status: 'closed' }
        };

        // Simplified controller getJob behavior (current implementation)
        const getJobController = (req, res) => {
            const job = mockJobs[req.params.id];
            if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
            // Bug: Exposes any job directly without role validation or checking job status
            return res.status(200).json({ success: true, job });
        };

        // Simulated Response helper
        const makeRes = () => {
            const resObj = {
                statusCode: 0,
                body: {},
                status: function(code) { this.statusCode = code; return this; },
                json: function(data) { this.body = data; return this; }
            };
            return resObj;
        };

        // Job seeker requests a draft job
        const resSeeker = makeRes();
        getJobController({ params: { id: 'job-id-2' }, user: { role: 'job_seeker' } }, resSeeker);
        
        expect(resSeeker.statusCode).toBe(200);
        expect(resSeeker.body.job.status).toBe('draft'); // Access leaked! Seeker should not see drafts.
    });

    it('VULNERABILITY DEMONSTRATION: Broken Duplicate Job posting check', () => {
        const mockDatabase = [];

        // Current createJob duplicate check implementation:
        // const existing = await Job.findOne({ postedBy: req.user._id, title: req.body.title, company: req.body.company });
        // Since req.body.company is undefined, the DB query runs with { company: undefined }
        const findOneMock = (query) => {
            return mockDatabase.find(job => 
                job.postedBy === query.postedBy && 
                job.title === query.title && 
                job.company === query.company
            ) || null;
        };

        // Simulate creation of a job (which gets saved with company: company._id)
        mockDatabase.push({
            _id: 'job-1',
            title: 'Software Engineer',
            postedBy: 'user-1',
            company: 'company-123' // Saved from company._id lookup
        });

        // Client attempts to resubmit duplicate request
        // req.body contains title, description, etc. but company is NOT in req.body
        const reqBody = {
            title: 'Software Engineer'
        };

        // Run the findOne check from createJob
        const query = {
            postedBy: 'user-1',
            title: reqBody.title,
            company: reqBody.company // undefined!
        };

        const existingJob = findOneMock(query);

        // Expectation: The check fails to find the existing job because query.company is undefined
        expect(existingJob).toBeNull(); // Gate bypassed! System will allow duplicate.
    });

    it('SECURE REMEDY: Secure Duplicate check fetches by req.user.companyId', () => {
        const mockDatabase = [{
            _id: 'job-1',
            title: 'Software Engineer',
            postedBy: 'user-1',
            company: 'company-123'
        }];

        const findOneMock = (query) => {
            return mockDatabase.find(job => 
                job.postedBy === query.postedBy && 
                job.title === query.title && 
                job.company === query.company
            ) || null;
        };

        const reqUser = { _id: 'user-1', companyId: 'company-123' };
        const reqBody = { title: 'Software Engineer' };

        // Remedy: Use req.user.companyId instead of req.body.company
        const secureQuery = {
            postedBy: reqUser._id,
            title: reqBody.title,
            company: reqUser.companyId // Correct company ID reference
        };

        const existingJob = findOneMock(secureQuery);
        expect(existingJob).not.toBeNull();
        expect(existingJob.title).toBe('Software Engineer'); // Successfully blocked!
    });
});
