import { describe, it, expect } from 'vitest';

// The vulnerable logic in upload.middleware.js is:
// if (hasValidMime || hasValidExtension) { ... }
//
// Below is a unit test demonstrating the security bypass this causes.

describe('Upload Middleware File Filtering Vulnerability', () => {
    
    // Mimics the filter function inside upload.middleware.js
    const vulnerableFileFilter = (file) => {
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const allowedExtensions = ['.pdf', '.doc', '.docx'];

        const hasValidMime = allowedMimeTypes.includes(file.mimetype);
        const hasValidExtension = allowedExtensions.some((ext) =>
            file.originalname.toLowerCase().endsWith(ext)
        );

        // Crucial bug: uses || instead of &&
        if (hasValidMime || hasValidExtension) {
            return true; // accepted
        } else {
            return false; // rejected
        }
    };

    // The secure replacement logic:
    const secureFileFilter = (file) => {
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const allowedExtensions = ['.pdf', '.doc', '.docx'];

        const hasValidMime = allowedMimeTypes.includes(file.mimetype);
        const hasValidExtension = allowedExtensions.some((ext) =>
            file.originalname.toLowerCase().endsWith(ext)
        );

        // Security best practice: must satisfy both MIME validation AND extension matching
        if (hasValidMime && hasValidExtension) {
            return true;
        } else {
            return false;
        }
    };

    it('VULNERABILITY DEMONSTRATION: Should bypass filter if file has .exe extension but pdf mimetype', () => {
        const maliciousFile = {
            originalname: 'payload.exe',
            mimetype: 'application/pdf'
        };

        const isAccepted = vulnerableFileFilter(maliciousFile);
        expect(isAccepted).toBe(true); // Fails secure criteria (an executable file is allowed!)
    });

    it('VULNERABILITY DEMONSTRATION: Should bypass filter if file is executable but has .pdf extension', () => {
        const maliciousFile = {
            originalname: 'payload.pdf',
            mimetype: 'application/octet-stream' // Binary payload
        };

        const isAccepted = vulnerableFileFilter(maliciousFile);
        expect(isAccepted).toBe(true); // Fails secure criteria (an executable file is allowed!)
    });

    it('SECURE REMEDY: Secure filter should reject spoofed mimetypes', () => {
        const maliciousFile = {
            originalname: 'payload.exe',
            mimetype: 'application/pdf'
        };

        const isAccepted = secureFileFilter(maliciousFile);
        expect(isAccepted).toBe(false); // Successfully blocked
    });

    it('SECURE REMEDY: Secure filter should reject incorrect extensions with binary payload', () => {
        const maliciousFile = {
            originalname: 'payload.pdf',
            mimetype: 'application/octet-stream'
        };

        const isAccepted = secureFileFilter(maliciousFile);
        expect(isAccepted).toBe(false); // Successfully blocked
    });

    it('SECURE REMEDY: Secure filter should accept genuine documents', () => {
        const validFile = {
            originalname: 'my_resume.pdf',
            mimetype: 'application/pdf'
        };

        const isAccepted = secureFileFilter(validFile);
        expect(isAccepted).toBe(true); // Successfully accepted
    });
});
