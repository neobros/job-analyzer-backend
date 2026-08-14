import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { requireAuth } from '../middleware/auth.js';
import {
  assertStrongPassword,
  compareValue,
  createOtp,
  hashValue,
  normalizeEmail,
  registrationFingerprint,
  signToken
} from '../utils/auth.js';
import { sendOtpEmail } from '../utils/email.js';

const router = express.Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, fullName, role = 'user', country, city } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    assertStrongPassword(password);

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account already exists for this email' });
    }

    const otp = createOtp();
    const user = await User.create({
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      // Regular users can browse, apply, and request services without a
      // manual admin check; suppliers still need admin approval before
      // their posts/gigs/listings carry the "verified" trust signal.
      isVerifiedByAdmin: role === 'user',
      otpHash: await hashValue(otp),
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      registrationFingerprint: registrationFingerprint(req, normalizedEmail)
    });

    await Profile.create({
      user: user._id,
      fullName: fullName || normalizedEmail.split('@')[0],
      country,
      city,
      hiddenContact: { email: normalizedEmail }
    });

    await sendOtpEmail(normalizedEmail, otp);

    res.status(201).json({
      message: 'Account created. Verify your email with the OTP code.',
      token: signToken(user),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isVerifiedByAdmin: user.isVerifiedByAdmin,
        hasPriorityBadge: user.hasPriorityBadge
      },
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otp
    });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-otp', requireAuth, async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Request a new code.' });
    }

    const isValid = await compareValue(otp, user.otpHash);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    user.isEmailVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully',
      token: signToken(user),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isVerifiedByAdmin: user.isVerifiedByAdmin,
        hasPriorityBadge: user.hasPriorityBadge
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/resend-otp', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const otp = createOtp();
    user.otpHash = await hashValue(otp);
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOtpEmail(user.email, otp);
    res.json({ message: 'OTP sent', devOtp: process.env.NODE_ENV === 'production' ? undefined : otp });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });

    if (!user || user.isBlocked || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid login details' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      message: 'Logged in',
      token: signToken(user),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isVerifiedByAdmin: user.isVerifiedByAdmin,
        hasPriorityBadge: user.hasPriorityBadge
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });

    if (user) {
      const otp = createOtp();
      user.passwordResetHash = await hashValue(otp);
      user.passwordResetExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOtpEmail(email, otp);
    }

    res.json({ message: 'If the account exists, reset instructions were sent' });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp, password } = req.body;
    assertStrongPassword(password);
    const user = await User.findOne({ email });

    if (!user || !user.passwordResetHash || user.passwordResetExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    const isValid = await compareValue(otp, user.passwordResetHash);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    res.json({ message: 'Password updated' });
  } catch (error) {
    next(error);
  }
});

export default router;
