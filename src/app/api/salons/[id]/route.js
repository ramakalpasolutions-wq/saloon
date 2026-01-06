import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET single salon
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('🔍 GET request for salon ID:', id);
    
    if (!ObjectId.isValid(id)) {
      console.error('❌ Invalid ObjectId format:', id);
      return Response.json({ 
        success: false, 
        error: 'Invalid salon ID format' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saloon');
    
    const salon = await db.collection('salons').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!salon) {
      console.error('❌ Salon not found with ID:', id);
      return Response.json({ 
        success: false, 
        error: 'Salon not found' 
      }, { status: 404 });
    }

    console.log('✅ Found salon:', salon.name);

    return Response.json({ 
      success: true, 
      salon: {
        ...salon,
        _id: salon._id.toString(),
        adminId: salon.adminId?.toString(),
      }
    });
  } catch (error) {
    console.error('❌ Error fetching salon:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch salon',
      message: error.message 
    }, { status: 500 });
  }
}

// UPDATE salon
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('🔄 PUT request for salon ID:', id);
    
    if (!ObjectId.isValid(id)) {
      console.error('❌ Invalid ObjectId format:', id);
      return Response.json({ 
        success: false, 
        error: 'Invalid salon ID format' 
      }, { status: 400 });
    }

    const body = await request.json();
    console.log('📝 Update data:', body);
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saloon');
    
    // Check if salon exists first
    const existingSalon = await db.collection('salons').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!existingSalon) {
      console.error('❌ Salon not found with ID:', id);
      return Response.json({ 
        success: false, 
        error: 'Salon not found' 
      }, { status: 404 });
    }

    console.log('✅ Found salon to update:', existingSalon.name);
    
    const result = await db.collection('salons').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...body,
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Update result:', result.modifiedCount, 'documents modified');

    return Response.json({ 
      success: true, 
      message: 'Salon updated successfully' 
    });
  } catch (error) {
    console.error('❌ Error updating salon:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to update salon',
      message: error.message 
    }, { status: 500 });
  }
}

// DELETE salon
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('🗑️ DELETE request for salon ID:', id);
    console.log('🗑️ ID type:', typeof id);
    console.log('🗑️ ID length:', id?.length);
    
    if (!id || id === 'undefined') {
      console.error('❌ Undefined or invalid salon ID');
      return Response.json({ 
        success: false, 
        error: 'Salon ID is required' 
      }, { status: 400 });
    }

    if (!ObjectId.isValid(id)) {
      console.error('❌ Invalid ObjectId format:', id);
      return Response.json({ 
        success: false, 
        error: 'Invalid salon ID format' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saloon');
    
    // First list all salons to verify
    const allSalons = await db.collection('salons').find({}).toArray();
    console.log('📊 Total salons in database:', allSalons.length);
    console.log('🔍 All salon IDs:', allSalons.map(s => s._id.toString()));
    
    // Check if salon exists
    const salon = await db.collection('salons').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!salon) {
      console.error('❌ Salon not found with ID:', id);
      console.error('❌ Searched for ObjectId:', new ObjectId(id));
      
      // Try to find if ID exists in any format
      const salonByString = await db.collection('salons').findOne({ 
        _id: id 
      });
      
      if (salonByString) {
        console.log('⚠️ Found salon with string ID (not ObjectId):', salonByString.name);
        // Handle string ID case
        const result = await db.collection('salons').deleteOne({ _id: id });
        return Response.json({ 
          success: true, 
          message: 'Salon deleted (string ID)',
          deletedId: id
        });
      }
      
      return Response.json({ 
        success: false, 
        error: 'Salon not found in database' 
      }, { status: 404 });
    }

    console.log('✅ Found salon to delete:', salon.name);

    // Delete associated data
    const adminId = salon.adminId;

    // Delete staff
    const staffResult = await db.collection('staff').deleteMany({ 
      salonId: new ObjectId(id) 
    });
    console.log(`🗑️ Deleted ${staffResult.deletedCount} staff members`);

    // Delete services
    const servicesResult = await db.collection('services').deleteMany({ 
      salonId: new ObjectId(id) 
    });
    console.log(`🗑️ Deleted ${servicesResult.deletedCount} services`);

    // Delete bookings/checkins
    const bookingsResult = await db.collection('bookings').deleteMany({ 
      salonId: new ObjectId(id) 
    });
    console.log(`🗑️ Deleted ${bookingsResult.deletedCount} bookings`);

    // Delete the salon
    const salonResult = await db.collection('salons').deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (salonResult.deletedCount === 0) {
      console.error('❌ Failed to delete salon:', id);
      return Response.json({ 
        success: false, 
        error: 'Failed to delete salon from database' 
      }, { status: 500 });
    }

    // Delete admin user
    if (adminId) {
      const adminResult = await db.collection('users').deleteOne({ 
        _id: adminId 
      });
      console.log(`🗑️ Deleted admin user: ${adminResult.deletedCount > 0 ? 'Success' : 'Not found'}`);
    }

    console.log('✅ Salon and all associated data deleted successfully');
    
    return Response.json({ 
      success: true, 
      message: 'Salon and all associated data deleted successfully',
      deletedId: id,
      stats: {
        staff: staffResult.deletedCount,
        services: servicesResult.deletedCount,
        bookings: bookingsResult.deletedCount,
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error deleting salon:', error);
    console.error('❌ Error stack:', error.stack);
    return Response.json({ 
      success: false, 
      error: 'Failed to delete salon',
      message: error.message 
    }, { status: 500 });
  }
}
