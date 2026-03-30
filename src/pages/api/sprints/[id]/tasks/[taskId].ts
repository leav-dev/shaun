import type { APIRoute } from 'astro';
import { getSprintById, addTaskToSprint, removeTaskFromSprint } from '@/lib/services/sprints';
import { getTaskById } from '@/lib/services/tasks';

export const POST: APIRoute = async ({ params }) => {
  const sprint = getSprintById(params.id!);
  if (!sprint) {
    return new Response(JSON.stringify({ error: 'Sprint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const task = getTaskById(params.taskId!);
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  addTaskToSprint(params.id!, params.taskId!);
  return new Response(JSON.stringify({ success: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const sprint = getSprintById(params.id!);
  if (!sprint) {
    return new Response(JSON.stringify({ error: 'Sprint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const removed = removeTaskFromSprint(params.id!, params.taskId!);
  return new Response(JSON.stringify({ success: removed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
