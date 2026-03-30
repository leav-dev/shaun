import type { APIRoute } from 'astro';
import { createUser, getUserByEmail, UserSchema } from '../../../lib/services/users';
import { createSession, setSessionCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const data = UserSchema.parse(body);
    
    // Check if user exists
    const existing = getUserByEmail(data.email);
    if (existing) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = createUser(data);
    const sessionId = createSession(user.id);
    
    const response = new Response(JSON.stringify({ user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return setSessionCookie(response, sessionId);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
