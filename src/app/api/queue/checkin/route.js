import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';

export async function POST(request) {
  try {
    await connectDB();

    const {
      salonId,
      customerName,
      customerPhone,
      services,
      appointmentDate,
      appointmentTime,
      staffId,
      amount,
      paymentStatus
    } = await request.json();

    console.log('📋 Check-in request:', {
      salonId,
      customerName,
      customerPhone,
      services,
      appointmentDate,
      appointmentTime,
      staffId,
      amount,
      paymentStatus
    });

    // Validate required fields
    if (!salonId || !customerName || !customerPhone || !services || services.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate date and time
    if (!appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { success: false, error: 'Appointment date and time are required' },
        { status: 400 }
      );
    }

    // Get next queue number for this date
    const queueNumber = await Queue.getNextQueueNumberForDate(salonId, appointmentDate);

    // Estimate wait time based on services
    const estimatedWaitTime = services.length * 30; // 30 min per service

    // ✅ CREATE WITH PENDING-APPROVAL STATUS
    const queueEntry = await Queue.create({
      salon: salonId,
      customerName,
      customerPhone,
      services: services, // Array of service IDs
      service: services[0], // First service for compatibility
      staff: staffId || null,
      queueNumber,
      estimatedWaitTime,
      status: 'pending-approval', // ✅ Wait for salon approval
      appointmentDate,
      appointmentTime,
      amount: amount || 0,
      paymentStatus: paymentStatus || 'pending',
      checkInTime: new Date(),
    });

    console.log('✅ Queue entry created:', queueEntry._id);

    // Populate the entry with related data
    const populatedEntry = await Queue.findById(queueEntry._id)
      .populate('salon', 'name address phone')
      .populate('services', 'name price duration')
      .populate('staff', 'name specialization')
      .lean();

    return NextResponse.json({
      success: true,
      message: 'Booking submitted! Waiting for salon approval.',
      queueEntry: populatedEntry,
    });

  } catch (error) {
    console.error('❌ Check-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking', message: error.message },
      { status: 500 }
    );
  }
}
