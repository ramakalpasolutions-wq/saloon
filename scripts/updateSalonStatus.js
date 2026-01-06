const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  console.log('Looking for .env.local at:', envPath);
  
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    const lines = envFile.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) return;
      
      const match = trimmedLine.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    });
    console.log('✅ Loaded .env.local');
  } else {
    console.error('❌ .env.local file not found!');
    process.exit(1);
  }
}

loadEnv();

// Check if MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.error('Please check your .env.local file');
  process.exit(1);
}

console.log('MongoDB URI found:', process.env.MONGODB_URI.substring(0, 30) + '...');

const SalonSchema = new mongoose.Schema({
  name: String,
  status: String,
  adminId: mongoose.Schema.Types.ObjectId,
  description: String,
  phone: String,
  email: String,
  address: Object,
  createdAt: Date,
  updatedAt: Date,
}, { strict: false });

const Salon = mongoose.models.Salon || mongoose.model('Salon', SalonSchema);

async function updateSalons() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update all salons without status or with null status to 'approved'
    const result = await Salon.updateMany(
      { $or: [{ status: { $exists: false } }, { status: null }, { status: '' }] },
      { $set: { status: 'approved', updatedAt: new Date() } }
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Updated salons:', result.modifiedCount);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Show all salons
    const salons = await Salon.find({});
    console.log(`\nTotal Salons Found: ${salons.length}\n`);
    
    if (salons.length === 0) {
      console.log('⚠️  No salons found in database');
    } else {
      console.log('All Salons:');
      salons.forEach((salon, index) => {
        console.log(`\n${index + 1}. ${salon.name}`);
        console.log(`   Status: ${salon.status || 'NOT SET'}`);
        console.log(`   Phone: ${salon.phone || 'N/A'}`);
        console.log(`   Email: ${salon.email || 'N/A'}`);
        console.log(`   ID: ${salon._id}`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await mongoose.connection.close();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Error:', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await mongoose.connection.close();
    process.exit(1);
  }
}

updateSalons();
