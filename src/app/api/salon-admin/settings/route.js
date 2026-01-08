import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';
import { verifySalonAdmin } from '@/lib/salonAuth'; // ✅ Import

// GET - Fetch salon settings
export async function GET(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const salon = await Salon.findById(auth.salonId)
      .select('-__v')
      .lean();

    if (!salon) {
      return NextResponse.json(
        { success: false, error: 'Salon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      salon
    });
  } catch (error) {
    console.error('❌ Settings GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update salon settings
export async function PUT(request) {
  try {
    const auth = await verifySalonAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const body = await request.json();
    const { 
      name, 
      phone, 
      email, 
      address, 
      googleMapsLink, 
      description, 
      logo,
      isActive 
    } = body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (googleMapsLink !== undefined) updateData.googleMapsLink = googleMapsLink;
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;
    if (isActive !== undefined) updateData.isActive = isActive;

    const salon = await Salon.findByIdAndUpdate(
      auth.salonId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!salon) {
      return NextResponse.json(
        { success: false, error: 'Salon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      salon
    });
  } catch (error) {
    console.error('❌ Settings PUT Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
