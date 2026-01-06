import { clientPromise } from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saloon');
    
    // Fetch all approved/active salons
    const salons = await db
      .collection('salons')
      .find({ 
        $or: [
          { status: 'approved' },
          { status: 'active' }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({ 
      success: true,
      salons, 
      count: salons.length 
    });
  } catch (error) {
    console.error('Error fetching salons:', error);
    return Response.json({ 
      success: false,
      error: 'Failed to fetch salons',
      salons: []
    }, { status: 500 });
  }
}
