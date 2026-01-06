import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  customerPhone: {
    type: String,
    required: true,
  },
  customerName: String,
  services: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
    name: String,
    price: Number,
    duration: Number,
  }],
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
  },
  staffName: String,
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending',
  },
  queuePosition: Number,
  estimatedWaitTime: Number,
  totalAmount: Number,
  notes: String,
  rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
