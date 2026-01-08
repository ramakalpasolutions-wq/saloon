import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  category: {
    type: String,
    trim: true
  },
  salon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    url: String,
    public_id: String
  }
}, {
  timestamps: true
});

ServiceSchema.index({ salon: 1, isActive: 1 });

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);
