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
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
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
  
  // ✅ UPDATED STATUS - Added approval statuses
  status: {
    type: String,
    enum: [
      'pending-approval',  // ✅ NEW - Waiting for salon approval
      'confirmed',         // ✅ NEW - Approved by salon
      'rejected',          // ✅ NEW - Rejected by salon
      'waiting',           // In queue
      'in-progress',       // Service started
      'completed',         // Service done
      'cancelled',         // Cancelled
      'no-show'            // Didn't show up
    ],
    default: 'pending-approval', // ✅ CHANGED - Start with pending
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
  
  // ✅ ENHANCED PAYMENT FIELDS
  amount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'netbanking', 'wallet'],
    default: 'cash'
  },
  razorpayOrderId: {
    type: String,
    trim: true,
    sparse: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    sparse: true
  },
  razorpaySignature: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  },
  
  // ✅ APPROVAL FIELDS
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
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
QueueSchema.index({ salon: 1, status: 1, checkInTime: -1 });
QueueSchema.index({ salon: 1, queueNumber: 1 });
QueueSchema.index({ customerPhone: 1, salon: 1 });
QueueSchema.index({ appointmentDate: 1, appointmentTime: 1 });
QueueSchema.index({ salon: 1, paymentStatus: 1 });

// Method to get position in queue
QueueSchema.methods.getQueuePosition = async function() {
  const count = await this.model('Queue').countDocuments({
    salon: this.salon,
    status: { $in: ['confirmed', 'waiting'] }, // ✅ Only count confirmed bookings
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
