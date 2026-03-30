import type { APIRoute } from 'astro';
import { getSprintById, addTaskToSprint } from '@/lib/services/sprints';
import { getTaskById } from '@/lib/services/tasks';

export const POST: APIRoute = async ({ params, request }) => {
  const sprint = getSprintById(params.id!);
  if (!sprint) {
    return new Response(JSON.stringify({ error: 'Sprint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const body = await request.json();
  const taskId = body.task_id;
  
  if (!taskId) {
    return new Response(JSON.stringify({ error: 'task_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const task = getTaskById(taskId);
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    addTaskToSprint(params.id!, taskId);
    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error adding task to sprint:', error);
    return new Response(JSON.stringify({ error: 'Failed to add task to sprint' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};