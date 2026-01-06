import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import Salon from '@/models/Salon';
import { getUserFromRequest } from '@/lib/auth';

// GET - Get all services
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salonId');
    const userData = getUserFromRequest(request);

    let query = {};

    // If salon admin, only show their services
    if (userData?.role === 'salon-admin') {
      query.salonId = userData.salonId;
    } else if (salonId) {
      query.salonId = salonId;
    }

    const services = await Service.find(query)
      .populate('salonId', 'name')
      .sort({ category: 1, name: 1 });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST - Create new service
export async function POST(request) {
  try {
    await connectDB();
    const userData = getUserFromRequest(request);

    if (!userData || !['salon-admin', 'main-admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { name, description, price, duration, category, image, salonId } = data;

    // If salon admin, use their salon ID
    const finalSalonId = userData.role === 'salon-admin' ? userData.salonId : salonId;

    const service = await Service.create({
      name,
      description,
      price,
      duration,
      category,
      image,
      salonId: finalSalonId,
    });

    // Add service to salon
    await Salon.findByIdAndUpdate(finalSalonId, {
      $push: { services: service._id },
    });

    return NextResponse.json({
      success: true,
      service,
      message: 'Service created successfully',
    });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
