import { clientPromise } from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saloon');
    
    // Fetch only approved salons
    const salons = await db
      .collection('salons')
      .find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .toArray();

    console.log('✅ Public salons fetched:', salons.length);

    // Format salons with extracted coordinates
    const formattedSalons = salons.map(salon => ({
      _id: salon._id.toString(),
      name: salon.name,
      description: salon.description,
      phone: salon.phone,
      email: salon.email,
      address: salon.address,
      googleMapsLink: salon.googleMapsLink,
      coordinates: salon.coordinates || [78.4867, 17.385], // [longitude, latitude]
      latitude: salon.coordinates?.[1] || 17.385, // Extract latitude for easy use
      longitude: salon.coordinates?.[0] || 78.4867, // Extract longitude
      logo: salon.logo,
      images: salon.images,
      openingHours: salon.openingHours,
      rating: salon.rating || 0,
      totalReviews: salon.totalReviews || 0,
      status: salon.status,
    }));

    return Response.json({ 
      success: true,
      salons: formattedSalons, 
      count: formattedSalons.length 
    });
  } catch (error) {
    console.error('❌ Error fetching public salons:', error);
    return Response.json({ 
      success: false,
      error: 'Failed to fetch salons',
      salons: []
    }, { status: 500 });
  }
}
