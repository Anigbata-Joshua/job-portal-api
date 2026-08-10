import { describe, it, expect } from 'vitest';

describe('Job Application Concurrency Tests', () => {

    it('VULNERABILITY DEMONSTRATION: Concurrency race condition causes lost counter updates', async () => {
        // Mock DB Job Document
        let jobDocument = {
            _id: 'job-1',
            applicationsCount: 0
        };

        // Simulates the vulnerable endpoint controller behavior
        // Read job -> increment counter -> write job
        const applyToJobVulnerable = async () => {
            // Step 1: Read current job count (simulating Mongo findById)
            const countBefore = jobDocument.applicationsCount;
            
            // Simulate network/execution delay (I/O) before writing back
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
            
            // Step 2: Increment and write back (simulating job.save())
            jobDocument.applicationsCount = countBefore + 1;
        };

        // Simulate 10 concurrent requests to apply to the job
        await Promise.all([
            applyToJobVulnerable(),
            applyToJobVulnerable(),
            applyToJobVulnerable(),
            applyToJobVulnerable(),
            applyToJobVulnerable(),
            applyToJobVulnerable(),
            applyToJobVulnerable(),
            applyToJobVulnerable(),
            applyToJobVulnerable(),
            applyToJobVulnerable()
        ]);

        // Expectation: The count should be 10, but because of race conditions and dirty reads,
        // it will almost certainly be less than 10.
        expect(jobDocument.applicationsCount).toBeLessThan(10);
        console.log(`VULNERABLE COUNT RESULT (Should be 10, actually is): ${jobDocument.applicationsCount}`);
    });

    it('SECURE REMEDY: Atomic database operations prevent lost updates', async () => {
        let jobDocument = {
            _id: 'job-1',
            applicationsCount: 0
        };

        // Mocking atomic MongoDB $inc command behavior
        const atomicIncJobCount = async () => {
            // In MongoDB: Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } })
            // This is handled atomically inside the database engine.
            // We simulate database serialization of updates:
            jobDocument.applicationsCount += 1;
        };

        // Run 10 concurrent requests using the atomic update method
        await Promise.all([
            atomicIncJobCount(),
            atomicIncJobCount(),
            atomicIncJobCount(),
            atomicIncJobCount(),
            atomicIncJobCount(),
            atomicIncJobCount(),
            atomicIncJobCount(),
            atomicIncJobCount(),
            atomicIncJobCount(),
            atomicIncJobCount()
        ]);

        // Expectation: Atomic operations always serialize updates correctly
        expect(jobDocument.applicationsCount).toBe(10);
    });
});
