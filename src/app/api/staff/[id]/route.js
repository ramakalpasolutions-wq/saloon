import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Staff from '@/models/Staff';
import Salon from '@/models/Salon';
import { getUserFromRequest } from '@/lib/auth';
import { deleteImage } from '@/lib/cloudinary';

// GET - Get single staff member
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const staff = await Staff.findById(id).populate('salonId', 'name address');

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff member' },
      { status: 500 }
    );
  }
}

// PUT - Update staff member
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const userData = getUserFromRequest(request);

    if (!userData || !['salon-admin', 'main-admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Check if salon admin owns this staff member
    if (userData.role === 'salon-admin' && staff.salonId.toString() !== userData.salonId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // If updating image, delete old one
    if (data.image?.publicId && staff.image?.publicId && data.image.publicId !== staff.image.publicId) {
      await deleteImage(staff.image.publicId);
    }

    const updatedStaff = await Staff.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({
      success: true,
      staff: updatedStaff,
    });
  } catch (error) {
    console.error('Update staff error:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

// DELETE - Delete staff member
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const userData = getUserFromRequest(request);

    if (!userData || !['salon-admin', 'main-admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (userData.role === 'salon-admin' && staff.salonId.toString() !== userData.salonId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete image from Cloudinary
    if (staff.image?.publicId) {
      await deleteImage(staff.image.publicId);
    }

    // Remove from salon's staff array
    await Salon.findByIdAndUpdate(staff.salonId, {
      $pull: { staff: staff._id },
    });

    await Staff.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}
