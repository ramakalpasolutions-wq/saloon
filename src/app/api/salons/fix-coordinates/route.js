import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';

export async function POST() {
  try {
    await connectDB();
    
    const salons = await Salon.find({});
    console.log(`Found ${salons.length} salons to check`);
    
    let fixed = 0;
    
    for (const salon of salons) {
      if (salon.latitude && salon.longitude) {
        console.log(`✅ ${salon.name} already has coordinates`);
        continue;
      }
      
      // Try to extract from Google Maps link
      if (salon.googleMapsLink) {
        const coordsMatch = salon.googleMapsLink.match(/[@?](-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordsMatch) {
          salon.latitude = parseFloat(coordsMatch[1]);
          salon.longitude = parseFloat(coordsMatch[2]);
          salon.coordinates = [salon.longitude, salon.latitude];
          await salon.save();
          fixed++;
          console.log(`✅ Extracted coords for ${salon.name}: ${salon.latitude}, ${salon.longitude}`);
          continue;
        }
      }
      
      // Assign default Hyderabad coordinates with small random offset
      const baseLatitude = 17.385044 + (Math.random() - 0.5) * 0.05;
      const baseLongitude = 78.486671 + (Math.random() - 0.5) * 0.05;
      
      salon.latitude = baseLatitude;
      salon.longitude = baseLongitude;
      salon.coordinates = [baseLongitude, baseLatitude];
      
      if (!salon.googleMapsLink) {
        salon.googleMapsLink = `https://www.google.com/maps?q=${baseLatitude},${baseLongitude}`;
      }
      
      await salon.save();
      fixed++;
      console.log(`🔧 Added default coords to ${salon.name}: ${salon.latitude}, ${salon.longitude}`);
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Fixed ${fixed} out of ${salons.length} salons`,
      total: salons.length,
      fixed
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
