import mongoose from 'mongoose';

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { _id: true }
);

const locationSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true, unique: true },
    iso2: { type: String, trim: true, uppercase: true },
    isActive: { type: Boolean, default: true },
    cities: [citySchema]
  },
  { timestamps: true }
);

locationSchema.index({ 'cities.name': 1 });

export default mongoose.model('Location', locationSchema);
