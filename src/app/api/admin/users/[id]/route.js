import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest, hashPassword } from '@/lib/auth';

// GET - Get single user details
export async function GET(request, { params }) {
  try {
    const currentUser = getUserFromRequest(request);
    
    if (!currentUser || currentUser.role !== 'main-admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;

    const user = await User.findById(id)
      .select('-password')
      .populate('salonId', 'name email phone address')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT - Update user details
export async function PUT(request, { params }) {
  try {
    const currentUser = getUserFromRequest(request);
    
    if (!currentUser || currentUser.role !== 'main-admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updates = await request.json();

    // Update allowed fields
    if (updates.name) user.name = updates.name;
    if (updates.email) user.email = updates.email;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.role) user.role = updates.role;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;
    
    // Update password if provided
    if (updates.password && updates.password.trim() !== '') {
      user.password = await hashPassword(updates.password);
    }

    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request, { params }) {
  try {
    const currentUser = getUserFromRequest(request);
    
    if (!currentUser || currentUser.role !== 'main-admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;

    // Prevent deleting yourself
    if (id === currentUser.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
