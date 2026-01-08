import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function verifySalonAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value; // ✅ Changed to 'auth-token'

    if (!token) {
      console.error('❌ No auth token found');
      return { error: 'Unauthorized - No token', status: 401 };
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log('🔑 Token decoded:', {
        role: decoded.role,
        salonId: decoded.salonId,
        email: decoded.email
      });

      if (decoded.role !== 'salon-admin') {
        console.error('❌ Not a salon admin, role:', decoded.role);
        return { error: 'Unauthorized - Not a salon admin', status: 403 };
      }

      // ✅ First: Check if salonId exists in token
      if (decoded.salonId) {
        console.log('✅ Using salonId from token:', decoded.salonId);
        return { 
          salonId: decoded.salonId.toString(), 
          decoded 
        };
      }

      // ✅ Fallback: Fetch from user document
      if (decoded._id) {
        console.log('⚠️ No salonId in token, fetching from user...');
        
        const connectDB = (await import('@/lib/mongodb')).default;
        const User = (await import('@/models/User')).default;
        
        await connectDB();
        const user = await User.findById(decoded._id).select('salonId').lean();
        
        if (user && user.salonId) {
          console.log('✅ Found salonId from user document:', user.salonId);
          return { 
            salonId: user.salonId.toString(), 
            decoded 
          };
        }
      }

      console.error('❌ No salon linked to this account');
      return { error: 'No salon linked to this account', status: 403 };
      
    } catch (error) {
      console.error('❌ Token verification error:', error.message);
      return { error: 'Invalid token', status: 401 };
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    return { error: 'Authentication failed', status: 401 };
  }
}
