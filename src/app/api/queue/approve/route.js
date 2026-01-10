import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';
import { getServerSession } from 'next-auth';

export async function POST(request) {
  try {
    await connectDB();

    // ✅ Check if user is salon admin (add your auth logic)
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { queueId, action, rejectionReason } = await request.json();

    if (!queueId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const queueEntry = await Queue.findById(queueId);

    if (!queueEntry) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (queueEntry.status !== 'pending-approval') {
      return NextResponse.json(
        { success: false, error: 'Booking already processed' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // ✅ APPROVE BOOKING
      queueEntry.status = 'confirmed';
      queueEntry.approvedBy = session.user.id;
      queueEntry.approvedAt = new Date();
      
      await queueEntry.save();

      // ✅ TODO: Send SMS/Email notification to customer
      // sendApprovalNotification(queueEntry);

      return NextResponse.json({
        success: true,
        message: 'Booking approved successfully',
        queueEntry,
      });

    } else if (action === 'reject') {
      // ✅ REJECT BOOKING
      queueEntry.status = 'rejected';
      queueEntry.rejectionReason = rejectionReason || 'No slots available';
      queueEntry.approvedBy = session.user.id;
      queueEntry.approvedAt = new Date();
      
      await queueEntry.save();

      // ✅ TODO: Refund payment if already paid
      // ✅ TODO: Send rejection notification
      // sendRejectionNotification(queueEntry);

      return NextResponse.json({
        success: true,
        message: 'Booking rejected',
        queueEntry,
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Approval error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
