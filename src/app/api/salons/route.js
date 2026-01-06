import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { getUserFromRequest } from '@/lib/auth'; // ✅ Use your existing auth

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const radius = parseFloat(searchParams.get('radius')) || 10;

    let query = { status: 'approved' };

    // If coordinates provided, find nearby salons
    if (!isNaN(lat) && !isNaN(lng)) {
      const radiusInRadians = radius / 6371; // Earth radius in km

      query.coordinates = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians]
        }
      };
    }

    const salons = await Salon.find(query)
      .populate('adminId', 'name email phone')
      .select('-__v')
      .lean();

    return NextResponse.json({ salons });
  } catch (error) {
    console.error('Error fetching salons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salons' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // ✅ Check authentication using your JWT auth
    const user = getUserFromRequest(request);
    
    if (!user || user.role !== 'main-admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Main admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      description,
      phone,
      email,
      address,
      coordinates,
      openingHours,
      logo,
      images,
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
    } = body;

    // Validate required fields
    if (!name || !phone || !email || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin email already exists' },
        { status: 400 }
      );
    }

    // Check if salon email already exists
    const existingSalon = await Salon.findOne({ email });
    if (existingSalon) {
      return NextResponse.json(
        { error: 'Salon email already exists' },
        { status: 400 }
      );
    }

    // Create admin user
    const hashedPassword = await hashPassword(adminPassword);
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      phone: adminPhone || '',
      password: hashedPassword,
      role: 'salon-admin',
      isActive: true,
    });

    // Create salon
    const salon = await Salon.create({
      name,
      description: description || '',
      phone,
      email,
      address,
      coordinates: coordinates || [78.4867, 17.385], // Default coordinates
      adminId: admin._id,
      status: 'approved',
      openingHours: openingHours || [
        { day: 'Monday', open: '09:00', close: '21:00', isClosed: false },
        { day: 'Tuesday', open: '09:00', close: '21:00', isClosed: false },
        { day: 'Wednesday', open: '09:00', close: '21:00', isClosed: false },
        { day: 'Thursday', open: '09:00', close: '21:00', isClosed: false },
        { day: 'Friday', open: '09:00', close: '21:00', isClosed: false },
        { day: 'Saturday', open: '09:00', close: '21:00', isClosed: false },
        { day: 'Sunday', open: '09:00', close: '21:00', isClosed: false },
      ],
      logo: logo || null,
      images: images || [],
    });

    return NextResponse.json({
      success: true,
      salon,
      message: 'Salon created successfully',
    });
  } catch (error) {
    console.error('Error creating salon:', error);
    return NextResponse.json(
      { error: 'Failed to create salon' },
      { status: 500 }
    );
  }
}
