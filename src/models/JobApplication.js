import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverLetter: String,
    cvFile: String,
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'shortlisted', 'admin_contacted', 'rejected', 'hired'],
      default: 'submitted'
    },
    adminMessageThread: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdminMessage' }]
  },
  { timestamps: true }
);

jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export default mongoose.model('JobApplication', jobApplicationSchema);
