import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Staff from '@/models/Staff';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    console.log('👨‍💼 Fetching staff for salon:', id);

    // Find all active staff for this salon (public view, no auth needed)
    const staff = await Staff.find({ 
      salonId: id,  // or salon: id, depending on your schema
      isActive: true  // Only show active staff
    })
      .select('name specialization experience photo role specialties rating')
      .lean();

    console.log(`✅ Found ${staff.length} staff members`);

    return NextResponse.json({
      success: true,
      staff: staff,
      count: staff.length
    });

  } catch (error) {
    console.error('❌ Error fetching staff:', error);
    return NextResponse.json(
      { 
        success: false, 
        staff: [],  // Return empty array instead of error
        error: 'Failed to fetch staff',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
