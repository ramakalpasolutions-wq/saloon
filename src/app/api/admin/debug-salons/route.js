import { clientPromise } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saloon');

    // Get all salons
    const salons = await db.collection('salons').find({}).toArray();

    console.log('📊 Total salons in DB:', salons.length);
    
    const salonInfo = salons.map(s => ({
      _id: s._id.toString(),
      _idType: typeof s._id,
      name: s.name,
      email: s.email,
      status: s.status,
      adminId: s.adminId?.toString(),
      adminIdType: typeof s.adminId
    }));

    console.log('🔍 Salon details:', JSON.stringify(salonInfo, null, 2));

    return Response.json({
      success: true,
      count: salons.length,
      salons: salonInfo,
      rawSample: salons[0] // First salon with all fields
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
