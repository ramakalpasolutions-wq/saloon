const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Read .env.local file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    const lines = envFile.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return;
      
      const match = trimmedLine.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

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

// Salon Schema
const SalonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    fullAddress: String,
  },
  coordinates: { type: [Number], default: [0, 0] },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  logo: {
    url: String,
    publicId: String,
  },
  images: [{
    url: String,
    publicId: String,
  }],
  openingHours: [{
    day: String,
    open: String,
    close: String,
    isClosed: Boolean,
  }],
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'approved',
  },
  queueCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Salon = mongoose.models.Salon || mongoose.model('Salon', SalonSchema);

// Default opening hours
const defaultOpeningHours = [
  { day: 'Monday', open: '09:00', close: '21:00', isClosed: false },
  { day: 'Tuesday', open: '09:00', close: '21:00', isClosed: false },
  { day: 'Wednesday', open: '09:00', close: '21:00', isClosed: false },
  { day: 'Thursday', open: '09:00', close: '21:00', isClosed: false },
  { day: 'Friday', open: '09:00', close: '21:00', isClosed: false },
  { day: 'Saturday', open: '09:00', close: '21:00', isClosed: false },
  { day: 'Sunday', open: '10:00', close: '20:00', isClosed: false },
];

async function bulkCreateSalons(excelFilePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(excelFilePath)) {
      console.error('❌ Excel file not found:', excelFilePath);
      console.log('\n📝 Please create an Excel file with the following columns:');
      console.log('   Salon Name | Description | Phone | Email | Street | City | State | ZIP | Admin Name | Admin Email | Admin Phone | Admin Password');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Read Excel file
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Found ${data.length} salons in Excel file\n`);

    if (data.length === 0) {
      console.error('❌ No data found in Excel file');
      process.exit(1);
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing ${i + 1}/${data.length}: ${row['Salon Name'] || 'Unnamed'}`);
      console.log('='.repeat(60));

      try {
        // Validate required fields
        if (!row['Salon Name'] || !row['Phone'] || !row['Email'] || 
            !row['Admin Name'] || !row['Admin Email'] || !row['Admin Password']) {
          throw new Error('Missing required fields');
        }

        // Check if admin email already exists
        const existingUser = await User.findOne({ email: row['Admin Email'] });
        if (existingUser) {
          console.log(`⚠️  Admin email already exists: ${row['Admin Email']}`);
          console.log('   Skipping this salon...');
          errorCount++;
          errors.push({
            row: i + 1,
            salonName: row['Salon Name'],
            error: 'Admin email already exists',
          });
          continue;
        }

        // Check if salon email already exists
        const existingSalon = await Salon.findOne({ email: row['Email'] });
        if (existingSalon) {
          console.log(`⚠️  Salon email already exists: ${row['Email']}`);
          console.log('   Skipping this salon...');
          errorCount++;
          errors.push({
            row: i + 1,
            salonName: row['Salon Name'],
            error: 'Salon email already exists',
          });
          continue;
        }

        // Create admin user
        console.log('👤 Creating admin user...');
        const hashedPassword = await bcryptjs.hash(row['Admin Password'], 12);
        
        const adminUser = await User.create({
          name: row['Admin Name'],
          email: row['Admin Email'],
          phone: row['Admin Phone'] || '',
          password: hashedPassword,
          role: 'salon-admin',
          isActive: true,
        });

        console.log(`✅ Admin created: ${adminUser.email}`);

        // Create full address
        const fullAddress = `${row['Street'] || ''}, ${row['City'] || ''}, ${row['State'] || ''} ${row['ZIP'] || ''}`.trim();

        // Determine coordinates based on city (you can add more cities)
        let coordinates = [78.4867, 17.385]; // Default: Hyderabad
        const city = (row['City'] || '').toLowerCase();
        
        const cityCoordinates = {
          'hyderabad': [78.4867, 17.385],
          'mumbai': [72.8777, 19.0760],
          'delhi': [77.1025, 28.7041],
          'bangalore': [77.5946, 12.9716],
          'chennai': [80.2707, 13.0827],
          'kolkata': [88.3639, 22.5726],
          'pune': [73.8567, 18.5204],
          'ahmedabad': [72.5714, 23.0225],
        };

        if (cityCoordinates[city]) {
          coordinates = cityCoordinates[city];
        }

        // Create salon
        console.log('🏪 Creating salon...');
        const salon = await Salon.create({
          name: row['Salon Name'],
          description: row['Description'] || '',
          address: {
            street: row['Street'] || '',
            city: row['City'] || '',
            state: row['State'] || '',
            zipCode: row['ZIP'] || '',
            fullAddress: fullAddress,
          },
          coordinates: coordinates,
          phone: row['Phone'],
          email: row['Email'],
          openingHours: defaultOpeningHours,
          adminId: adminUser._id,
          status: 'approved',
          isActive: true,
        });

        console.log(`✅ Salon created: ${salon.name}`);

        // Update admin user with salon ID
        adminUser.salonId = salon._id;
        await adminUser.save();

        console.log('✅ Admin linked to salon');
        console.log(`\n📋 Summary:`);
        console.log(`   Salon: ${salon.name}`);
        console.log(`   Admin: ${adminUser.name} (${adminUser.email})`);
        console.log(`   Location: ${salon.address.city}, ${salon.address.state}`);
        
        successCount++;

      } catch (error) {
        console.error(`\n❌ Error processing row ${i + 1}:`, error.message);
        errorCount++;
        errors.push({
          row: i + 1,
          salonName: row['Salon Name'] || 'Unknown',
          error: error.message,
        });
      }
    }

    // Final summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${successCount} salons`);
    console.log(`❌ Failed: ${errorCount} salons`);
    console.log(`📝 Total processed: ${data.length} rows`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`   Row ${err.row} (${err.salonName}): ${err.error}`);
      });
    }

    console.log('\n✅ Bulk creation completed!');
    console.log('='.repeat(60));

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Get Excel file path from command line argument
const excelFilePath = process.argv[2] || path.join(__dirname, '..', 'salons-data.xlsx');

console.log('🚀 Starting bulk salon creation...');
console.log(`📁 Excel file: ${excelFilePath}\n`);

bulkCreateSalons(excelFilePath);
