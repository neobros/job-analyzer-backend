import express from 'express';
import Profile from '../models/Profile.js';
import Review from '../models/Review.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate('user', 'email role isEmailVerified isVerifiedByAdmin hasPriorityBadge');
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.put('/me', requireAuth, requireVerifiedEmail, upload.fields([{ name: 'cvFile', maxCount: 1 }, { name: 'profilePhoto', maxCount: 1 }]), async (req, res, next) => {
  try {
    const hiddenContact = {
      phone: req.body.phone || req.body['hiddenContact[phone]'] || req.body.hiddenContact?.phone || '',
      email: req.body.contactEmail || req.body['hiddenContact[email]'] || req.body.hiddenContact?.email || req.user.email,
      website: req.body.website || req.body['hiddenContact[website]'] || req.body.hiddenContact?.website || ''
    };

    const data = {
      fullName: req.body.fullName,
      experience: req.body.experience,
      country: req.body.country,
      city: req.body.city,
      about: req.body.about,
      hiddenContact,
      skills: typeof req.body.skills === 'string' ? req.body.skills.split(',').map((skill) => skill.trim()).filter(Boolean) : req.body.skills
    };

    if (req.files?.cvFile?.[0]) {
      data.cvFile = req.files.cvFile[0].path;
      data.cvFileName = req.files.cvFile[0].originalname;
    }
    if (req.files?.profilePhoto?.[0]) data.profilePhoto = req.files.profilePhoto[0].path;

    const profile = await Profile.findOneAndUpdate({ user: req.user._id }, data, { new: true, upsert: true })
      .populate('user', 'email role isEmailVerified isVerifiedByAdmin hasPriorityBadge');
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.get('/:userId', async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId })
      .select('-hiddenContact')
      .populate('user', 'role isVerifiedByAdmin hasPriorityBadge');
    const reviews = await Review.find({ targetUser: req.params.userId, status: 'approved' }).limit(20);
    res.json({ profile, reviews });
  } catch (error) {
    next(error);
  }
});

export default router;
