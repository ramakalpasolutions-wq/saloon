import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import { getUserFromRequest } from '@/lib/auth';

// Function to extract coordinates from Google Maps link
function extractCoordinatesFromGoogleMapsLink(link) {
  try {
    if (!link || typeof link !== 'string') {
      return null;
    }

    link = link.trim();

    // Try to find @latitude,longitude pattern (most common)
    let match = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      return [parseFloat(match[2]), parseFloat(match[1])]; // [longitude, latitude]
    }

    // Try to find q=latitude,longitude pattern
    match = link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      return [parseFloat(match[2]), parseFloat(match[1])]; // [longitude, latitude]
    }

    // Try to find /place/name/@lat,lng pattern
    match = link.match(/\/place\/[^\/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      return [parseFloat(match[2]), parseFloat(match[1])]; // [longitude, latitude]
    }

    // Try to find ll=latitude,longitude pattern
    match = link.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      return [parseFloat(match[2]), parseFloat(match[1])]; // [longitude, latitude]
    }

    return null;
  } catch (error) {
    console.error('Error extracting coordinates from link:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user || user.role !== 'main-admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Main admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      created: [],
      errors: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        if (!row['Salon Name'] || !row['Phone'] || !row['Email']) {
          throw new Error('Missing required fields: Salon Name, Phone, or Email');
        }

        if (!row['Admin Name'] || !row['Admin Email'] || !row['Admin Password']) {
          throw new Error('Missing required admin fields');
        }

        const existingAdmin = await User.findOne({ email: row['Admin Email'] });
        if (existingAdmin) {
          throw new Error(`Admin email ${row['Admin Email']} already exists`);
        }

        const existingSalon = await Salon.findOne({ email: row['Email'] });
        if (existingSalon) {
          throw new Error(`Salon email ${row['Email']} already exists`);
        }

        const address = {
          street: row['Street'] || '',
          city: row['City'] || '',
          state: row['State'] || '',
          zipCode: row['ZIP'] || '',
          fullAddress: `${row['Street'] || ''}, ${row['City'] || ''}, ${row['State'] || ''} ${row['ZIP'] || ''}`,
        };

        let coordinates = [78.4867, 17.385];
        
        if (row['Google Maps Link']) {
          const extractedCoords = extractCoordinatesFromGoogleMapsLink(row['Google Maps Link']);
          if (extractedCoords) {
            coordinates = extractedCoords;
            console.log(`✅ Extracted coordinates for ${row['Salon Name']}: [${coordinates[0]}, ${coordinates[1]}]`);
          } else {
            console.log(`⚠️ Could not extract coordinates from link for ${row['Salon Name']}, using default`);
          }
        } else {
          console.log(`⚠️ No Google Maps link provided for ${row['Salon Name']}, using default coordinates`);
        }

        const hashedPassword = await bcrypt.hash(row['Admin Password'], 10);
        const admin = await User.create({
          name: row['Admin Name'],
          email: row['Admin Email'],
          phone: row['Admin Phone'] || '',
          password: hashedPassword,
          role: 'salon-admin',
          isActive: true,
        });

        const salon = await Salon.create({
          name: row['Salon Name'],
          description: row['Description'] || '',
          phone: row['Phone'],
          email: row['Email'],
          address: address,
          coordinates: coordinates,
          adminId: admin._id,
          status: 'approved',
          openingHours: [
            { day: 'Monday', open: '09:00', close: '21:00', isClosed: false },
            { day: 'Tuesday', open: '09:00', close: '21:00', isClosed: false },
            { day: 'Wednesday', open: '09:00', close: '21:00', isClosed: false },
            { day: 'Thursday', open: '09:00', close: '21:00', isClosed: false },
            { day: 'Friday', open: '09:00', close: '21:00', isClosed: false },
            { day: 'Saturday', open: '09:00', close: '21:00', isClosed: false },
            { day: 'Sunday', open: '09:00', close: '21:00', isClosed: false },
          ],
        });

        results.success++;
        results.created.push({
          row: i + 2,
          salonName: row['Salon Name'],
          adminEmail: row['Admin Email'],
          coordinates: coordinates,
          hasMapLink: !!row['Google Maps Link'],
        });

      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error);
        results.failed++;
        results.errors.push({
          row: i + 2,
          salonName: row['Salon Name'] || 'Unknown',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.total} salons`,
      results,
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    );
  }
}
