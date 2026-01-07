import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    console.log('🔍 Public API called');
    await connectDB();
    console.log('✅ DB Connected');
    
    // Fetch all salons with any coordinate format
    const salons = await Salon.find({
      $or: [
        { latitude: { $exists: true, $ne: null } },
        { coordinates: { $exists: true, $ne: null } }
      ]
    })
      .select('name phone address logo rating totalReviews googleMapsLink latitude longitude coordinates status')
      .sort({ createdAt: -1 })
      .lean();

    console.log('📊 Total salons in DB:', salons.length);
    
    // ✅ Process salons - extract coordinates from array if needed
    const processedSalons = salons.map(salon => {
      let lat = salon.latitude;
      let lng = salon.longitude;
      
      // If no direct lat/lng, extract from coordinates array
      if ((!lat || !lng) && salon.coordinates && Array.isArray(salon.coordinates) && salon.coordinates.length === 2) {
        lng = salon.coordinates[0]; // [longitude, latitude]
        lat = salon.coordinates[1];
        console.log(`📍 Extracted coords for ${salon.name}: [${lng}, ${lat}]`);
      }
      
      return {
        ...salon,
        latitude: lat,
        longitude: lng
      };
    });
    
    // Filter valid salons
    const validSalons = processedSalons.filter(salon => 
      salon.latitude && 
      salon.longitude && 
      typeof salon.latitude === 'number' && 
      typeof salon.longitude === 'number' &&
      !isNaN(salon.latitude) &&
      !isNaN(salon.longitude)
    );
    
    console.log('✅ Valid salons with coordinates:', validSalons.length);
    
    if (validSalons.length > 0) {
      console.log('📍 Sample salon:', {
        name: validSalons[0].name,
        lat: validSalons[0].latitude,
        lng: validSalons[0].longitude,
        status: validSalons[0].status
      });
    } else {
      console.warn('⚠️ No valid salons found. Check database coordinates.');
    }

    return NextResponse.json({ 
      success: true, 
      salons: validSalons,
      count: validSalons.length,
      total: salons.length
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('❌ Public API Error:', error);
    return NextResponse.json({ 
      success: false, 
      salons: [],
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
