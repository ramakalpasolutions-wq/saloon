import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Salon from '@/models/Salon';
import { getUserFromRequest } from '@/lib/auth';

// GET - Get single booking
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const booking = await Booking.findById(id)
      .populate('salonId', 'name address phone')
      .populate('staffId', 'name specialty');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PUT - Update booking
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const userData = getUserFromRequest(request);

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (userData?.role === 'salon-admin' && booking.salonId.toString() !== userData.salonId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const data = await request.json();
    data.updatedAt = new Date();

    const updatedBooking = await Booking.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel booking
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update status to cancelled instead of deleting
    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    await booking.save();

    // Decrease salon queue count if booking was pending/confirmed
    if (['pending', 'confirmed'].includes(booking.status)) {
      await Salon.findByIdAndUpdate(booking.salonId, {
        $inc: { queueCount: -1 },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
