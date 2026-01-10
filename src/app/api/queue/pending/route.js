import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';
import { getServerSession } from 'next-auth';

export async function GET(request) {
  try {
    await connectDB();

    // Get salon from session or query
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salonId');

    if (!salonId) {
      return NextResponse.json(
        { success: false, error: 'Salon ID required' },
        { status: 400 }
      );
    }

    // ✅ GET ALL PENDING APPROVALS
    const pendingBookings = await Queue.find({
      salon: salonId,
      status: 'pending-approval',
    })
      .populate('services', 'name price duration')
      .populate('staff', 'name specialization')
      .sort({ checkInTime: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: pendingBookings.length,
      bookings: pendingBookings,
    });

  } catch (error) {
    console.error('❌ Error fetching pending bookings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
