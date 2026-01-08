import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Salon from '@/models/Salon';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { extractCoordinatesFromGoogleMaps } from '@/lib/extractCoordinates';
import * as XLSX from 'xlsx';

export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // ✅ Read file as buffer for XLSX parsing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Parse XLSX file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Parsed ${jsonData.length} rows from Excel`);

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: 'Excel file is empty' },
        { status: 400 }
      );
    }

    const results = {
      total: jsonData.length,
      success: 0,
      failed: 0,
      created: [],
      errors: []
    };

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const rowNumber = i + 2; // +2 because Excel starts at 1 and we skip header
      
      try {
        const row = jsonData[i];

        console.log(`\n📝 Row ${rowNumber}:`, {
          'Salon Name': row['Salon Name'],
          'Email': row['Email']
        });

        // Get salon name
        const salonName = row['Salon Name'] || row['salonName'] || row['name'];
        
        if (!salonName) {
          throw new Error('Salon Name is required');
        }

        console.log(`📝 Processing: ${salonName}`);

        // Validate required fields
        if (!row['Email']) {
          throw new Error('Email is required');
        }
        if (!row['Phone']) {
          throw new Error('Phone is required');
        }
        if (!row['Admin Email']) {
          throw new Error('Admin Email is required');
        }
        if (!row['Admin Password']) {
          throw new Error('Admin Password is required');
        }

        // Extract address fields
        const address = row['Street'] || row['Address'] || '';
        const city = row['City'] || '';
        const state = row['State'] || '';
        const zipCode = String(row['ZIP'] || row['Zip Code'] || row['ZipCode'] || '');

        if (!address || !city || !state || !zipCode) {
          throw new Error(`Address fields incomplete. Got: Street="${address}", City="${city}", State="${state}", ZIP="${zipCode}"`);
        }

        // ✅ Extract coordinates from Google Maps link
        let coordinates = [0, 0];
        let hasMapLink = false;
        const googleMapsLink = row['Google Maps Link'] || row['GoogleMapsLink'] || '';

        if (googleMapsLink) {
          const extracted = await extractCoordinatesFromGoogleMaps(googleMapsLink);
          if (extracted && extracted[0] !== 0 && extracted[1] !== 0) {
            coordinates = extracted;
            hasMapLink = true;
            console.log(`✅ Extracted coordinates: [${coordinates[0]}, ${coordinates[1]}]`);
          } else {
            console.log('⚠️ Could not extract coordinates from Google Maps link');
          }
        } else {
          console.log('⚠️ No Google Maps link provided');
        }

        // Check if admin user already exists
        const adminEmail = row['Admin Email'].toLowerCase().trim();
        let adminUser = await User.findOne({ email: adminEmail });
        
        if (!adminUser) {
          // Create salon admin user
          const hashedPassword = await hashPassword(row['Admin Password']);
          
          adminUser = await User.create({
            name: row['Admin Name'] || `${salonName} Admin`,
            email: adminEmail,
            phone: row['Admin Phone'] || row['Phone'],
            password: hashedPassword,
            role: 'salon-admin',
            isActive: true,
          });

          console.log(`✅ Created admin user: ${adminUser.email}`);
        } else {
          console.log(`ℹ️ Using existing admin: ${adminUser.email}`);
        }

        // Create salon
        const salon = await Salon.create({
          name: salonName,
          description: row['Description'] || '',
          phone: String(row['Phone']),
          email: row['Email'].toLowerCase().trim(),
          address: address,
          city: city,
          state: state,
          zipCode: zipCode,
          googleMapsLink: googleMapsLink,
          location: {
            type: 'Point',
            coordinates: coordinates
          },
          adminId: adminUser._id,
          status: 'approved',
        });

        // Link salon to user
        if (!adminUser.salonId) {
          adminUser.salonId = salon._id;
          await adminUser.save();
        }

        console.log(`✅ Created salon: ${salon.name}`);

        // Add to results
        results.created.push({
          salonName: salon.name,
          adminEmail: adminUser.email,
          coordinates: coordinates,
          hasMapLink: hasMapLink
        });
        
        results.success++;

      } catch (error) {
        console.error(`❌ Error processing row ${rowNumber}:`, error.message);
        
        const row = jsonData[i];
        const salonName = row['Salon Name'] || row['salonName'] || 'Unknown';

        results.errors.push({
          row: rowNumber,
          salonName: salonName,
          error: error.message
        });
        
        results.failed++;
      }
    }

    console.log(`\n📊 Final Results: ${results.success} success, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.total} rows`,
      results: results
    });

  } catch (error) {
    console.error('❌ Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Bulk upload failed', message: error.message },
      { status: 500 }
    );
  }
}
