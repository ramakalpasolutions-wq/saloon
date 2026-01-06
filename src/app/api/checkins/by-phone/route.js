import { clientPromise } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return Response.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('saloon'); // Your database name
    
    const checkins = await db
      .collection('checkins')
      .find({ phoneNumber: phone })
      .sort({ checkinDate: -1 })
      .toArray();

    return Response.json({ checkins });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return Response.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
  }
}
