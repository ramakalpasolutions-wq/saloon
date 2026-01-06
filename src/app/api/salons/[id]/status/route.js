import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(request, { params }) {
  try {
    // ✨ Await params (Next.js 15+)
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return Response.json({ 
        success: false, 
        error: 'Invalid salon ID' 
      }, { status: 400 });
    }

    const { status } = await request.json();

    if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      return Response.json({ 
        success: false, 
        error: 'Invalid status' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saloon');
    
    const result = await db.collection('salons').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          status: status,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return Response.json({ 
        success: false, 
        error: 'Salon not found' 
      }, { status: 404 });
    }

    console.log(`✅ Status changed to ${status} for salon:`, id);

    return Response.json({ 
      success: true, 
      message: `Status updated to ${status}` 
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to update status',
      message: error.message 
    }, { status: 500 });
  }
}
