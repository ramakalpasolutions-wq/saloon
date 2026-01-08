import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import { verifySalonAdmin } from '@/lib/salonAuth'; // ✅ Import

// GET - Fetch services
export async function GET(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const services = await Service.find({ salon: auth.salonId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      services,
      count: services.length
    });
  } catch (error) {
    console.error('❌ Services GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services', services: [] },
      { status: 500 }
    );
  }
}

// POST - Add service
export async function POST(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const body = await request.json();
    const { name, description, price, duration, category } = body;

    const newService = await Service.create({
      salon: auth.salonId,
      name,
      description,
      price: parseFloat(price),
      duration: parseInt(duration),
      category,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      message: 'Service added successfully',
      service: newService
    });
  } catch (error) {
    console.error('❌ Services POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add service' },
      { status: 500 }
    );
  }
}

// PUT - Update service
export async function PUT(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const body = await request.json();
    const { serviceId, name, description, price, duration, category } = body;

    const service = await Service.findOneAndUpdate(
      { _id: serviceId, salon: auth.salonId },
      {
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        category
      },
      { new: true }
    );

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('❌ Services PUT Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE - Delete service
export async function DELETE(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('id');

    const result = await Service.findOneAndDelete({
      _id: serviceId,
      salon: auth.salonId
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('❌ Services DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
