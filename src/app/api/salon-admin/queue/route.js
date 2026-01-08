import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';
import { verifySalonAdmin } from '@/lib/salonAuth'; // ✅ Import from shared file

// GET - Fetch queue
export async function GET(request) {
  try {
    const auth = await verifySalonAdmin(); // ✅ Already async
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = { salon: auth.salonId };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const queue = await Queue.find(query)
      .sort({ checkInTime: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      queue,
      count: queue.length
    });
  } catch (error) {
    console.error('❌ Queue GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch queue', queue: [] },
      { status: 500 }
    );
  }
}

// POST - Add customer to queue
export async function POST(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const body = await request.json();
    const { customerName, customerPhone, customerEmail, serviceName, notes } = body;

    // Get next queue number
    const queueNumber = await Queue.getNextQueueNumber(auth.salonId);

    // Calculate estimated wait time
    const waitingCount = await Queue.countDocuments({
      salon: auth.salonId,
      status: 'waiting'
    });
    const estimatedWaitTime = waitingCount * 15;

    const newQueue = await Queue.create({
      salon: auth.salonId,
      customerName,
      customerPhone,
      customerEmail,
      serviceName,
      notes,
      queueNumber,
      estimatedWaitTime,
      status: 'waiting'
    });

    return NextResponse.json({
      success: true,
      message: 'Customer added to queue',
      queue: newQueue
    });
  } catch (error) {
    console.error('❌ Queue POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add customer' },
      { status: 500 }
    );
  }
}

// PUT - Update queue status
export async function PUT(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const body = await request.json();
    const { queueId, status } = body;

    const queue = await Queue.findOne({ _id: queueId, salon: auth.salonId });

    if (!queue) {
      return NextResponse.json(
        { success: false, error: 'Queue item not found' },
        { status: 404 }
      );
    }

    if (status === 'in-progress' && !queue.startTime) {
      queue.startTime = new Date();
    } else if (status === 'completed' && !queue.completionTime) {
      queue.completionTime = new Date();
    }

    queue.status = status;
    await queue.save();

    return NextResponse.json({
      success: true,
      message: 'Queue status updated',
      queue
    });
  } catch (error) {
    console.error('❌ Queue PUT Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update queue' },
      { status: 500 }
    );
  }
}

// DELETE - Remove from queue
export async function DELETE(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const queueId = searchParams.get('id');

    const result = await Queue.findOneAndDelete({
      _id: queueId,
      salon: auth.salonId
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Queue item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Customer removed from queue'
    });
  } catch (error) {
    console.error('❌ Queue DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete' },
      { status: 500 }
    );
  }
}
