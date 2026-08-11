import mongoose from 'mongoose';
import { VERTICAL_SLUGS } from '../constants/verticals.js';

const listingSchema = new mongoose.Schema(
  {
    vertical: { type: String, enum: VERTICAL_SLUGS, required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: String,
    description: { type: String, required: true },
    price: Number,
    country: String,
    city: String,
    images: [String],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNotes: String,
    details: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

listingSchema.index({ title: 'text', description: 'text', category: 'text' });

export default mongoose.model('Listing', listingSchema);
