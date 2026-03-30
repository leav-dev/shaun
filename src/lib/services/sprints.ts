import { db } from '../db/index.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export const SprintSchema = z.object({
  project_id: z.string(),
  name: z.string().min(1),
  goal: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed']).optional(),
});

export type Sprint = {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'planning' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
};

export function createSprint(data: z.infer<typeof SprintSchema>): Sprint {
  const id = nanoid(12);
  
  const stmt = db.prepare(`
    INSERT INTO sprints (id, project_id, name, goal, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    data.project_id,
    data.name,
    data.goal || null,
    data.start_date || null,
    data.end_date || null,
    data.status || 'planning'
  );
  
  return getSprintById(id)!;
}

export function getSprintById(id: string): Sprint | undefined {
  const stmt = db.prepare('SELECT * FROM sprints WHERE id = ?');
  return stmt.get(id) as Sprint | undefined;
}

export function getSprintsByProject(projectId: string): Sprint[] {
  const stmt = db.prepare(`
    SELECT * FROM sprints 
    WHERE project_id = ? 
    ORDER BY 
      CASE status 
        WHEN 'active' THEN 0 
        WHEN 'planning' THEN 1 
        ELSE 2 
      END,
      start_date DESC
  `);
  return stmt.all(projectId) as Sprint[];
}

export function getActiveSprint(projectId: string): Sprint | undefined {
  const stmt = db.prepare('SELECT * FROM sprints WHERE project_id = ? AND status = ?');
  return stmt.get(projectId, 'active') as Sprint | undefined;
}

export function updateSprint(id: string, data: Partial<z.infer<typeof SprintSchema>>): Sprint | undefined {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.goal !== undefined) {
    fields.push('goal = ?');
    values.push(data.goal);
  }
  if (data.start_date !== undefined) {
    fields.push('start_date = ?');
    values.push(data.start_date);
  }
  if (data.end_date !== undefined) {
    fields.push('end_date = ?');
    values.push(data.end_date);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  
  if (fields.length === 0) return getSprintById(id);
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`UPDATE sprints SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  
  return getSprintById(id);
}

export function deleteSprint(id: string): boolean {
  const stmt = db.prepare('DELETE FROM sprints WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// Sprint Tasks
export function addTaskToSprint(sprintId: string, taskId: string): void {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO sprint_tasks (sprint_id, task_id)
    VALUES (?, ?)
  `);
  stmt.run(sprintId, taskId);
}

export function removeTaskFromSprint(sprintId: string, taskId: string): boolean {
  const stmt = db.prepare('DELETE FROM sprint_tasks WHERE sprint_id = ? AND task_id = ?');
  const result = stmt.run(sprintId, taskId);
  return result.changes > 0;
}

export function getSprintTasks(sprintId: string): any[] {
  const stmt = db.prepare(`
    SELECT t.*, c.name as column_name, c.color as column_color
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN sprint_tasks st ON t.id = st.task_id
    WHERE st.sprint_id = ?
    ORDER BY c.position, t.position
  `);
  return stmt.all(sprintId);
}

export function getSprintWithDetails(sprintId: string): any {
  const sprint = getSprintById(sprintId);
  if (!sprint) return null;
  
  const tasks = getSprintTasks(sprintId);
  
  return { ...sprint, tasks };
}
