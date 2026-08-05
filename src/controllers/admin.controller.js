import Company from '../models/company.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// @route   PATCH /api/ad min/companies/:id/verify. Admin only
export const verifyCompany = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id);

    if (!company) {
        throw new ApiError(404, 'Company not found');
    }

    company.isVerified = true;
    company.verifiedAt = new Date();
    company.verifiedBy = req.user._id;
    await company.save();

    res.status(200).json({ success: true, company });
});

// @route   GET /api/admin/companies/pending
// @access  Admin only — lets the admin see everyone waiting on verification
export const getPendingCompanies = asyncHandler(async (req, res) => {
    const pending = await Company.find({ isVerified: false }).populate('createdBy', 'name email');
    res.status(200).json({ success: true, count: pending.length, companies: pending });
});