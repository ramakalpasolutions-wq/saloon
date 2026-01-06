import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Salon from '../src/models/Salon.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function deleteTestUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete test users
    const testEmails = ['john@glamour.com', 'jane@style.com'];
    
    const deletedUsers = await User.deleteMany({ 
      email: { $in: testEmails } 
    });
    
    console.log(`Deleted ${deletedUsers.deletedCount} test users`);

    // Delete associated salons
    const deletedSalons = await Salon.deleteMany({ 
      email: { $in: ['glamour@example.com', 'style@example.com'] } 
    });
    
    console.log(`Deleted ${deletedSalons.deletedCount} test salons`);

    await mongoose.connection.close();
    console.log('✅ Cleanup complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteTestUsers();
