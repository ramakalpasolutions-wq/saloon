import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  specialty: {
    type: String,
    required: true,
  },
  image: {
    url: String,
    publicId: String,
  },
  rating: {
    type: Number,
    default: 0,
  },
  experience: {
    type: Number, // years
  },
  phone: String,
  email: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  workingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Staff || mongoose.model('Staff', StaffSchema);
