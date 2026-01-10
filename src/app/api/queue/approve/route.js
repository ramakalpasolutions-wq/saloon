import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';
import { verifySalonAdmin } from '@/lib/salonAuth';

export async function POST(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    await connectDB();

    const { queueId, action, rejectionReason } = await request.json();

    if (!queueId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`📋 ${action} booking:`, queueId);

    const queueEntry = await Queue.findById(queueId);

    if (!queueEntry) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify booking belongs to this salon
    if (queueEntry.salon.toString() !== auth.salonId.toString()) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
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
      queueEntry.approvedBy = auth.userId; // If you have user ID in auth
      queueEntry.approvedAt = new Date();
      
      await queueEntry.save();

      console.log('✅ Booking approved:', queueId);

      // ✅ TODO: Send SMS/Email notification to customer
      // await sendApprovalNotification(queueEntry);

      return NextResponse.json({
        success: true,
        message: 'Booking approved successfully',
        queueEntry,
      });

    } else if (action === 'reject') {
      // ✅ REJECT BOOKING
      queueEntry.status = 'rejected';
      queueEntry.rejectionReason = rejectionReason || 'Booking not available';
      queueEntry.approvedBy = auth.userId;
      queueEntry.approvedAt = new Date();
      
      await queueEntry.save();

      console.log('❌ Booking rejected:', queueId);

      // ✅ TODO: Initiate refund if payment was made
      if (queueEntry.paymentStatus === 'paid') {
        console.log('💰 Refund needed for:', queueEntry.razorpayPaymentId);
        // await initiateRefund(queueEntry);
      }

      // ✅ TODO: Send rejection notification
      // await sendRejectionNotification(queueEntry);

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
