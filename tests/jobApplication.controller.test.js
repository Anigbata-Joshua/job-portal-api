import { describe, it, expect, vi } from 'vitest';

// Mock asyncHandler as a simple pass-through to let tests directly await the controller
vi.mock('../src/utils/asyncHandler.js', () => {
    return {
        default: (fn) => fn
    };
});

vi.mock('../src/utils/createNotification.js', () => ({
    default: vi.fn(),
}));

import { applyToJob } from '../src/controllers/jobApplication.controller.js';
import Job from '../src/models/job.model.js';
import JobApplication from '../src/models/job-application.model.js';
import Resume from '../src/models/resume.model.js';

vi.mock('../src/models/job.model.js');
vi.mock('../src/models/job-application.model.js');
vi.mock('../src/models/resume.model.js');

const buildRes = () => {
    const res = {
        status: (code) => {
            res.statusCode = code;
            return res;
        },
        json: (data) => {
            res.body = data;
            return res;
        },
    };
    return res;
};

describe('Job Application Concurrency Safety', () => {

    it('applyToJob increments applicationsCount using an atomic $inc, not a read-modify-write', async () => {
        // In-memory "job document" — starts at 0 applications.
        const jobDocument = { _id: 'job-1', status: 'open', company: 'company-1', applicationsCount: 0 };

        Job.findById = vi.fn().mockResolvedValue(jobDocument);
        Resume.findById = vi.fn().mockResolvedValue({ _id: 'resume-1', user: { equals: () => true } });
        JobApplication.findOne = vi.fn().mockResolvedValue(null); // no existing application
        JobApplication.create = vi.fn().mockResolvedValue({ _id: 'app-1' });

        // The real fix for the race condition: Job.findByIdAndUpdate with $inc
        // is what actually serializes the increment on the database side.
        // Here we simulate MongoDB's atomic behavior faithfully — each call
        // to $inc applies in sequence, regardless of read timing — and
        // assert the controller actually calls it this way, not via
        // "read applicationsCount, add 1 in JS, write it back".
        Job.findByIdAndUpdate = vi.fn().mockImplementation(async (id, update) => {
            if (update?.$inc?.applicationsCount) {
                jobDocument.applicationsCount += update.$inc.applicationsCount;
            }
            return jobDocument;
        });

        const makeReq = (userId) => ({
            body: { jobId: 'job-1', resumeId: 'resume-1', coverLetter: 'test' },
            user: { _id: userId },
        });

        // Simulate 10 concurrent applications from 10 different seekers.
        await Promise.all(
            Array.from({ length: 10 }, (_, i) => applyToJob(makeReq(`seeker-${i}`), buildRes()))
        );

        // Because the controller uses $inc (an atomic DB-side operation)
        // rather than reading applicationsCount into JS and writing it back,
        // all 10 increments are correctly applied — no lost updates.
        expect(jobDocument.applicationsCount).toBe(10);

        // Confirm the controller actually used the atomic pattern, not a
        // manual job.applicationsCount++ / job.save() — this is what makes
        // the test a real guard against the race condition regressing.
        expect(Job.findByIdAndUpdate).toHaveBeenCalledTimes(10);
        Job.findByIdAndUpdate.mock.calls.forEach((call) => {
            expect(call[1]).toEqual({ $inc: { applicationsCount: 1 } });
        });
    });

    it('VULNERABILITY REFERENCE: a naive read-modify-write pattern would lose updates under the same load', async () => {
        // Kept as a standalone conceptual reference for why $inc matters —
        // this does NOT call the real controller, it just documents the
        // failure mode the fix above protects against.
        let counter = 0;

        const naiveIncrement = async () => {
            const before = counter;
            await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
            counter = before + 1;
        };

        await Promise.all(Array.from({ length: 10 }, () => naiveIncrement()));

        expect(counter).toBeLessThan(10);
    });
});