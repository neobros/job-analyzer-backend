import mongoose from 'mongoose';

const adminMessageSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'JobApplication' },
    subject: String,
    body: { type: String, required: true },
    status: { type: String, enum: ['open', 'sent', 'resolved'], default: 'open' }
  },
  { timestamps: true }
);

export default mongoose.model('AdminMessage', adminMessageSchema);
