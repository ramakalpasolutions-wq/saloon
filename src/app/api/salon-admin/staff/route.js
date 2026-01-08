import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Staff from '@/models/Staff';
import { verifySalonAdmin } from '@/lib/salonAuth'; // ✅ Import

// GET - Fetch staff
export async function GET(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const staff = await Staff.find({ salon: auth.salonId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      staff,
      count: staff.length
    });
  } catch (error) {
    console.error('❌ Staff GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff', staff: [] },
      { status: 500 }
    );
  }
}

// POST - Add staff
export async function POST(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const body = await request.json();
    const { name, email, phone, role, specialties, isActive } = body;

    const newStaff = await Staff.create({
      salon: auth.salonId,
      name,
      email,
      phone,
      role,
      specialties: specialties || [],
      isActive: isActive !== undefined ? isActive : true,
      rating: 0,
      totalReviews: 0
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member added successfully',
      staff: newStaff
    });
  } catch (error) {
    console.error('❌ Staff POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add staff' },
      { status: 500 }
    );
  }
}

// PUT - Update staff
export async function PUT(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const body = await request.json();
    const { staffId, name, email, phone, role, specialties, isActive } = body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (specialties !== undefined) updateData.specialties = specialties;
    if (isActive !== undefined) updateData.isActive = isActive;

    const staff = await Staff.findOneAndUpdate(
      { _id: staffId, salon: auth.salonId },
      updateData,
      { new: true }
    );

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member updated successfully',
      staff
    });
  } catch (error) {
    console.error('❌ Staff PUT Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update staff' },
      { status: 500 }
    );
  }
}

// DELETE - Delete staff
export async function DELETE(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('id');

    const result = await Staff.findOneAndDelete({
      _id: staffId,
      salon: auth.salonId
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('❌ Staff DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete staff' },
      { status: 500 }
    );
  }
}
