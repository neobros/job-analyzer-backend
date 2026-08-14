import express from 'express';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Listing from '../models/Listing.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const { listingId, date, preferredTime, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: 'Invalid listing' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Appointment date is required' });
    }

    const listing = await Listing.findOne({ _id: listingId, status: 'approved' });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const appointment = await Appointment.create({
      listing: listing._id,
      requester: req.user._id,
      date,
      preferredTime,
      notes
    });
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
});

export default router;
