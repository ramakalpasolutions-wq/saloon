import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Staff from '@/models/Staff';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    console.log('👨‍💼 Fetching staff for salon:', id);
    console.log('🔍 Salon ID type:', typeof id);
    
    // Convert to ObjectId if needed
    let salonObjectId;
    try {
      salonObjectId = new mongoose.Types.ObjectId(id);
      console.log('✅ Converted to ObjectId:', salonObjectId);
    } catch (err) {
      console.error('❌ Invalid ObjectId:', err);
      return NextResponse.json({
        success: false,
        error: 'Invalid salon ID'
      }, { status: 400 });
    }

    // Try multiple query methods
    console.log('🔍 Query 1: Using string ID');
    const staff1 = await Staff.find({ salon: id }).lean();
    console.log('📊 Found with string:', staff1.length);

    console.log('🔍 Query 2: Using ObjectId');
    const staff2 = await Staff.find({ salon: salonObjectId }).lean();
    console.log('📊 Found with ObjectId:', staff2.length);

    // Get ALL staff to see structure
    const allStaff = await Staff.find({}).lean();
    console.log('📊 Total staff in DB:', allStaff.length);
    if (allStaff.length > 0) {
      console.log('📋 First staff salon field:', allStaff[0].salon);
      console.log('📋 First staff salon type:', typeof allStaff[0].salon);
    }

    // Use the one that worked
    const staff = staff1.length > 0 ? staff1 : staff2;

    console.log('✅ Returning', staff.length, 'staff members');

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
