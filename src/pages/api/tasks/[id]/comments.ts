import type { APIRoute } from 'astro';
import { getTaskById } from '@/lib/services/tasks';
import { createComment, getCommentsByTask, CommentSchema } from '@/lib/services/comments';

export const GET: APIRoute = async ({ params }) => {
  const task = getTaskById(params.id!);
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const comments = getCommentsByTask(params.id!);
  return new Response(JSON.stringify(comments), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ params, request }) => {
  const task = getTaskById(params.id!);
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await request.json();
    const data = CommentSchema.parse({ ...body, task_id: params.id! });
    const comment = createComment(data);
    return new Response(JSON.stringify(comment), {
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
