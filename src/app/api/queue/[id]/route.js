import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    console.log('📋 Fetching queue entry:', id);

    const queueEntry = await Queue.findById(id)
      .populate('service', 'name price duration category')  // ✅ service (singular)
      .populate('salon', 'name address city phone')
      .populate('staff', 'name specialization')
      .lean();

    if (!queueEntry) {
      return NextResponse.json(
        { success: false, error: 'Queue entry not found' },
        { status: 404 }
      );
    }

    // Convert service to services array for frontend
    const responseEntry = {
      ...queueEntry,
      services: queueEntry.service ? [queueEntry.service] : [],
      position: queueEntry.queueNumber,
      checkedInAt: queueEntry.checkInTime,  // Map checkInTime to checkedInAt
    };

    console.log('✅ Queue entry found:', responseEntry);

    return NextResponse.json({
      success: true,
      queueEntry: responseEntry,
    });

  } catch (error) {
    console.error('❌ Error fetching queue entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch queue entry' },
      { status: 500 }
    );
  }
}
