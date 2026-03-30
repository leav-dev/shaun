import type { APIRoute } from 'astro';
import { getProjectById } from '../../../../lib/services/projects';
import { createColumn, getColumnsByProject, ColumnSchema } from '../../../../lib/services/columns';

export const GET: APIRoute = async ({ params }) => {
  const project = getProjectById(params.id!);
  if (!project) {
    return new Response(JSON.stringify({ error: 'Project not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const columns = getColumnsByProject(params.id!);
  return new Response(JSON.stringify(columns), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ params, request }) => {
  const project = getProjectById(params.id!);
  if (!project) {
    return new Response(JSON.stringify({ error: 'Project not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await request.json();
    const data = ColumnSchema.parse({ ...body, project_id: params.id! });
    const column = createColumn(data);
    return new Response(JSON.stringify(column), {
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
