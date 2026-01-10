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
    index: true // ✅ This creates index 1
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
    type: Number,
    default: 0
  },
  
  // Appointment Date & Time
  appointmentDate: {
    type: String,
    trim: true
  },
  appointmentTime: {
    type: String,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'waiting',
    index: true // ✅ This creates index 2
  },
  
  // Timestamps
  checkInTime: {
    type: Date,
    default: Date.now,
    index: true // ✅ This creates index 3
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
  
  // ✅ ENHANCED PAYMENT FIELDS
  amount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    // ❌ REMOVE THIS LINE - It's the duplicate!
    // index: true  // <-- DELETE THIS LINE
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'netbanking', 'wallet'],
    default: 'cash'
  },
  // ✅ Razorpay Payment IDs
  razorpayOrderId: {
    type: String,
    trim: true,
    sparse: true // ✅ Add sparse for optional fields
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    sparse: true // ✅ Add sparse for optional fields
  },
  razorpaySignature: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  },
  
  // Notifications
  notificationSent: {
    type: Boolean,
    default: false
  },
  
  // Customer User Reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// ✅ OPTIMIZED COMPOUND INDEXES
QueueSchema.index({ salon: 1, status: 1, checkInTime: -1 }); // Query by salon + status + time
QueueSchema.index({ salon: 1, queueNumber: 1 }); // Query by salon + queue number
QueueSchema.index({ customerPhone: 1, salon: 1 }); // Query by customer phone
QueueSchema.index({ appointmentDate: 1, appointmentTime: 1 }); // Query by appointment
QueueSchema.index({ salon: 1, paymentStatus: 1 }); // ✅ CHANGED: Compound index instead of single
// ❌ REMOVED: QueueSchema.index({ paymentStatus: 1 }); // Delete this duplicate line

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

// Static method to get next queue number for specific date
QueueSchema.statics.getNextQueueNumberForDate = async function(salonId, appointmentDate) {
  const lastQueue = await this.findOne({
    salon: salonId,
    appointmentDate: appointmentDate
  }).sort({ queueNumber: -1 });
  
  return lastQueue ? lastQueue.queueNumber + 1 : 1;
};

// Method to format appointment date/time
QueueSchema.methods.getFormattedAppointment = function() {
  if (!this.appointmentDate || !this.appointmentTime) {
    return null;
  }
  return `${this.appointmentDate} at ${this.appointmentTime}`;
};

// ✅ Method to check if payment is required
QueueSchema.methods.isPaymentRequired = function() {
  return this.amount > 0 && this.paymentStatus === 'pending';
};

// ✅ Method to mark as paid
QueueSchema.methods.markAsPaid = async function(paymentDetails) {
  this.paymentStatus = 'paid';
  this.razorpayOrderId = paymentDetails.razorpay_order_id;
  this.razorpayPaymentId = paymentDetails.razorpay_payment_id;
  this.razorpaySignature = paymentDetails.razorpay_signature;
  this.paidAt = new Date();
  return await this.save();
};

delete mongoose.models.Queue;

export default mongoose.model('Queue', QueueSchema);
