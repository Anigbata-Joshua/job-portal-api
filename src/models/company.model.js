import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Please provide a company name'], trim: true },
    description: { type: String, required: [true, 'Please provide a company description'], },
    website: { type: String, trim: true, default: null },
    industry: { type: String, required: [true, 'Please provide an industry'] },
    size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'], },
    logo: { type: String, default: null, },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, },
    owners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    recruiters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', }],

    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

}, { timestamps: true });

const Company = mongoose.model('Company', CompanySchema);
export default Company;