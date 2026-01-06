const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  role: {
    type: String,
    enum: ['main-admin', 'salon-admin', 'customer'],
    default: 'customer',
  },
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createMainAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'main-admin' });
    if (existingAdmin) {
      console.log('Main admin already exists!');
      console.log('Email:', existingAdmin.email);
      process.exit(0);
    }

    // Create main admin
    const hashedPassword = await bcryptjs.hash('admin123', 12);
    
    const admin = await User.create({
      name: 'Main Administrator',
      email: 'admin@greensaloon.com',
      phone: '+919876543210',
      password: hashedPassword,
      role: 'main-admin',
      isActive: true,
    });

    console.log('✅ Main Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createMainAdmin();
