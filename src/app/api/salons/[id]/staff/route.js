import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Staff from '@/models/Staff';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    console.log('👨‍💼 Fetching staff for salon:', id);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid salon ID'
      }, { status: 400 });
    }

    // Find active staff for this salon
    const staff = await Staff.find({ 
      salon: id,
      isActive: true  // ✅ Only show active staff
    })
      .select('name email phone role specialization specialties experience photo rating totalReviews')
      .sort({ createdAt: -1 })
      .lean();

    console.log('✅ Found', staff.length, 'staff members for salon', id);

    return NextResponse.json({
      success: true,
      staff,
      count: staff.length
    });

  } catch (error) {
    console.error('❌ Error fetching staff:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch staff',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
