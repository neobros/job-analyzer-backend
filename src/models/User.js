import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'supplier', 'admin'], default: 'user' },
    isEmailVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isVerifiedByAdmin: { type: Boolean, default: false },
    hasPriorityBadge: { type: Boolean, default: false, index: true },
    otpHash: String,
    otpExpiresAt: Date,
    passwordResetHash: String,
    passwordResetExpiresAt: Date,
    registrationFingerprint: { type: String, index: true },
    lastLoginAt: Date
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
