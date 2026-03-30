import type { APIRoute } from 'astro';
import { getColumnById, updateColumn, deleteColumn } from '@/lib/services/columns';

export const GET: APIRoute = async ({ params }) => {
  const column = getColumnById(params.id!);
  if (!column) {
    return new Response(JSON.stringify({ error: 'Column not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response(JSON.stringify(column), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const column = updateColumn(params.id!, body);
    if (!column) {
      return new Response(JSON.stringify({ error: 'Column not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(column), {
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
  const deleted = deleteColumn(params.id!);
  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Column not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
