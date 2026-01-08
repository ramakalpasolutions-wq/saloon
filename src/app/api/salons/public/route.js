import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';

export async function GET(request) {
  try {
    await connectDB();

    console.log('📍 Fetching public salons...');

    // Get only approved salons
    const salons = await Salon.find({ status: 'approved' })
      .select('name phone email address city state zipCode googleMapsLink location description images')
      .lean();

    console.log(`✅ Found ${salons.length} approved salons`);

    // Transform data to include latitude, longitude, and fullAddress
    const transformedSalons = salons.map(salon => ({
      _id: salon._id,
      name: salon.name,
      phone: salon.phone,
      email: salon.email,
      description: salon.description,
      latitude: salon.location?.coordinates?.[1] || null,  // GeoJSON format: [lng, lat]
      longitude: salon.location?.coordinates?.[0] || null,
      googleMapsLink: salon.googleMapsLink,
      address: {
        fullAddress: `${salon.address || ''}, ${salon.city || ''}, ${salon.state || ''} ${salon.zipCode || ''}`.trim(),
        street: salon.address,
        city: salon.city,
        state: salon.state,
        zipCode: salon.zipCode,
      },
      logo: salon.images?.[0] || null,
      rating: 4 + Math.random(), // Random rating for now
    }));

    return NextResponse.json({
      success: true,
      salons: transformedSalons,
      count: transformedSalons.length
    });

  } catch (error) {
    console.error('❌ Error fetching public salons:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch salons',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
