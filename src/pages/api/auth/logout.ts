import type { APIRoute } from 'astro';
import { getSession, clearSessionCookie, SESSION_COOKIE } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get(SESSION_COOKIE)?.value;
  
  if (sessionId) {
    const { deleteSession } = await import('../../../lib/auth.js');
    deleteSession(sessionId);
  }
  
  const response = new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
  
  return clearSessionCookie(response);
};
