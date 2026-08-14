import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    preferredTime: String,
    notes: String,
    status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
    adminNotes: String
  },
  { timestamps: true }
);

export default mongoose.model('Appointment', appointmentSchema);
