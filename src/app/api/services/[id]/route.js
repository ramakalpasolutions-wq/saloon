import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import Salon from '@/models/Salon';
import { getUserFromRequest } from '@/lib/auth';
import { deleteImage } from '@/lib/cloudinary';

// GET - Get single service
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const service = await Service.findById(id).populate('salonId', 'name address');

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Get service error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

// PUT - Update service
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

    const service = await Service.findById(id);
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (userData.role === 'salon-admin' && service.salonId.toString() !== userData.salonId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // If updating image, delete old one
    if (data.image?.publicId && service.image?.publicId && data.image.publicId !== service.image.publicId) {
      await deleteImage(service.image.publicId);
    }

    const updatedService = await Service.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({
      success: true,
      service: updatedService,
    });
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE - Delete service
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

    const service = await Service.findById(id);
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (userData.role === 'salon-admin' && service.salonId.toString() !== userData.salonId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete image from Cloudinary
    if (service.image?.publicId) {
      await deleteImage(service.image.publicId);
    }

    // Remove from salon's services array
    await Salon.findByIdAndUpdate(service.salonId, {
      $pull: { services: service._id },
    });

    await Service.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
