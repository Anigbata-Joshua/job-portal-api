import streamifier from 'streamifier';
import Resume from '../models/resume.model.js';
import cloudinary from '../config/cloudinary.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import uploadToCloudinary from '../utils/uploadToCloudinary.js';

// @route   POST /api/resumes
// @access  Job Seeker only
export const createResume = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'Please upload a resume file');
    }

    const { title, summary, skills, isDefault } = req.body;

    const uploadResult = await uploadToCloudinary(req.file.buffer);

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

    const resume = await Resume.create({
        user: req.user._id,
        title,
        fileUrl: uploadResult.secure_url,
        fileName: req.file.originalname,
        fileType,
        isDefault: existingCount === 0 ? true : (isDefault === 'true' || isDefault === true),
        summary,
        skills: skills ? skills.split(',').map((s) => s.trim()) : [],
    });

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