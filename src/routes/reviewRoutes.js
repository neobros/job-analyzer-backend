import express from 'express';
import Review from '../models/Review.js';
import Profile from '../models/Profile.js';
import ServiceGig from '../models/ServiceGig.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';

const router = express.Router();

async function resyncReviewRatings(review) {
  if (review.targetUser) {
    const approved = await Review.find({ targetUser: review.targetUser, status: 'approved' });
    const avg = approved.length ? approved.reduce((sum, item) => sum + item.rating, 0) / approved.length : 0;
    await Profile.findOneAndUpdate({ user: review.targetUser }, { ratingAverage: avg, ratingCount: approved.length });
  }

  if (review.serviceGig) {
    const approved = await Review.find({ serviceGig: review.serviceGig, status: 'approved' });
    const avg = approved.length ? approved.reduce((sum, item) => sum + item.rating, 0) / approved.length : 0;
    await ServiceGig.findByIdAndUpdate(review.serviceGig, { ratingAverage: avg, ratingCount: approved.length });
  }
}

router.post('/', requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const review = await Review.create({ ...req.body, reviewer: req.user._id });
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

router.get('/user/:userId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ targetUser: req.params.userId, status: 'approved' }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/moderate', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const review = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status, adminNotes: req.body.adminNotes }, { new: true });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    await resyncReviewRatings(review);

    res.json(review);
  } catch (error) {
    next(error);
  }
});

export default router;
