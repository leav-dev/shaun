import type { APIRoute } from 'astro';
import { getSprintById, updateSprint, deleteSprint, getSprintWithDetails } from '@/lib/services/sprints';

export const GET: APIRoute = async ({ params }) => {
  const sprint = getSprintWithDetails(params.id!);
  if (!sprint) {
    return new Response(JSON.stringify({ error: 'Sprint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response(JSON.stringify(sprint), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const sprint = updateSprint(params.id!, body);
    if (!sprint) {
      return new Response(JSON.stringify({ error: 'Sprint not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(sprint), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const deleted = deleteSprint(params.id!);
  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Sprint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
