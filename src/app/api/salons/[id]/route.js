import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';
import { getTokenFromRequest } from '@/lib/getToken';

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
    
    const salons = await db.collection('salons').aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'adminId',
          foreignField: '_id',
          as: 'adminData',
        },
      },
      {
        $lookup: {
          from: 'staff',
          localField: '_id',
          foreignField: 'salonId',
          as: 'staff',
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: 'salonId',
          as: 'services',
        },
      },
    ]).toArray();

    if (!salons || salons.length === 0) {
      console.error('❌ Salon not found with ID:', id);
      return Response.json({ 
        success: false, 
        error: 'Salon not found' 
      }, { status: 404 });
    }

    const salon = salons[0];

    console.log('✅ Found salon:', salon.name);

    return Response.json({ 
      success: true, 
      salon: {
        ...salon,
        _id: salon._id.toString(),
        adminId: salon.adminData?.[0] ? {
          _id: salon.adminData[0]._id.toString(),
          name: salon.adminData[0].name,
          email: salon.adminData[0].email,
          phone: salon.adminData[0].phone,
        } : null,
        staff: salon.staff.map(s => ({
          ...s,
          _id: s._id.toString(),
        })),
        services: salon.services.map(s => ({
          ...s,
          _id: s._id.toString(),
        })),
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
    
    // Authentication check
    const token = getTokenFromRequest(request);
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = verifyToken(token);
    if (!userData || userData.role !== 'main-admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
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

    // Prepare update data
    const updateData = { ...body };
    delete updateData._id; // Remove _id from update
    delete updateData.createdAt; // Preserve original createdAt
    
    const result = await db.collection('salons').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
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
    
    // Authentication check
    const token = getTokenFromRequest(request);
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = verifyToken(token);
    if (!userData || userData.role !== 'main-admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
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
    
    // Check if salon exists
    const salon = await db.collection('salons').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!salon) {
      console.error('❌ Salon not found with ID:', id);
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
