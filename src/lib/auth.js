import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const hashPassword = async (password) => {
  return await bcryptjs.hash(password, 12);
};

export const comparePasswords = async (password, hashedPassword) => {
  return await bcryptjs.compare(password, hashedPassword);
};

export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      salonId: user.salonId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const getUserFromRequest = (request) => {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (error) {
    return null;
  }
};
