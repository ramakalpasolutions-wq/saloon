import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { extractCoordinatesFromGoogleMaps } from '@/lib/extractCoordinates';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      description,
      phone,
      email,
      address,
      googleMapsLink,
      openingHours,
      logo,
      images,
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
    } = body;

    console.log('📝 Creating new salon:', name);
    console.log('🗺️ Google Maps Link:', googleMapsLink);

    // Extract coordinates from Google Maps link
    let coordinates = [78.4867, 17.385]; // Default: Hyderabad
    if (googleMapsLink) {
      const extractedCoords = await extractCoordinatesFromGoogleMaps(googleMapsLink);
      if (extractedCoords) {
        coordinates = extractedCoords;
        console.log('✅ Coordinates extracted:', coordinates);
      } else {
        console.log('⚠️ Could not extract coordinates, using default');
      }
    }

    // Check if salon email already exists
    const existingSalon = await Salon.findOne({ email });
    if (existingSalon) {
      return Response.json(
        { error: 'A salon with this email already exists' },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return Response.json(
        { error: 'An admin with this email already exists' },
        { status: 400 }
      );
    }

    // Hash admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: hashedPassword,
      role: 'salon-admin',
      isActive: true,
    });

    console.log('✅ Admin created:', adminEmail);

    // Create salon
    const salon = await Salon.create({
      name,
      description,
      phone,
      email,
      address,
      coordinates,
      googleMapsLink,
      openingHours,
      logo,
      images,
      adminId: admin._id,
      status: 'approved',
    });

    console.log('✅ Salon created:', salon._id);

    return Response.json({
      success: true,
      message: 'Salon created successfully',
      salon,
    });
  } catch (error) {
    console.error('❌ Error creating salon:', error);
    return Response.json(
      { error: 'Failed to create salon', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    // Get only approved salons for public access
    const salons = await Salon.find({ status: 'approved' })
      .populate('adminId', 'name email phone isActive')
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({
      success: true,
      salons,
      total: salons.length,
    });
  } catch (error) {
    console.error('Error fetching salons:', error);
    return Response.json(
      { error: 'Failed to fetch salons', message: error.message },
      { status: 500 }
    );
  }
}
