import { db } from '../db/index.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export const ProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1),
  owner_id: z.string(),
});

export type Project = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export function createProject(data: z.infer<typeof ProjectSchema>): Project {
  const id = nanoid(12);
  
  const stmt = db.prepare(`
    INSERT INTO projects (id, name, description, slug, owner_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, data.name, data.description || null, data.slug, data.owner_id);
  
  // Add owner as admin member
  const memberStmt = db.prepare(`
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (?, ?, 'owner')
  `);
  memberStmt.run(id, data.owner_id);
  
  // Create default columns
  const defaultColumns = [
    { name: 'Por hacer', color: '#6b7280', position: 0 },
    { name: 'En progreso', color: '#3b82f6', position: 1 },
    { name: 'Hecho', color: '#22c55e', position: 2 },
  ];
  
  const colStmt = db.prepare(`
    INSERT INTO columns (id, project_id, name, position, color)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  for (const col of defaultColumns) {
    colStmt.run(nanoid(12), id, col.name, col.position, col.color);
  }
  
  return getProjectById(id)!;
}

export function getProjectById(id: string): Project | undefined {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  return stmt.get(id) as Project | undefined;
}

export function getProjectBySlug(slug: string): Project | undefined {
  const stmt = db.prepare('SELECT * FROM projects WHERE slug = ?');
  return stmt.get(slug) as Project | undefined;
}

export function getProjectsByUser(userId: string): Project[] {
  const stmt = db.prepare(`
    SELECT p.* FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = ?
    ORDER BY p.updated_at DESC
  `);
  return stmt.all(userId) as Project[];
}

export function updateProject(id: string, data: Partial<z.infer<typeof ProjectSchema>>): Project | undefined {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.slug !== undefined) {
    fields.push('slug = ?');
    values.push(data.slug);
  }
  
  if (fields.length === 0) return getProjectById(id);
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  
  return getProjectById(id);
}

export function deleteProject(id: string): boolean {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function addProjectMember(projectId: string, userId: string, role: string = 'member'): void {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO project_members (project_id, user_id, role)
    VALUES (?, ?, ?)
  `);
  stmt.run(projectId, userId, role);
}

export function removeProjectMember(projectId: string, userId: string): boolean {
  const stmt = db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?');
  const result = stmt.run(projectId, userId);
  return result.changes > 0;
}

export function getProjectMembers(projectId: string): any[] {
  const stmt = db.prepare(`
    SELECT u.*, pm.role, pm.joined_at
    FROM users u
    JOIN project_members pm ON u.id = pm.user_id
    WHERE pm.project_id = ?
    ORDER BY pm.joined_at
  `);
  return stmt.all(projectId);
}
