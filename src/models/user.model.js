import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const UserSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Please provide a name'], trim: true },
    email: { type: String, required: [true, 'Please provide an email'], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'], },
    password: { type: String, required: [true, 'Please provide a password'], minlength: 6, },
    role: { type: String, enum: ['job_seeker', 'employer', 'recruiter', 'admin'], default: 'job_seeker', },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, },
    profilePicture: { type: String, default: null, },

}, { timestamps: true });

// ✅ Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});


// ✅ Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


// ✅ Remove password from JSON responses
UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

const User = mongoose.model('User', UserSchema);
export default User;