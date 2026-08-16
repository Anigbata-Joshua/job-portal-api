import { z } from 'zod';
import ApiError from '../utils/ApiError.js';

// Reusable middleware to validate request body using a Zod schema
export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            return next(new ApiError(400, errorMessages));
        }
        next(err);
    }
};

// Object ID validation helper for MongoDB ref checking in Zod
const objectIdSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: 'Invalid ID format',
});

// Password strength check: min 6 chars, 1 uppercase, 1 digit, 1 special character
const passwordComplexity = z.string()
    .min(6, 'Password must be at least 6 characters long')
    .refine((val) => /[A-Z]/.test(val), 'Password must contain at least one uppercase letter')
    .refine((val) => /[0-9]/.test(val), 'Password must contain at least one number')
    .refine((val) => /[^A-Za-z0-9]/.test(val), 'Password must contain at least one special character');

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: passwordComplexity,
    role: z.enum(['job_seeker', 'employer']).optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createCompanySchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    website: z.string().url('Please enter a valid website URL').nullable().optional().or(z.literal('')),
    industry: z.string().min(1, 'Industry is required'),
    size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
    logo: z.string().url('Invalid logo URL').nullable().optional().or(z.literal('')),
});

// PATCH semantics — every field optional, since a partial update should
// only touch whatever the client actually sends.
export const updateCompanySchema = z.object({
    name: z.string().min(1, 'Company name cannot be empty').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').optional(),
    website: z.string().url('Please enter a valid website URL').nullable().optional().or(z.literal('')),
    industry: z.string().min(1, 'Industry cannot be empty').optional(),
    size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
    logo: z.string().url('Invalid logo URL').nullable().optional().or(z.literal('')),
});

// addRecruiter only ever needs a valid user ID to invite.
export const addRecruiterSchema = z.object({
    userId: objectIdSchema,
});

export const createJobSchema = z.object({
    title: z.string().min(1, 'Job title is required'),
    description: z.string().min(10, 'Job description must be at least 10 characters'),
    requirements: z.array(z.string()).optional(),
    responsibilities: z.array(z.string()).optional(),
    location: z.string().min(1, 'Location is required'),
    workMode: z.enum(['on-site', 'remote', 'hybrid']),
    employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']),
    salaryMin: z.number().nonnegative().optional().nullable(),
    salaryMax: z.number().nonnegative().optional().nullable(),
    currency: z.enum(['NGN', 'USD']).optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']),
    skills: z.array(z.string()).optional(),
    status: z.enum(['open', 'closed', 'draft']).optional(),
    applicationDeadline: z.string().datetime({ message: 'Invalid ISO date string' }).optional().nullable().or(z.string().date().optional()),
});

export const scheduleInterviewSchema = z.object({
    applicationId: objectIdSchema,
    scheduledAt: z.string().refine((val) => new Date(val) > new Date(), {
        message: 'Interview date must be in the future',
    }),
    duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
    mode: z.enum(['in-person', 'video', 'phone']),
    location: z.string().min(1, 'Location or link is required'),
    round: z.enum(['screening', 'technical', 'hr', 'final']).optional(),
    interviewers: z.array(objectIdSchema).optional(),
});