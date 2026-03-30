import type { APIRoute } from 'astro';
import { getUserByEmail } from '../../../lib/services/users';
import { createSession, setSessionCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = getUserByEmail(email);
    if (!user) {
      // Auto-create user for hackathon simplicity
      const { createUser } = await import('../../../lib/services/users.js');
      const newUser = createUser({ 
        name: email.split('@')[0], 
        email,
        avatar_color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
      });
      
      const sessionId = createSession(newUser.id);
      
      const response = new Response(JSON.stringify({ user: newUser, autoCreated: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return setSessionCookie(response, sessionId);
    }
    
    const sessionId = createSession(user.id);
    
    const response = new Response(JSON.stringify({ user }), {
      status: 200,
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
