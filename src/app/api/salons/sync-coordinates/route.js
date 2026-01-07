import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';

export async function POST() {
  try {
    await connectDB();
    
    const salons = await Salon.find({});
    console.log(`🔍 Found ${salons.length} salons to sync`);
    
    let synced = 0;
    let skipped = 0;
    
    for (const salon of salons) {
      let updated = false;
      let changes = [];
      
      // ✅ If coordinates array exists but latitude/longitude fields don't
      if (salon.coordinates && Array.isArray(salon.coordinates) && salon.coordinates.length === 2) {
        const [lng, lat] = salon.coordinates;
        
        if (!salon.latitude || !salon.longitude) {
          salon.longitude = lng;
          salon.latitude = lat;
          updated = true;
          changes.push(`Added lat/lng fields: ${lat}, ${lng}`);
        }
      }
      
      // ✅ If latitude/longitude exist but coordinates array doesn't
      else if (salon.latitude && salon.longitude) {
        if (!salon.coordinates || !Array.isArray(salon.coordinates) || salon.coordinates.length !== 2) {
          salon.coordinates = [salon.longitude, salon.latitude];
          updated = true;
          changes.push(`Added coordinates array: [${salon.longitude}, ${salon.latitude}]`);
        }
      }
      
      // ✅ Extract from Google Maps link if nothing exists
      else if (salon.googleMapsLink && !salon.latitude && !salon.longitude) {
        const coordsMatch = salon.googleMapsLink.match(/[@?](-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordsMatch) {
          salon.latitude = parseFloat(coordsMatch[1]);
          salon.longitude = parseFloat(coordsMatch[2]);
          salon.coordinates = [salon.longitude, salon.latitude];
          updated = true;
          changes.push(`Extracted from Maps link: ${salon.latitude}, ${salon.longitude}`);
        }
      }
      
      if (updated) {
        await salon.save();
        synced++;
        console.log(`✅ ${salon.name}:`, changes.join(', '));
      } else {
        skipped++;
        console.log(`⏭️ ${salon.name}: Already synced`);
      }
    }
    
    const summary = {
      success: true,
      message: `Synced ${synced} salons, skipped ${skipped}`,
      total: salons.length,
      synced,
      skipped
    };
    
    console.log('📊 Summary:', summary);
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('❌ Sync Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// GET method to check status
export async function GET() {
  try {
    await connectDB();
    
    const totalSalons = await Salon.countDocuments();
    const withCoordinates = await Salon.countDocuments({
      coordinates: { $exists: true, $size: 2 }
    });
    const withLatLng = await Salon.countDocuments({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    });
    const withBoth = await Salon.countDocuments({
      coordinates: { $exists: true, $size: 2 },
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    });
    
    return NextResponse.json({
      success: true,
      stats: {
        totalSalons,
        withCoordinatesArray: withCoordinates,
        withLatLngFields: withLatLng,
        withBothFormats: withBoth,
        needsSync: totalSalons - withBoth
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
