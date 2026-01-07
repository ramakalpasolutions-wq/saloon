import mongoose from 'mongoose';

const SalonSchema = new mongoose.Schema({
  // Basic Info
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  
  // ✅ COORDINATES - Support both formats
  coordinates: { 
    type: [Number], // [longitude, latitude] for MongoDB geospatial queries
    validate: {
      validator: function(v) {
        return !v || (Array.isArray(v) && v.length === 2);
      },
      message: 'Coordinates must be [longitude, latitude]'
    }
  },
  latitude: { type: Number },  // Direct field for easy access
  longitude: { type: Number }, // Direct field for easy access
  
  // Contact
  phone: { 
    type: String,
    trim: true
  },
  email: { 
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Address
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    fullAddress: { type: String, trim: true }
  },
  
  // Google Maps
  googleMapsLink: { 
    type: String,
    trim: true
  },
  
  // Media
  logo: {
    url: String,
    public_id: String
  },
  images: [{
    url: String,
    public_id: String
  }],
  
  // Ratings
  rating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  
  // Admin
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // Business Hours
  openingHours: [{
    day: String,
    open: String,
    close: String,
    closed: { type: Boolean, default: false }
  }],
  
  // Services
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  
  // Staff
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  }],
  
  // Queue
  queueCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

// ✅ Indexes for better performance
SalonSchema.index({ coordinates: '2dsphere' }); // Geospatial queries
SalonSchema.index({ status: 1 });
SalonSchema.index({ name: 1 });
SalonSchema.index({ latitude: 1, longitude: 1 });

// ✅ Pre-save hook to sync coordinates
SalonSchema.pre('save', function(next) {
  // Sync coordinates array with lat/lng fields
  if (this.latitude && this.longitude && (!this.coordinates || this.coordinates.length !== 2)) {
    this.coordinates = [this.longitude, this.latitude];
  }
  
  // Sync lat/lng fields with coordinates array
  if (this.coordinates && this.coordinates.length === 2 && (!this.latitude || !this.longitude)) {
    this.longitude = this.coordinates[0];
    this.latitude = this.coordinates[1];
  }
  
  next();
});

export default mongoose.models.Salon || mongoose.model('Salon', SalonSchema);
