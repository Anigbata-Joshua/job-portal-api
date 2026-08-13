import streamifier from 'streamifier';
import Resume from '../models/resume.model.js';
import cloudinary from '../config/cloudinary.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import uploadToCloudinary from '../utils/uploadToCloudinary.js';
import crypto from 'crypto';

// Helper to extract the Cloudinary public ID from raw URL
const getPublicIdFromUrl = (url) => {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const subParts = parts[1].split('/');
    if (subParts.length < 2) return null;
    // The version part is subParts[0], public_id is everything after that
    return subParts.slice(1).join('/');
};

// @route   POST /api/resumes
// @access  Job Seeker only
export const createResume = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'Please upload a resume file');
    }

    const { title, summary, skills, isDefault } = req.body;
    if (!title) {
        throw new ApiError(400, 'Please provide a resume title');
    }

    const trimmedTitle = title.trim();

    // Hash the file so we can catch true duplicate uploads (same file,
    // different title) as well as duplicate titles.
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Detects duplicate attempts immediate 409 without
    // ever touching Cloudinary.
    const existing = await Resume.findOne({
        user: req.user._id,
        $or: [{ title: trimmedTitle }, { fileHash }],
    });

    if (existing) {
        const reason =
            existing.fileHash === fileHash
                ? 'You have already uploaded this exact resume file.'
                : 'You already have a resume with this title.';
        throw new ApiError(409, reason);
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer);

    let resume;
    try {
        // Determine file type from the original filename extension.
        const extension = req.file.originalname.split('.').pop().toLowerCase();
        const fileType = extension === 'pdf' ? 'pdf' : extension === 'docx' ? 'docx' : 'doc';

        // If this new resume is being set as default, unset any existing
        // default first — the schema doesn't enforce "only one default"
        // on its own, so this has to happen at the controller level.
        if (isDefault === 'true' || isDefault === true) {
            await Resume.updateMany({ user: req.user._id }, { isDefault: false });
        }

        // If this is the user's very first resume, make it default automatically,
        // regardless of what was sent — a user should never end up with zero
        // default resumes.
        const existingCount = await Resume.countDocuments({ user: req.user._id });

        resume = await Resume.create({
            user: req.user._id,
            title: trimmedTitle,
            fileUrl: uploadResult.secure_url,
            fileName: req.file.originalname,
            fileType,
            fileHash,
            isDefault: existingCount === 0 ? true : (isDefault === 'true' || isDefault === true),
            summary,
            skills: skills ? skills.split(',').map((s) => s.trim()) : [],
        });
    } catch (error) {
        // Clean up Cloudinary asset if Mongoose document creation fails
        // (including a duplicate-key race — see the 11000 handling below).
        if (uploadResult && uploadResult.public_id) {
            await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: 'raw' });
        } else if (uploadResult && uploadResult.secure_url) {
            const publicId = getPublicIdFromUrl(uploadResult.secure_url);
            if (publicId) {
                await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
            }
        }

        // Two near-simultaneous requests can both pass the findOne check
        // above before either document exists. The unique index on the
        // schema (see resume.model.js) is the real guard against that race;
        // this just turns Mongo's raw duplicate-key error into a clean 409
        // instead of leaking a 500.
        if (error.code === 11000) {
            const dupField = Object.keys(error.keyPattern || {}).includes('fileHash')
                ? 'You have already uploaded this exact resume file.'
                : 'You already have a resume with this title.';
            throw new ApiError(409, dupField);
        }

        throw error;
    }

    res.status(201).json({ success: true, resume });
});
// @route   GET /api/resumes/my
// @access  Job Seeker only
export const getMyResumes = asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: resumes.length, resumes });
});

// @route   PATCH /api/resumes/:id/default
// @access  Owner only
export const setDefaultResume = asyncHandler(async (req, res) => {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
        throw new ApiError(404, 'Resume not found');
    }

    if (!resume.user.equals(req.user._id)) {
        throw new ApiError(403, 'You can only manage your own resumes');
    }

    await Resume.updateMany({ user: req.user._id }, { isDefault: false });
    resume.isDefault = true;
    await resume.save();

    res.status(200).json({ success: true, resume });
});

// @route   DELETE /api/resumes/:id
// @access  Owner only
export const deleteResume = asyncHandler(async (req, res) => {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
        throw new ApiError(404, 'Resume not found');
    }

    if (!resume.user.equals(req.user._id)) {
        throw new ApiError(403, 'You can only delete your own resumes');
    }

    // Delete the file from Cloudinary
    const publicId = getPublicIdFromUrl(resume.fileUrl);
    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        } catch (cloudinaryError) {
            console.error('Cloudinary deletion failed:', cloudinaryError.message);
        }
    }

    await resume.deleteOne();

    // If the deleted resume was the default, and other resumes still
    // exist, promote the most recently created one to default so the
    // user always has one, if any remain.
    if (resume.isDefault) {
        const nextResume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });
        if (nextResume) {
            nextResume.isDefault = true;
            await nextResume.save();
        }
    }

    res.status(200).json({ success: true, message: 'Resume deleted successfully' });
});