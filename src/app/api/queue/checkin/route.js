import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';

export async function POST(request) {
  try {
    await connectDB();

    const { salonId, customerName, customerPhone, services } = await request.json();

    console.log('📋 Check-in request:', { salonId, customerName, customerPhone, services });

    // Validate required fields
    if (!salonId || !customerName || !customerPhone || !services || services.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get next queue number for this salon
    const queueNumber = await Queue.getNextQueueNumber(salonId);

    // Get current queue count for estimated wait time
    const queueCount = await Queue.countDocuments({
      salon: salonId,
      status: 'waiting'
    });

    const estimatedWaitTime = queueCount * 15;

    // ✅ Create queue entry with service (singular) - use first service
    const queueEntry = await Queue.create({
      salon: salonId,
      customerName,
      customerPhone,
      service: services[0],  // ✅ Use first service ID (singular)
      queueNumber,
      estimatedWaitTime,
      status: 'waiting',
    });

    console.log('✅ Queue entry created:', queueEntry);

    return NextResponse.json({
      success: true,
      message: 'Checked in successfully',
      queueEntry: {
        _id: queueEntry._id,
        position: queueEntry.queueNumber,
        queueNumber: queueEntry.queueNumber,
        estimatedWaitTime: queueEntry.estimatedWaitTime,
        status: queueEntry.status,
      },
    });

  } catch (error) {
    console.error('❌ Check-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check in', message: error.message },
      { status: 500 }
    );
  }
}
