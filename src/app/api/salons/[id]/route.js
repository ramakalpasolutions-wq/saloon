import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';
import Staff from '@/models/Staff';
import Service from '@/models/Service';
import Booking from '@/models/Booking';
import User from '@/models/User';
import mongoose from 'mongoose';
import { extractCoordinatesFromGoogleMaps } from '@/lib/extractCoordinates';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    const salon = await Salon.findById(id)
      .populate('adminId', 'name email phone isActive')
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
        updateData.location = {
          type: 'Point',
          coordinates: extractedCoords
        };
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
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { error: 'Invalid salon ID' },
        { status: 400 }
      );
    }

    await connectDB();

    console.log('🗑️ Starting cascade delete for salon:', id);

    // Find the salon first to get adminId
    const salon = await Salon.findById(id).lean();
    
    if (!salon) {
      return Response.json(
        { error: 'Salon not found' },
        { status: 404 }
      );
    }

    const adminId = salon.adminId;
    console.log('📧 Admin ID to delete:', adminId);

    // ✅ 1. Delete all staff members
    const deletedStaff = await Staff.deleteMany({ 
      $or: [
        { salon: id },
        { salonId: id }
      ]
    });
    console.log(`✅ Deleted ${deletedStaff.deletedCount} staff members`);

    // ✅ 2. Delete all services
    const deletedServices = await Service.deleteMany({ 
      $or: [
        { salon: id },
        { salonId: id }
      ]
    });
    console.log(`✅ Deleted ${deletedServices.deletedCount} services`);

    // ✅ 3. Delete all bookings
    const deletedBookings = await Booking.deleteMany({ 
      $or: [
        { salon: id },
        { salonId: id }
      ]
    });
    console.log(`✅ Deleted ${deletedBookings.deletedCount} bookings`);

    // ✅ 4. Delete queue entries (if exists)
    try {
      const Queue = mongoose.models.Queue || (await import('@/models/Queue')).default;
      const deletedQueue = await Queue.deleteMany({ 
        $or: [
          { salon: id },
          { salonId: id }
        ]
      });
      console.log(`✅ Deleted ${deletedQueue.deletedCount} queue entries`);
    } catch (error) {
      console.log('⚠️ Queue model not found, skipping...');
    }

    // ✅ 5. Delete reviews (if exists)
    try {
      const Review = mongoose.models.Review || (await import('@/models/Review')).default;
      const deletedReviews = await Review.deleteMany({ 
        $or: [
          { salon: id },
          { salonId: id }
        ]
      });
      console.log(`✅ Deleted ${deletedReviews.deletedCount} reviews`);
    } catch (error) {
      console.log('⚠️ Review model not found, skipping...');
    }

    // ✅ 6. Unlink users from salon
    const unlinkedUsers = await User.updateMany(
      { salonId: id },
      { $unset: { salonId: "" } }
    );
    console.log(`✅ Unlinked ${unlinkedUsers.modifiedCount} users from salon`);

    // ✅ 7. Delete the admin user
    let deletedAdmin = null;
    if (adminId) {
      deletedAdmin = await User.findByIdAndDelete(adminId);
      if (deletedAdmin) {
        console.log(`✅ Deleted admin user: ${deletedAdmin.email}`);
      } else {
        console.log('⚠️ Admin user not found or already deleted');
      }
    }

    // ✅ 8. Finally delete the salon
    await Salon.findByIdAndDelete(id);
    console.log('✅ Salon deleted successfully');

    return Response.json({
      success: true,
      message: 'Salon and all related data deleted successfully',
      deleted: {
        salonName: salon.name,
        adminEmail: deletedAdmin?.email || 'N/A',
        staff: deletedStaff.deletedCount,
        services: deletedServices.deletedCount,
        bookings: deletedBookings.deletedCount,
        usersUnlinked: unlinkedUsers.modifiedCount
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
