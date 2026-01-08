import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { comparePasswords, generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // ✅ Find user and explicitly include salonId
    const user = await User.findOne({ email: email.toLowerCase() }).lean();
      
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await comparePasswords(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ✅ Build token payload with proper salonId
    const tokenPayload = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    // ✅ Add salonId if exists (convert ObjectId to string)
    if (user.salonId) {
      tokenPayload.salonId = user.salonId.toString();
      console.log('✅ Including salonId in token:', tokenPayload.salonId);
    } else {
      console.warn('⚠️ User has no salonId:', user.email);
    }

    console.log('🔑 Creating token with payload:', tokenPayload);

    const token = generateToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        salonId: user.salonId,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
