import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';
import { getTokenFromRequest } from '@/lib/getToken';

// GET all salons
export async function GET(request) {
  try {
    console.log('🔍 Fetching all salons...');

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saloon');

    console.log('✅ Database connected');

    // Fetch all salons with admin details
    const salons = await db
      .collection('salons')
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'adminId',
            foreignField: '_id',
            as: 'adminData',
          },
        },
        {
          $lookup: {
            from: 'staff',
            localField: '_id',
            foreignField: 'salonId',
            as: 'staffData',
          },
        },
        {
          $lookup: {
            from: 'services',
            localField: '_id',
            foreignField: 'salonId',
            as: 'servicesData',
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray();

    console.log('📊 Salons found:', salons.length);
    
    if (salons.length > 0) {
      console.log('🔍 Sample salon:', {
        _id: salons[0]._id.toString(),
        name: salons[0].name,
        hasAdmin: !!salons[0].adminData?.[0],
        staffCount: salons[0].staffData?.length || 0,
        servicesCount: salons[0].servicesData?.length || 0,
      });
    }

    // Format response
    const formattedSalons = salons.map((salon) => {
      const coordinates = salon.coordinates || [78.4867, 17.385];
      
      return {
        _id: salon._id.toString(),
        name: salon.name || 'Unnamed Salon',
        description: salon.description || '',
        phone: salon.phone || '',
        email: salon.email || '',
        address: salon.address || '',
        googleMapsLink: salon.googleMapsLink || '',
        coordinates: coordinates,
        latitude: coordinates[1] || 17.385,
        longitude: coordinates[0] || 78.4867,
        logo: salon.logo || '',
        images: salon.images || [],
        openingHours: salon.openingHours || {},
        rating: salon.rating || 0,
        totalReviews: salon.totalReviews || 0,
        status: salon.status || 'pending',
        queueCount: salon.queueCount || 0,
        isActive: salon.isActive !== false,
        adminId: salon.adminData?.[0]
          ? {
              _id: salon.adminData[0]._id.toString(),
              name: salon.adminData[0].name,
              email: salon.adminData[0].email,
              phone: salon.adminData[0].phone || '',
            }
          : null,
        staffCount: salon.staffData?.length || 0,
        servicesCount: salon.servicesData?.length || 0,
        staff: salon.staffData?.map(s => ({
          _id: s._id.toString(),
          name: s.name,
          specialty: s.specialty,
          image: s.image,
        })) || [],
        services: salon.servicesData?.map(s => ({
          _id: s._id.toString(),
          name: s.name,
          price: s.price,
          duration: s.duration,
        })) || [],
        createdAt: salon.createdAt || new Date(),
        updatedAt: salon.updatedAt || new Date(),
      };
    });

    console.log('✅ Formatted salons:', formattedSalons.length);

    return Response.json({
      success: true,
      salons: formattedSalons,
      total: formattedSalons.length,
    });
  } catch (error) {
    console.error('❌ Error fetching salons:', error);
    console.error('❌ Stack trace:', error.stack);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch salons',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create new salon
export async function POST(request) {
  try {
    console.log('📝 Creating new salon...');

    // Check authentication
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return Response.json({ 
        error: 'Unauthorized - No token found' 
      }, { status: 401 });
    }

    const userData = verifyToken(token);
    
    if (!userData) {
      return Response.json({ 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }

    // Only main-admin can create salons
    if (userData.role !== 'main-admin') {
      return Response.json({ 
        error: 'Unauthorized - Only main admin can create salons' 
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      phone,
      email,
      address,
      googleMapsLink,
      logo,
      images,
      openingHours,
      adminId,
    } = body;

    console.log('📦 Request body:', { name, email, adminId });

    // Validation
    if (!name || !email || !phone || !address) {
      return Response.json({ 
        error: 'Name, email, phone, and address are required' 
      }, { status: 400 });
    }

    if (!adminId) {
      return Response.json({ 
        error: 'Admin ID is required' 
      }, { status: 400 });
    }

    if (!ObjectId.isValid(adminId)) {
      return Response.json({ 
        error: 'Invalid admin ID format' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saloon');

    // Check if admin exists
    const admin = await db.collection('users').findOne({
      _id: new ObjectId(adminId),
    });

    if (!admin) {
      return Response.json({ 
        error: 'Admin user not found' 
      }, { status: 404 });
    }

    // Check if admin already has a salon
    const existingSalon = await db.collection('salons').findOne({
      adminId: new ObjectId(adminId),
    });

    if (existingSalon) {
      return Response.json({ 
        error: 'This admin already has a salon assigned' 
      }, { status: 400 });
    }

    // Extract coordinates from Google Maps link if provided
    let coordinates = [78.4867, 17.385]; // Default coordinates
    if (googleMapsLink) {
      const { extractCoordinatesFromGoogleMapsLink } = await import('@/lib/googleMapsHelper');
      const extracted = extractCoordinatesFromGoogleMapsLink(googleMapsLink);
      if (extracted) {
        coordinates = [extracted.longitude, extracted.latitude];
      }
    }

    // Create salon
    const salonData = {
      name,
      description: description || '',
      phone,
      email,
      address,
      googleMapsLink: googleMapsLink || '',
      coordinates,
      logo: logo || '',
      images: images || [],
      openingHours: openingHours || {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '18:00', closed: false },
        sunday: { open: '09:00', close: '18:00', closed: false },
      },
      adminId: new ObjectId(adminId),
      staff: [],
      services: [],
      rating: 0,
      totalReviews: 0,
      status: 'pending',
      queueCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('💾 Inserting salon data...');

    const result = await db.collection('salons').insertOne(salonData);

    console.log('✅ Salon created with ID:', result.insertedId.toString());

    return Response.json({
      success: true,
      message: 'Salon created successfully',
      salon: {
        _id: result.insertedId.toString(),
        ...salonData,
        adminId: adminId,
        coordinates,
      },
    });

  } catch (error) {
    console.error('❌ Create salon error:', error);
    console.error('❌ Error stack:', error.stack);
    return Response.json({
      success: false,
      error: 'Failed to create salon',
      message: error.message,
    }, { status: 500 });
  }
}
