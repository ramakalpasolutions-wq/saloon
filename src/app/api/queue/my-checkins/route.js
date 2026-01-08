import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';
import Salon from '@/models/Salon';
import Service from '@/models/Service';

export async function POST(request) {
  try {
    console.log('📞 My Check-ins API called');
    
    await connectDB();
    console.log('✅ Database connected');

    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number required' },
        { status: 400 }
      );
    }

    console.log('🔍 Searching for phone:', phone);

    // Find all queue entries for this phone number
    const checkins = await Queue.find({ 
      customerPhone: phone 
    })
      .sort({ checkInTime: -1 })  // ✅ Use checkInTime instead of checkedInAt
      .lean();

    console.log(`✅ Found ${checkins.length} check-ins`);

    // Manually populate salon and service (singular, not services)
    const populatedCheckins = await Promise.all(
      checkins.map(async (checkin) => {
        // Populate salon
        const salon = checkin.salon 
          ? await Salon.findById(checkin.salon).select('name address city phone').lean()
          : null;

        // Populate service (singular)
        const service = checkin.service 
          ? await Service.findById(checkin.service).select('name price duration').lean()
          : null;

        return {
          ...checkin,
          salon,
          services: service ? [service] : [],  // Convert to array for frontend compatibility
          position: checkin.queueNumber,
        };
      })
    );

    return NextResponse.json({
      success: true,
      checkins: populatedCheckins,
      count: populatedCheckins.length
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch check-ins',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
