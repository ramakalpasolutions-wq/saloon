import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getUserFromRequest(request) {
  try {
    const token = request.cookies.get('auth-token')?.value; // ✅ Use 'auth-token'
    
    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return null;
    }

    return {
      userId: decoded._id,
      email: decoded.email,
      role: decoded.role,
      salonId: decoded.salonId,
    };
  } catch (error) {
    console.error('Get user from request error:', error);
    return null;
  }
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}
