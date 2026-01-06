import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Salon from '@/models/Salon';
import { getUserFromRequest } from '@/lib/auth';

// GET - Get all bookings
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salonId');
    const status = searchParams.get('status');
    const phone = searchParams.get('phone');
    const userData = getUserFromRequest(request);

    let query = {};

    // If salon admin, only show their bookings
    if (userData?.role === 'salon-admin') {
      query.salonId = userData.salonId;
    } else if (salonId) {
      query.salonId = salonId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by customer phone
    if (phone) {
      query.customerPhone = phone;
    }

    const bookings = await Booking.find(query)
      .populate('salonId', 'name address phone')
      .populate('staffId', 'name specialty')
      .sort({ appointmentDate: -1, createdAt: -1 });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST - Create new booking (from customer check-in)
export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const {
      salonId,
      customerPhone,
      customerName,
      services,
      staffId,
      staffName,
      appointmentDate,
      appointmentTime,
      notes,
    } = data;

    // Calculate total amount and duration
    const totalAmount = services.reduce((sum, service) => sum + (service.price || 0), 0);
    const totalDuration = services.reduce((sum, service) => sum + (service.duration || 0), 0);

    // Get current queue count for the salon
    const queueCount = await Booking.countDocuments({
      salonId,
      status: { $in: ['pending', 'confirmed'] },
      appointmentDate: new Date(appointmentDate),
    });

    const booking = await Booking.create({
      salonId,
      customerPhone,
      customerName,
      services,
      staffId,
      staffName,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      totalAmount,
      estimatedWaitTime: totalDuration,
      queuePosition: queueCount + 1,
      notes,
      status: 'pending',
    });

    // Update salon queue count
    await Salon.findByIdAndUpdate(salonId, {
      $inc: { queueCount: 1 },
    });

    return NextResponse.json({
      success: true,
      booking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
