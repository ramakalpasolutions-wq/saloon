import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saloon');

    console.log('🧹 Starting orphaned users cleanup...');

    // Find all salon-admin users
    const salonAdmins = await db.collection('users')
      .find({ role: 'salon-admin' })
      .toArray();

    console.log(`📊 Found ${salonAdmins.length} salon admin users`);

    const orphanedAdmins = [];

    // Check which admins don't have salons
    for (const admin of salonAdmins) {
      const adminIdToSearch = ObjectId.isValid(admin._id) 
        ? admin._id 
        : new ObjectId(admin._id);

      const salon = await db.collection('salons').findOne({ 
        adminId: adminIdToSearch 
      });

      if (!salon) {
        orphanedAdmins.push({
          _id: admin._id,
          name: admin.name,
          email: admin.email
        });
      }
    }

    console.log(`🗑️ Found ${orphanedAdmins.length} orphaned admin users`);

    // Delete orphaned admins
    if (orphanedAdmins.length > 0) {
      const deletedIds = orphanedAdmins.map(a => a._id);
      const result = await db.collection('users').deleteMany({ 
        _id: { $in: deletedIds } 
      });

      console.log(`✅ Deleted ${result.deletedCount} orphaned admin users`);

      return Response.json({
        success: true,
        message: `Deleted ${result.deletedCount} orphaned admin users`,
        deletedCount: result.deletedCount,
        deletedUsers: orphanedAdmins
      });
    }

    return Response.json({
      success: true,
      message: 'No orphaned users found',
      deletedCount: 0,
      deletedUsers: []
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return Response.json({ 
      success: false,
      error: 'Failed to cleanup orphaned users',
      message: error.message 
    }, { status: 500 });
  }
}
