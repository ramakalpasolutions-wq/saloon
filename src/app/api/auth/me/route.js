import { verifyToken } from '@/lib/auth';
import { getTokenFromRequest } from '@/lib/getToken';

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return Response.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const userData = verifyToken(token);

    if (!userData) {
      return Response.json({ 
        error: 'Invalid token' 
      }, { status: 401 });
    }

    return Response.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return Response.json({ 
      error: 'Authentication failed' 
    }, { status: 500 });
  }
}
