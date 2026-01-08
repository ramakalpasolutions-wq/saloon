import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    console.log('📋 Fetching services for salon:', id);

    // Try both salonId and salon fields
    const services = await Service.find({
      $or: [
        { salonId: id },
        { salon: id }
      ]
    })
      .select('name description price duration category')
      .lean();

    console.log(`✅ Found ${services.length} services`);
    console.log('Services:', services);

    return NextResponse.json({
      success: true,
      services: services,
      count: services.length
    });

  } catch (error) {
    console.error('❌ Error fetching services:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch services',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
