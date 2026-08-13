import Company from '../models/company.model.js';
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const createCompany = asyncHandler(async (req, res) => {
    // Pull only the fields we expect from the request body.
    // Anything else the client sends is simply ignored — this protects
    // against a client trying to set fields it shouldn't (e.g. isVerified).
    const { name, description, website, industry, size, logo } = req.body;

    // Enforce "one company per user" for this MVP. We look up whether a
    // company already exists with this user as its creator or if user is already linked.
if (req.user.companyId) {
    const existingCompany = await Company.findById(req.user.companyId);
    if (existingCompany) {
        throw new ApiError(400, 'You are already associated with a company');
    }
    // companyId points to a deleted company — clear the stale reference
    // and allow this user to create a new one.
    req.user.companyId = null;
}

const existing = await Company.findOne({ createdBy: req.user._id });
if (existing) {
    throw new ApiError(409, 'You already have a company registered');
}

    // Create the new Company document.
    const company = await Company.create({
        name,
        description,
        website,
        industry,
        size,
        logo,
        createdBy: req.user._id, // createdBy records who originally created this company (audit trail).

        // owners starts with just the creator. 
        owners: [req.user._id],
    });

    // Business rule: creating a company automatically promotes the user
    // from 'job_seeker' to 'employer' (if they are not admin), and links them to the new company.
    // This is the "role upgrade" logic referenced back in seed.js.
    if (req.user.role !== 'admin') {
        req.user.role = 'employer';
    }
    req.user.companyId = company._id;
    await req.user.save();

    // 201 = Created — a new resource (the company) now exists.
    res.status(201).json({ success: true, company });
});


// Get a single company via id
export const getCompany = asyncHandler(async (req, res) => {
    // req.params.id comes from the :id placeholder in the route path.
    const company = await Company.findById(req.params.id);

    if (!company) {
        throw new ApiError(404, 'Company not found'); // 404 = Not Found — no company exists with this ID.

    }

    // 200 = OK — standard success response for a GET request.
    res.status(200).json({ success: true, company });
});

//  PATCH /api/companies/:id
// Authenticated + must be a listed owner of this specific company
export const updateCompany = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id);
    if (!company) {
        throw new ApiError(404, 'Company not found');
    }

    // Ownership check: is the logged-in user one of this company's owners?
    //
    // .some() loops through company.owners (an array of ObjectIds) and
    // returns true as soon as ANY element satisfies the condition.
    //
    // .equals() is Mongoose's built-in method for comparing two ObjectIds
    // by their actual value. We can't use === here, because two ObjectId
    // objects with the same underlying ID are still different object
    // instances in memory — === would incorrectly return false even for
    // a genuine match.
    const isOwner = company.owners.some((id) => id.equals(req.user._id));

    if (!isOwner) {
        throw new ApiError(403, 'Only company owners can update this company');
    }

    // Whitelist of fields a company owner is allowed to change.
    // We deliberately do NOT include fields like isVerified, owners,
    // recruiters, or createdBy here — those must only change through
    // their own dedicated, more tightly controlled logic (admin
    // verification, addRecruiter, etc.), never a generic update.
    const allowedUpdates = ['name', 'description', 'website', 'industry', 'size', 'logo'];

    // Only overwrite a field if the client actually sent a value for it.
    // This allows partial updates (PATCH semantics) — the client can send
    // just { "website": "..." } without needing to resend every field.
    allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) company[field] = req.body[field];
    });

    // .save() persists the changes and also re-runs schema validation
    // and updates `updatedAt` (via timestamps: true on the schema).
    await company.save();

    res.status(200).json({ success: true, company });
});

// POST /api/companies/:id/recruiters
// Authenticated + must be a listed owner of this specific company
export const addRecruiter = asyncHandler(async (req, res) => {
    // The ID of the user being invited/promoted to recruiter, sent by the client.
    const { userId } = req.body;

    const company = await Company.findById(req.params.id);
    if (!company) {
        throw new ApiError(404, 'Company not found');
    }

    // Same ownership check as updateCompany — only an owner can add recruiters.
    const isOwner = company.owners.some((id) => id.equals(req.user._id));
    if (!isOwner) {
        throw new ApiError(403, 'Only company owners can add recruiters');
    }

    // Confirm the user being added actually exists before referencing them.
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
        throw new ApiError(404, 'User not found');
    }

    // Prevent demoting an Admin or hijacking users associated with other companies
    if (userToAdd.role === 'admin') {
        throw new ApiError(400, 'Cannot reassign an Administrator to a recruiter role');
    }
    if (userToAdd.companyId && !userToAdd.companyId.equals(company._id)) {
        throw new ApiError(400, 'User is already associated with another company');
    }

    // Prevent adding the same person as a recruiter twice.
    if (company.recruiters.some((id) => id.equals(userId))) {
        throw new ApiError(409, 'User is already a recruiter for this company');
    }

    // Add the new recruiter's ID to the company's recruiters array.
    company.recruiters.push(userId);
    await company.save();

    // This is the ONLY legitimate way a user's role becomes 'recruiter'
    userToAdd.role = 'recruiter';
    userToAdd.companyId = company._id;
    await userToAdd.save();

    res.status(200).json({ success: true, company });
});