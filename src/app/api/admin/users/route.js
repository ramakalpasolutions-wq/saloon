import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user || user.role !== 'main-admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Main admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let query = {};
    if (role && role !== 'all') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password') // Exclude password
      .populate('salonId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      success: true,
      users,
      total: users.length 
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
