import type { APIRoute } from 'astro';
import { getColumnById } from '@/lib/services/columns';
import { createTask, getTasksByColumn, TaskSchema } from '@/lib/services/tasks';

export const GET: APIRoute = async ({ params }) => {
  const column = getColumnById(params.id!);
  if (!column) {
    return new Response(JSON.stringify({ error: 'Column not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const tasks = getTasksByColumn(params.id!);
  return new Response(JSON.stringify(tasks), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ params, request }) => {
  const column = getColumnById(params.id!);
  if (!column) {
    return new Response(JSON.stringify({ error: 'Column not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await request.json();
    const data = TaskSchema.parse({ ...body, column_id: params.id! });
    const task = createTask(data);
    return new Response(JSON.stringify(task), {
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
