export function getTokenFromRequest(request) {
  // Try multiple cookie names for compatibility
  const token = 
    request.cookies.get('auth-token')?.value ||
    request.cookies.get('token')?.value;
  
  return token;
}
