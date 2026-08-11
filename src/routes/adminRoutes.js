import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import JobPost from '../models/JobPost.js';
import JobApplication from '../models/JobApplication.js';
import ServiceGig from '../models/ServiceGig.js';
import Review from '../models/Review.js';
import AdminMessage from '../models/AdminMessage.js';
import Location from '../models/Location.js';
import Listing from '../models/Listing.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { assertStrongPassword, normalizeEmail } from '../utils/auth.js';

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', async (_req, res, next) => {
  try {
    const [users, jobs, applications, gigs, reviews, locations, listings] = await Promise.all([
      User.countDocuments(),
      JobPost.countDocuments(),
      JobApplication.countDocuments(),
      ServiceGig.countDocuments(),
      Review.countDocuments(),
      Location.countDocuments(),
      Listing.countDocuments()
    ]);

    res.json({ users, jobs, applications, gigs, reviews, locations, listings });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (_req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash -otpHash -passwordResetHash').sort({ hasPriorityBadge: -1, createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const { email, password, fullName, role = 'job_seeker', country, city, hasPriorityBadge = false } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    if (!fullName?.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    if (!['job_seeker', 'employer', 'freelancer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    assertStrongPassword(password);

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account already exists for this email' });
    }

    const user = await User.create({
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      isEmailVerified: true,
      isVerifiedByAdmin: true,
      hasPriorityBadge: Boolean(hasPriorityBadge)
    });

    const profile = await Profile.create({
      user: user._id,
      fullName: fullName.trim(),
      country,
      city,
      hiddenContact: { email: normalizedEmail }
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isVerifiedByAdmin: user.isVerifiedByAdmin,
      hasPriorityBadge: user.hasPriorityBadge,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      fullName: profile.fullName
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const updates = {};
    ['isBlocked', 'isVerifiedByAdmin', 'role', 'hasPriorityBadge'].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-passwordHash -otpHash -passwordResetHash');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/password', async (req, res, next) => {
  try {
    assertStrongPassword(req.body.password);

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.passwordHash = await bcrypt.hash(req.body.password, 12);
    user.passwordResetHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    res.json({ message: 'Password updated' });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Profile.deleteOne({ user: user._id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
});

router.get('/jobs', async (_req, res, next) => {
  try {
    const jobs = await JobPost.find().populate('employer', 'email').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

router.patch('/jobs/:id/moderate', async (req, res, next) => {
  try {
    const job = await JobPost.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, adminNotes: req.body.adminNotes, isFeatured: req.body.isFeatured },
      { new: true }
    );
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    next(error);
  }
});

router.delete('/jobs/:id', async (req, res, next) => {
  try {
    const job = await JobPost.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch (error) {
    next(error);
  }
});

router.get('/gigs', async (_req, res, next) => {
  try {
    const gigs = await ServiceGig.find().populate('seller', 'email').sort({ createdAt: -1 });
    res.json(gigs);
  } catch (error) {
    next(error);
  }
});

router.patch('/gigs/:id/moderate', async (req, res, next) => {
  try {
    const gig = await ServiceGig.findByIdAndUpdate(req.params.id, { status: req.body.status, adminNotes: req.body.adminNotes }, { new: true });
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json(gig);
  } catch (error) {
    next(error);
  }
});

router.delete('/gigs/:id', async (req, res, next) => {
  try {
    const gig = await ServiceGig.findByIdAndDelete(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json({ message: 'Gig deleted' });
  } catch (error) {
    next(error);
  }
});

router.get('/listings', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.vertical) filter.vertical = req.query.vertical;
    const listings = await Listing.find(filter).populate('owner', 'email').sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    next(error);
  }
});

router.patch('/listings/:id/moderate', async (req, res, next) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, adminNotes: req.body.adminNotes },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (error) {
    next(error);
  }
});

router.delete('/listings/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findByIdAndDelete(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Listing deleted' });
  } catch (error) {
    next(error);
  }
});

router.get('/applications', async (_req, res, next) => {
  try {
    const applications = await JobApplication.find()
      .populate('job', 'title employer')
      .populate('applicant', 'email isEmailVerified isVerifiedByAdmin')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

router.post('/messages', async (req, res, next) => {
  try {
    const message = await AdminMessage.create({ ...req.body, admin: req.user._id });
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

router.get('/reviews', async (_req, res, next) => {
  try {
    const reviews = await Review.find().populate('reviewer targetUser', 'email').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

async function resyncReviewRatings({ targetUser, serviceGig }) {
  if (targetUser) {
    const approved = await Review.find({ targetUser, status: 'approved' });
    const avg = approved.length ? approved.reduce((sum, item) => sum + item.rating, 0) / approved.length : 0;
    await Profile.findOneAndUpdate({ user: targetUser }, { ratingAverage: avg, ratingCount: approved.length });
  }

  if (serviceGig) {
    const approved = await Review.find({ serviceGig, status: 'approved' });
    const avg = approved.length ? approved.reduce((sum, item) => sum + item.rating, 0) / approved.length : 0;
    await ServiceGig.findByIdAndUpdate(serviceGig, { ratingAverage: avg, ratingCount: approved.length });
  }
}

router.put('/reviews/:id', async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { rating: req.body.rating, feedback: req.body.feedback },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: 'Review not found' });

    await resyncReviewRatings(review);
    res.json(review);
  } catch (error) {
    next(error);
  }
});

router.delete('/reviews/:id', async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    await resyncReviewRatings(review);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
});

router.get('/locations', async (_req, res, next) => {
  try {
    const locations = await Location.find().sort({ country: 1 });
    res.json(locations);
  } catch (error) {
    next(error);
  }
});

router.post('/locations', async (req, res, next) => {
  try {
    const cities = String(req.body.cities || '')
      .split(',')
      .map((city) => city.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    const location = await Location.findOneAndUpdate(
      { country: req.body.country },
      {
        country: req.body.country,
        iso2: req.body.iso2,
        isActive: req.body.isActive ?? true,
        ...(cities.length ? { cities } : {})
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(location);
  } catch (error) {
    next(error);
  }
});

router.patch('/locations/:id', async (req, res, next) => {
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      {
        country: req.body.country,
        iso2: req.body.iso2,
        isActive: req.body.isActive
      },
      { new: true }
    );
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json(location);
  } catch (error) {
    next(error);
  }
});

router.post('/locations/:id/cities', async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ message: 'Location not found' });

    const cityName = String(req.body.name || '').trim();
    if (!cityName) return res.status(400).json({ message: 'City name is required' });

    const existing = location.cities.find((city) => city.name.toLowerCase() === cityName.toLowerCase());
    if (existing) {
      existing.isActive = true;
    } else {
      location.cities.push({ name: cityName });
    }

    await location.save();
    res.status(201).json(location);
  } catch (error) {
    next(error);
  }
});

router.patch('/locations/:id/cities/:cityId', async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ message: 'Location not found' });

    const city = location.cities.id(req.params.cityId);
    if (!city) return res.status(404).json({ message: 'City not found' });

    if (req.body.name !== undefined) city.name = req.body.name;
    if (req.body.isActive !== undefined) city.isActive = req.body.isActive;

    await location.save();
    res.json(location);
  } catch (error) {
    next(error);
  }
});

export default router;
