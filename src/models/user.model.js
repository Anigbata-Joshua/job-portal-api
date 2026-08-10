import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const UserSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Please provide a name'], trim: true },
    email: { type: String, required: [true, 'Please provide an email'], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'], },
    password: { 
        type: String, 
        required: [true, 'Please provide a password'], 
        minlength: [6, 'Password must be at least 6 characters long'],
        validate: {
            validator: function(v) {
                // Must contain one uppercase letter, one digit, and one special character
                return /[A-Z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v);
            },
            message: 'Password must contain at least one uppercase letter, one number, and one special character'
        }
    },
    role: { type: String, enum: ['job_seeker', 'employer', 'recruiter', 'admin'], default: 'job_seeker', },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, },
    profilePicture: { type: String, default: null, },
    refreshToken: { type: String, default: null },

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