import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    console.log('🔐 Login attempt:', email);

    if (!email || !password) {
      return Response.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saloon');

    // Find user
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      console.error('❌ User not found:', email);
      return Response.json({ 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }

    console.log('✅ User found:', {
      email: user.email,
      role: user.role,
      _id: user._id.toString()
    });

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.error('❌ Invalid password for:', email);
      return Response.json({ 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }

    console.log('✅ Password verified');

    // Find salon if user is salon-admin
    let salonId = null;
    let salonName = null;

    if (user.role === 'salon-admin') {
      console.log('🔍 Looking for salon with adminId:', user._id.toString());
      
      const salon = await db.collection('salons').findOne({ 
        adminId: user._id 
      });
      
      if (salon) {
        salonId = salon._id.toString();
        salonName = salon.name;
        console.log('✅ Found salon:', salonName, '- ID:', salonId);
      } else {
        console.warn('⚠️ No salon found for salon-admin:', user.email);
        return Response.json({ 
          error: 'No salon associated with this account. Please contact support.' 
        }, { status: 400 });
      }
    }

    // Create token with salonId
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      salonId: salonId,
      salonName: salonName,
    };

    console.log('🎫 Creating token with payload:', tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Token created successfully');
    console.log('✅ Login successful for:', email);

    const response = Response.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        salonId: salonId,
        salonName: salonName,
      },
    });

    // Set cookie with token
    response.headers.set(
      'Set-Cookie',
      `auth-token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;

  } catch (error) {
    console.error('❌ Login error:', error);
    return Response.json({ 
      error: 'Login failed',
      message: error.message 
    }, { status: 500 });
  }
}
