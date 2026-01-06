export async function POST() {
  const response = Response.json({ 
    success: true,
    message: 'Logged out successfully' 
  });

  // Clear both possible cookie names
  response.headers.append(
    'Set-Cookie',
    'auth-token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
  );
  
  response.headers.append(
    'Set-Cookie',
    'token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
  );

  return response;
}
