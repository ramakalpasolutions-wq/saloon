import mongoose from 'mongoose';

const QueueSchema = new mongoose.Schema({
  // Customer Info
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Salon Reference
  salon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  
  // Service Details
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  serviceName: {
    type: String,
    trim: true
  },
  
  // Staff Assignment
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  
  // Queue Information
  queueNumber: {
    type: Number,
    required: true
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  
  // ✅ NEW: Appointment Date & Time
  appointmentDate: {
    type: String, // Store as "2026-01-08"
    trim: true
  },
  appointmentTime: {
    type: String, // Store as "14:30"
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'waiting',
    index: true
  },
  
  // Timestamps
  checkInTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  startTime: {
    type: Date
  },
  completionTime: {
    type: Date
  },
  
  // Notes
  notes: {
    type: String,
    trim: true
  },
  
  // Payment
  amount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  
  // Notifications
  notificationSent: {
    type: Boolean,
    default: false
  },
  
  // Customer User Reference (if registered)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
QueueSchema.index({ salon: 1, status: 1, checkInTime: -1 });
QueueSchema.index({ salon: 1, queueNumber: 1 });
QueueSchema.index({ customerPhone: 1, salon: 1 });
QueueSchema.index({ appointmentDate: 1, appointmentTime: 1 }); // ✅ NEW INDEX

// Method to get position in queue
QueueSchema.methods.getQueuePosition = async function() {
  const count = await this.model('Queue').countDocuments({
    salon: this.salon,
    status: 'waiting',
    queueNumber: { $lt: this.queueNumber }
  });
  return count + 1;
};

// Static method to get next queue number for a salon
QueueSchema.statics.getNextQueueNumber = async function(salonId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastQueue = await this.findOne({
    salon: salonId,
    checkInTime: { $gte: today }
  }).sort({ queueNumber: -1 });
  
  return lastQueue ? lastQueue.queueNumber + 1 : 1;
};

// ✅ NEW: Static method to get next queue number for specific date
QueueSchema.statics.getNextQueueNumberForDate = async function(salonId, appointmentDate) {
  const lastQueue = await this.findOne({
    salon: salonId,
    appointmentDate: appointmentDate
  }).sort({ queueNumber: -1 });
  
  return lastQueue ? lastQueue.queueNumber + 1 : 1;
};

// ✅ NEW: Method to format appointment date/time
QueueSchema.methods.getFormattedAppointment = function() {
  if (!this.appointmentDate || !this.appointmentTime) {
    return null;
  }
  
  return `${this.appointmentDate} at ${this.appointmentTime}`;
};

// ✅ Delete cached model to force reload
delete mongoose.models.Queue;

export default mongoose.model('Queue', QueueSchema);
