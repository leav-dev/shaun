import type { APIRoute } from 'astro';
import { getSession, SESSION_COOKIE } from '../../../lib/auth';
import { getUserById } from '../../../lib/services/users';

export const GET: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get(SESSION_COOKIE)?.value;
  
  if (!sessionId) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const session = getSession(sessionId);
  
  if (!session) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const user = getUserById(session.userId);
  
  return new Response(JSON.stringify({ user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
