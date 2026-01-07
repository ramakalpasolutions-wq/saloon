import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';
import mongoose from 'mongoose';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('🔍 Status update request');
    console.log('  - Salon ID:', id);
    console.log('  - Valid ObjectId?', mongoose.Types.ObjectId.isValid(id));
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ 
        success: false, 
        error: 'Invalid salon ID format' 
      }, { status: 400 });
    }

    const { status } = await request.json();
    console.log('  - New status:', status);

    if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      return Response.json({ 
        success: false, 
        error: 'Invalid status. Must be: pending, approved, rejected, or suspended' 
      }, { status: 400 });
    }

    await connectDB();
    
    // Find the salon first to log current status
    const currentSalon = await Salon.findById(id);
    if (!currentSalon) {
      console.error('❌ Salon not found with ID:', id);
      return Response.json({ 
        success: false, 
        error: 'Salon not found' 
      }, { status: 404 });
    }

    console.log('  - Current status:', currentSalon.status);
    console.log('  - Salon name:', currentSalon.name);
    
    // Update the status
    currentSalon.status = status;
    currentSalon.updatedAt = new Date();
    await currentSalon.save();

    console.log('✅ Status updated successfully');
    console.log('  - New status:', currentSalon.status);

    return Response.json({ 
      success: true, 
      message: `Status updated to ${status}`,
      salon: {
        _id: currentSalon._id,
        name: currentSalon.name,
        status: currentSalon.status
      }
    });
  } catch (error) {
    console.error('❌ Error updating status:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to update status',
      message: error.message 
    }, { status: 500 });
  }
}
