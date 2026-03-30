import type { APIRoute } from 'astro';
import { createProject, getProjectsByUser, getProjectBySlug, ProjectSchema } from '../../../lib/services/projects';

export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get('userId');
  const slug = url.searchParams.get('slug');
  
  if (slug) {
    const project = getProjectBySlug(slug);
    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const projects = getProjectsByUser(userId);
  return new Response(JSON.stringify(projects), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const data = ProjectSchema.parse(body);
    const project = createProject(data);
    return new Response(JSON.stringify(project), {
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
