import type { APIRoute } from 'astro';
import { getProjectById } from '../../../lib/services/projects';
import { reorderColumns } from '../../../lib/services/columns';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { projectId, columnIds } = body;
    
    if (!projectId || !columnIds || !Array.isArray(columnIds)) {
      return new Response(JSON.stringify({ error: 'projectId and columnIds required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const project = getProjectById(projectId);
    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    reorderColumns(projectId, columnIds);
    
    return new Response(JSON.stringify({ success: true }), {
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
