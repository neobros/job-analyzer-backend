import mongoose from 'mongoose';

const serviceGigSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 1 },
    description: { type: String, required: true },
    deliveryTime: { type: String, required: true },
    portfolioImages: [String],
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'paused'], default: 'pending' },
    adminNotes: String,
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

serviceGigSchema.index({ title: 'text', description: 'text', category: 'text' });

export default mongoose.model('ServiceGig', serviceGigSchema);
