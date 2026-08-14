import express from 'express';
import mongoose from 'mongoose';
import AdminMessage from '../models/AdminMessage.js';
import ServiceGig from '../models/ServiceGig.js';
import User from '../models/User.js';
import { requireAuth, requireRole, requireVerifiedEmail } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

function sortBySellerPriority(a, b) {
  const badgeDifference = Number(Boolean(b.seller?.hasPriorityBadge)) - Number(Boolean(a.seller?.hasPriorityBadge));
  if (badgeDifference) return badgeDifference;
  const ratingDifference = Number(b.ratingAverage || 0) - Number(a.ratingAverage || 0);
  if (ratingDifference) return ratingDifference;
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
}

router.get('/', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    const filter = { status: 'approved' };
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    const gigs = await ServiceGig.find(filter).populate('seller', 'isVerifiedByAdmin hasPriorityBadge').sort({ ratingAverage: -1, createdAt: -1 }).limit(100);
    res.json(gigs.sort(sortBySellerPriority).slice(0, 50));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Service gig not found' });
    }

    const gig = await ServiceGig.findOne({ _id: req.params.id, status: 'approved' })
      .populate('seller', 'isVerifiedByAdmin hasPriorityBadge');

    if (!gig) return res.status(404).json({ message: 'Service gig not found' });
    res.json(gig);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/contact-request', requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Service gig not found' });
    }

    const gig = await ServiceGig.findOne({ _id: req.params.id, status: 'approved' });
    if (!gig) return res.status(404).json({ message: 'Service gig not found' });
    if (String(gig.seller) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot request contact checking for your own service gig' });
    }

    const admin = await User.findOne({ role: 'admin', isBlocked: false }).select('_id');
    if (!admin) return res.status(503).json({ message: 'No admin account is available for contact checking yet' });

    const message = await AdminMessage.create({
      admin: admin._id,
      sender: req.user._id,
      recipient: gig.seller,
      subject: `Service request: ${gig.title}`,
      body: `${req.user.email} requested admin contact checking for "${gig.title}". Keep buyer and seller contact hidden until review is complete.`,
      status: 'open'
    });

    res.status(201).json({
      message: 'Service request sent to admin for contact checking.',
      request: message
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireVerifiedEmail, requireRole('supplier', 'admin'), upload.array('portfolioImages', 6), async (req, res, next) => {
  try {
    const gig = await ServiceGig.create({
      ...req.body,
      seller: req.user._id,
      portfolioImages: req.files?.map((file) => file.path) || []
    });
    res.status(201).json(gig);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, requireVerifiedEmail, upload.array('portfolioImages', 6), async (req, res, next) => {
  try {
    const payload = { ...req.body, status: 'pending' };
    if (req.files?.length) payload.portfolioImages = req.files.map((file) => file.path);
    const gig = await ServiceGig.findOneAndUpdate({ _id: req.params.id, seller: req.user._id }, payload, { new: true });
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json(gig);
  } catch (error) {
    next(error);
  }
});

export default router;
