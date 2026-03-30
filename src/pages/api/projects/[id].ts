import type { APIRoute } from 'astro';
import { getProjectById, updateProject, deleteProject, getProjectMembers } from '../../../lib/services/projects';
import { getColumnsByProject } from '../../../lib/services/columns';
import { getTasksByColumn } from '../../../lib/services/tasks';

export const GET: APIRoute = async ({ params }) => {
  const project = getProjectById(params.id!);
  if (!project) {
    return new Response(JSON.stringify({ error: 'Project not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const columns = getColumnsByProject(params.id!);
  const columnsWithTasks = columns.map(col => ({
    ...col,
    tasks: getTasksByColumn(col.id)
  }));
  
  const members = getProjectMembers(params.id!);
  
  return new Response(JSON.stringify({ ...project, columns: columnsWithTasks, members }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const project = updateProject(params.id!, body);
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
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const deleted = deleteProject(params.id!);
  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Project not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
