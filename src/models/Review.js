import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost' },
    serviceGig: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceGig' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNotes: String
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
