import type { APIRoute } from 'astro';
import { getProjectById } from '../../../../lib/services/projects';
import { createSprint, getSprintsByProject, getActiveSprint, SprintSchema } from '../../../../lib/services/sprints';

export const GET: APIRoute = async ({ params, url }) => {
  const project = getProjectById(params.id!);
  if (!project) {
    return new Response(JSON.stringify({ error: 'Project not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const activeOnly = url.searchParams.get('active');
  
  if (activeOnly === 'true') {
    const sprint = getActiveSprint(params.id!);
    return new Response(JSON.stringify(sprint || null), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const sprints = getSprintsByProject(params.id!);
  return new Response(JSON.stringify(sprints), {
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
    const data = SprintSchema.parse({ ...body, project_id: params.id! });
    const sprint = createSprint(data);
    return new Response(JSON.stringify(sprint), {
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
