import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifySalonAdmin } from '@/lib/salonAuth';

export async function GET() {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      console.error('Dashboard auth error:', auth.error);
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    let Queue;
    try {
      Queue = (await import('@/models/Queue')).default;
    } catch (error) {
      console.log('Queue model not found, returning default stats');
      return NextResponse.json({
        success: true,
        stats: {
          pendingApprovals: 0, // ✅ ADDED
          totalQueue: 0,
          averageWait: 0,
          todayCheckIns: 0,
          todayRevenue: 0
        }
      });
    }

    const salonId = auth.salonId;
    console.log('✅ Dashboard: Using salonId:', salonId);

    // ✅ GET PENDING APPROVALS COUNT
    const pendingApprovals = await Queue.countDocuments({
      salon: salonId,
      status: 'pending-approval'
    });

    // Get current queue count (only confirmed/waiting)
    const totalQueue = await Queue.countDocuments({
      salon: salonId,
      status: { $in: ['confirmed', 'waiting'] } // ✅ UPDATED
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCheckIns = await Queue.countDocuments({
      salon: salonId,
      checkInTime: { $gte: today }
    });

    // Calculate average wait time
    const averageWait = totalQueue > 0 ? Math.floor(totalQueue * 15) : 0;

    // Calculate today's revenue (only paid bookings)
    const revenueResult = await Queue.aggregate([
      {
        $match: {
          salon: salonId,
          checkInTime: { $gte: today },
          paymentStatus: 'paid', // ✅ UPDATED - Only paid bookings
          status: { $in: ['completed', 'in-progress', 'confirmed', 'waiting'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const todayRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    console.log('📊 Dashboard stats:', {
      pendingApprovals,
      totalQueue,
      todayCheckIns,
      todayRevenue
    });

    return NextResponse.json({
      success: true,
      stats: {
        pendingApprovals, // ✅ ADDED
        totalQueue,
        averageWait,
        todayCheckIns,
        todayRevenue
      }
    });
  } catch (error) {
    console.error('❌ Dashboard API Error:', error);
    
    return NextResponse.json({
      success: true,
      stats: {
        pendingApprovals: 0, // ✅ ADDED
        totalQueue: 0,
        averageWait: 0,
        todayCheckIns: 0,
        todayRevenue: 0
      }
    });
  }
}
