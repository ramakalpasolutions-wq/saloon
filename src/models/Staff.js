import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
  // ⚠️ CHECK THIS FIELD NAME - it should match your database
  salon: {  // or salonId
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: String,
  phone: String,
  role: {
    type: String,
    default: 'Barber',
  },
  specialization: String,
  specialties: [String],
  experience: Number,
  photo: {
    url: String,
    publicId: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Staff || mongoose.model('Staff', StaffSchema);
