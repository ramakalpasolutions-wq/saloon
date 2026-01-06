import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
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
            as: 'staff',
          },
        },
        {
          $lookup: {
            from: 'services',
            localField: '_id',
            foreignField: 'salonId',
            as: 'services',
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray();

    console.log('📊 Salons found:', salons.length);
    
    // ✨ Log salon IDs to verify format
    if (salons.length > 0) {
      console.log('🔍 Sample salon IDs:', salons.map(s => ({
        _id: s._id,
        _idString: s._id.toString(),
        name: s.name
      })));
    }

    // Format response
    const formattedSalons = salons.map((salon) => ({
      _id: salon._id.toString(), // Convert ObjectId to string
      name: salon.name,
      description: salon.description,
      phone: salon.phone,
      email: salon.email,
      address: salon.address,
      googleMapsLink: salon.googleMapsLink,
      coordinates: salon.coordinates || [78.4867, 17.385],
      latitude: salon.coordinates?.[1] || 17.385,
      longitude: salon.coordinates?.[0] || 78.4867,
      logo: salon.logo,
      images: salon.images,
      openingHours: salon.openingHours,
      rating: salon.rating || 0,
      totalReviews: salon.totalReviews || 0,
      status: salon.status,
      queueCount: salon.queueCount || 0,
      isActive: salon.isActive !== false,
      adminId: salon.adminData?.[0]
        ? {
            _id: salon.adminData[0]._id.toString(),
            name: salon.adminData[0].name,
            email: salon.adminData[0].email,
            phone: salon.adminData[0].phone,
          }
        : null,
      staff: salon.staff || [],
      services: salon.services || [],
      createdAt: salon.createdAt,
    }));

    return Response.json({
      success: true,
      salons: formattedSalons,
      total: formattedSalons.length,
    });
  } catch (error) {
    console.error('❌ Error fetching salons:', error);
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
