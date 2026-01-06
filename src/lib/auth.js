import jwt from 'jsonwebtoken';

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return null;
  }
}

export function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn: '7d' 
  });
}
