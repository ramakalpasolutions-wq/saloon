import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const client = await clientPromise;
    const db = client.db('saloon'); // Your database name
    
    const checkin = await db
      .collection('checkins')
      .findOne({ _id: new ObjectId(params.id) });

    if (!checkin) {
      return Response.json({ error: 'Check-in not found' }, { status: 404 });
    }

    return Response.json({ checkin });
  } catch (error) {
    console.error('Error fetching check-in:', error);
    return Response.json({ error: 'Failed to fetch check-in' }, { status: 500 });
  }
}
