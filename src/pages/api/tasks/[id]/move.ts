import type { APIRoute } from 'astro';
import { getTaskById, moveTask } from '@/lib/services/tasks';
import { getColumnById } from '@/lib/services/columns';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { columnId, position } = body;
    
    if (!columnId || position === undefined) {
      return new Response(JSON.stringify({ error: 'columnId and position required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const task = getTaskById(params.id!);
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const column = getColumnById(columnId);
    if (!column) {
      return new Response(JSON.stringify({ error: 'Column not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const updatedTask = moveTask(params.id!, columnId, position);
    return new Response(JSON.stringify(updatedTask), {
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
