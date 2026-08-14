import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    profilePhoto: String,
    skills: [{ type: String, trim: true }],
    experience: String,
    cvFile: String,
    cvFileName: String,
    about: String,
    country: String,
    city: String,
    hiddenContact: {
      email: String,
      website: String
    },
    company: {
      name: String,
      website: String,
      size: String,
      description: String
    },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Profile', profileSchema);
