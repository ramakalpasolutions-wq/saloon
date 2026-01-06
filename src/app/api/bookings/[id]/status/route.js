import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Salon from '@/models/Salon';
import { getUserFromRequest } from '@/lib/auth';

// PUT - Update booking status (confirm/reject/complete)
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const userData = getUserFromRequest(request);

    // Only salon admin can update booking status
    if (!userData || !['salon-admin', 'main-admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if salon admin owns this booking
    if (userData.role === 'salon-admin' && booking.salonId.toString() !== userData.salonId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { status, rejectionReason } = await request.json();

    if (!['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const oldStatus = booking.status;
    booking.status = status;
    booking.updatedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
      booking.rejectionReason = rejectionReason;
    }

    await booking.save();

    // Update salon queue count
    if (oldStatus === 'pending' && status === 'confirmed') {
      // No change needed, already in queue
    } else if (['cancelled', 'rejected', 'completed'].includes(status)) {
      // Remove from queue
      await Salon.findByIdAndUpdate(booking.salonId, {
        $inc: { queueCount: -1 },
      });
    }

    return NextResponse.json({
      success: true,
      booking,
      message: `Booking ${status} successfully`,
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}
