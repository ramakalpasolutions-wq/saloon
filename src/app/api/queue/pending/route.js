import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';
import Service from '@/models/Service'; // ✅ ADD THIS LINE
import Staff from '@/models/Staff'; // ✅ ADD THIS IF YOU POPULATE STAFF
import { verifySalonAdmin } from '@/lib/salonAuth';

export async function GET(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    await connectDB();

    const salonId = auth.salonId;
    console.log('📋 Fetching pending bookings for salon:', salonId);

    // ✅ GET ALL PENDING APPROVALS
    const pendingBookings = await Queue.find({
      salon: salonId,
      status: 'pending-approval',
    })
      .populate('services', 'name price duration') // Now Service model is imported
      .populate('staff', 'name specialization') // Now Staff model is imported
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${pendingBookings.length} pending bookings`);

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
