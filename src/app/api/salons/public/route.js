import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';
import Queue from '@/models/Queue';

export async function GET(request) {
  try {
    await connectDB();

    console.log('📍 Fetching public salons...');

    // Get only approved salons
    const salons = await Salon.find({ status: 'approved' })
      .select('name phone email address city state zipCode googleMapsLink location description images')
      .lean();

    console.log(`✅ Found ${salons.length} approved salons`);

    // Get wait times for each salon
    const salonsWithWaitTime = await Promise.all(
      salons.map(async (salon) => {
        // Count waiting customers
        const waitingCount = await Queue.countDocuments({
          salon: salon._id,
          status: 'waiting'
        });

        // Calculate estimated wait time (15 minutes per person)
        const estimatedWaitTime = waitingCount * 15;

        return {
          _id: salon._id,
          name: salon.name,
          phone: salon.phone,
          email: salon.email,
          description: salon.description,
          latitude: salon.location?.coordinates?.[1] || null,
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
          rating: 4 + Math.random(),
          totalReviews: Math.floor(Math.random() * 100) + 10,
          waitingCount,  // ✅ Add waiting count
          estimatedWaitTime,  // ✅ Add wait time
        };
      })
    );

    return NextResponse.json({
      success: true,
      salons: salonsWithWaitTime,
      count: salonsWithWaitTime.length
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
