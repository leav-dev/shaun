import type { APIRoute } from 'astro';
import { createUser, getAllUsers, getUserById, UserSchema } from '../../../lib/services/users';

export const GET: APIRoute = async () => {
  const users = getAllUsers();
  return new Response(JSON.stringify(users), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const data = UserSchema.parse(body);
    const user = createUser(data);
    return new Response(JSON.stringify(user), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
