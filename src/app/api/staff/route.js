import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Staff from '@/models/Staff';
import Salon from '@/models/Salon';
import { getUserFromRequest } from '@/lib/auth';
import { deleteImage } from '@/lib/cloudinary';

// GET - Get all staff (filtered by salon)
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get('salonId');
    const userData = getUserFromRequest(request);

    let query = {};

    // If salon admin, only show their staff
    if (userData?.role === 'salon-admin') {
      query.salonId = userData.salonId;
    } else if (salonId) {
      query.salonId = salonId;
    }

    const staff = await Staff.find(query)
      .populate('salonId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

// POST - Create new staff member
export async function POST(request) {
  try {
    await connectDB();
    const userData = getUserFromRequest(request);

    if (!userData || !['salon-admin', 'main-admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { name, specialty, image, rating, experience, phone, email, workingDays, salonId } = data;

    // If salon admin, use their salon ID
    const finalSalonId = userData.role === 'salon-admin' ? userData.salonId : salonId;

    const staff = await Staff.create({
      name,
      specialty,
      image,
      rating,
      experience,
      phone,
      email,
      workingDays,
      salonId: finalSalonId,
    });

    // Add staff to salon
    await Salon.findByIdAndUpdate(finalSalonId, {
      $push: { staff: staff._id },
    });

    return NextResponse.json({
      success: true,
      staff,
      message: 'Staff member added successfully',
    });
  } catch (error) {
    console.error('Create staff error:', error);
    return NextResponse.json(
      { error: 'Failed to create staff' },
      { status: 500 }
    );
  }
}
