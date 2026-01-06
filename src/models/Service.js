import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  category: {
    type: String,
    enum: ['haircut', 'coloring', 'styling', 'treatment', 'facial', 'spa', 'other'],
  },
  image: {
    url: String,
    publicId: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);
