import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';
import Staff from '@/models/Staff';
import Service from '@/models/Service';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { extractCoordinatesFromGoogleMaps } from '@/lib/extractCoordinates';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    const salon = await Salon.findById(id)
      .populate('adminId', 'name email phone isActive')
      .populate('staff')
      .populate('services')
      .lean();

    if (!salon) {
      return Response.json(
        { error: 'Salon not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      salon,
    });
  } catch (error) {
    console.error('Error fetching salon:', error);
    return Response.json(
      { error: 'Failed to fetch salon', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    const body = await request.json();
    const { googleMapsLink, ...updateData } = body;

    console.log('📝 Updating salon:', id);
    console.log('🗺️ New Google Maps Link:', googleMapsLink);

    // If Google Maps link changed, extract new coordinates
    if (googleMapsLink) {
      const extractedCoords = await extractCoordinatesFromGoogleMaps(googleMapsLink);
      if (extractedCoords) {
        updateData.coordinates = extractedCoords;
        console.log('✅ New coordinates extracted:', extractedCoords);
      } else {
        console.log('⚠️ Could not extract new coordinates, keeping old ones');
      }
      updateData.googleMapsLink = googleMapsLink;
    }

    const salon = await Salon.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('adminId', 'name email phone isActive');

    if (!salon) {
      return Response.json(
        { error: 'Salon not found' },
        { status: 404 }
      );
    }

    console.log('✅ Salon updated successfully');

    return Response.json({
      success: true,
      message: 'Salon updated successfully',
      salon,
    });
  } catch (error) {
    console.error('❌ Error updating salon:', error);
    return Response.json(
      { error: 'Failed to update salon', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    console.log('🗑️ Starting cascade delete for salon:', id);

    // Find the salon first to get adminId
    const salon = await Salon.findById(id);
    if (!salon) {
      return Response.json(
        { error: 'Salon not found' },
        { status: 404 }
      );
    }

    const adminId = salon.adminId;
    console.log('📧 Admin ID to delete:', adminId);

    // 1. Delete all related staff
    const deletedStaff = await Staff.deleteMany({ salonId: id });
    console.log(`✅ Deleted ${deletedStaff.deletedCount} staff members`);

    // 2. Delete all related services
    const deletedServices = await Service.deleteMany({ salonId: id });
    console.log(`✅ Deleted ${deletedServices.deletedCount} services`);

    // 3. Delete all related bookings
    const deletedBookings = await Booking.deleteMany({ salonId: id });
    console.log(`✅ Deleted ${deletedBookings.deletedCount} bookings`);

    // 4. Delete the admin user account
    let deletedAdmin = null;
    if (adminId) {
      deletedAdmin = await User.findByIdAndDelete(adminId);
      if (deletedAdmin) {
        console.log(`✅ Deleted admin user: ${deletedAdmin.email}`);
      } else {
        console.log('⚠️ Admin user not found or already deleted');
      }
    }

    // 5. Finally delete the salon
    await Salon.findByIdAndDelete(id);
    console.log('✅ Salon deleted successfully');

    return Response.json({
      success: true,
      message: 'Salon and all related data deleted successfully',
      deleted: {
        salon: salon.name,
        adminEmail: deletedAdmin?.email || 'N/A',
        staff: deletedStaff.deletedCount,
        services: deletedServices.deletedCount,
        bookings: deletedBookings.deletedCount,
      },
    });
  } catch (error) {
    console.error('❌ Error deleting salon:', error);
    return Response.json(
      { error: 'Failed to delete salon', message: error.message },
      { status: 500 }
    );
  }
}
