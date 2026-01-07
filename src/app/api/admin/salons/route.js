import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';

export async function GET(request) {
  try {
    await connectDB();

    console.log('✅ Admin API - Fetching all salons (all statuses)');

    // Get ALL salons (no status filter for admin)
    const salons = await Salon.find({})
      .populate('adminId', 'name email phone isActive')
      .sort({ createdAt: -1 })
      .lean();

    console.log('📊 Admin API - Salons found:', salons.length);
    
    // Log each salon's status
    salons.forEach(s => {
      console.log(`  - ${s.name}: ${s.status} (ID: ${s._id})`);
    });

    return Response.json({ 
      success: true,
      salons,
      total: salons.length
    });
  } catch (error) {
    console.error('❌ Admin API - Error fetching salons:', error);
    return Response.json(
      { 
        success: false,
        error: 'Failed to fetch salons', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}
