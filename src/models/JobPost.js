import mongoose from 'mongoose';

const jobPostSchema = new mongoose.Schema(
  {
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    salary: String,
    country: String,
    city: String,
    type: { type: String, enum: ['full_time', 'part_time', 'contract', 'remote', 'freelance'], default: 'full_time' },
    skills: [{ type: String, trim: true }],
    description: { type: String, required: true },
    requirements: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'closed'], default: 'pending' },
    isFeatured: { type: Boolean, default: false },
    adminNotes: String
  },
  { timestamps: true }
);

jobPostSchema.index({ title: 'text', description: 'text', skills: 'text', category: 'text' });

export default mongoose.model('JobPost', jobPostSchema);
