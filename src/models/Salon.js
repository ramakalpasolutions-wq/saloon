import mongoose from 'mongoose';

const SalonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    fullAddress: String,
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    default: [78.4867, 17.385], // Default: Hyderabad
    index: '2dsphere', // Enable geospatial queries
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  logo: {
    url: String,
    publicId: String,
  },
  images: [{
    url: String,
    publicId: String,
    type: { type: String, default: 'gallery' },
  }],
  openingHours: [{
    day: String,
    open: String,
    close: String,
    isClosed: { type: Boolean, default: false },
  }],
  rating: {
    type: Number,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
  }],
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  rejectionReason: String,
  queueCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Salon || mongoose.model('Salon', SalonSchema);
