import type { APIRoute } from 'astro';
import { getTaskById, addTaskAssignee, removeTaskAssignee } from '@/lib/services/tasks';

export const POST: APIRoute = async ({ params }) => {
  const task = getTaskById(params.id!);
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  addTaskAssignee(params.id!, params.userId!);
  return new Response(JSON.stringify({ success: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const task = getTaskById(params.id!);
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const removed = removeTaskAssignee(params.id!, params.userId!);
  return new Response(JSON.stringify({ success: removed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
