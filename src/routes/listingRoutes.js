import express from 'express';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { VERTICAL_SLUGS } from '../constants/verticals.js';

const router = express.Router();

function parseDetails(rawDetails) {
  if (!rawDetails) return {};
  if (typeof rawDetails === 'object') return rawDetails;
  try {
    const parsed = JSON.parse(rawDetails);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

router.get('/', async (req, res, next) => {
  try {
    const { q, vertical, category, city, country } = req.query;
    const filter = { status: 'approved' };

    if (vertical) filter.vertical = vertical;
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (city) filter.city = new RegExp(city, 'i');
    if (country) filter.country = new RegExp(country, 'i');

    const listings = await Listing.find(filter).populate('owner', 'email isVerifiedByAdmin').sort({ createdAt: -1 }).limit(100);
    res.json(listings);
  } catch (error) {
    next(error);
  }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const listings = await Listing.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const listing = await Listing.findOne({ _id: req.params.id, status: 'approved' })
      .populate('owner', 'email isVerifiedByAdmin');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireVerifiedEmail, upload.array('images', 8), async (req, res, next) => {
  try {
    if (!VERTICAL_SLUGS.includes(req.body.vertical)) {
      return res.status(400).json({ message: 'Invalid vertical' });
    }

    const listing = await Listing.create({
      ...req.body,
      owner: req.user._id,
      details: parseDetails(req.body.details),
      images: req.files?.map((file) => file.path) || []
    });
    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, requireVerifiedEmail, upload.array('images', 8), async (req, res, next) => {
  try {
    const payload = { ...req.body, status: 'pending', details: parseDetails(req.body.details) };
    if (req.files?.length) payload.images = req.files.map((file) => file.path);
    const listing = await Listing.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, payload, { new: true });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const listing = await Listing.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Listing deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
