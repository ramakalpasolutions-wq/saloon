import { clientPromise } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { customerName, phoneNumber, services, salonId, salonName, salonAddress } = body;

    if (!customerName || !phoneNumber || !salonId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saloon');

    const checkin = {
      customerName,
      phoneNumber,
      services: services || [],
      salonId,
      salonName,
      salonAddress,
      status: 'pending',
      checkinDate: new Date(),
      waitingPosition: Math.floor(Math.random() * 10) + 1,
      estimatedWaitTime: '15-20',
      createdAt: new Date(),
    };

    const result = await db.collection('checkins').insertOne(checkin);
    
    return Response.json({ 
      checkin: { ...checkin, _id: result.insertedId },
      message: 'Check-in created successfully' 
    });
  } catch (error) {
    console.error('Error creating check-in:', error);
    return Response.json({ error: 'Failed to create check-in' }, { status: 500 });
  }
}
