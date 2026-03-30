import { db } from '../db/index.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export const TaskSchema = z.object({
  column_id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  position: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().optional(),
  start_date: z.string().optional(),
  created_by: z.string(),
});

export type Task = {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  start_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export function createTask(data: z.infer<typeof TaskSchema>): Task {
  const id = nanoid(12);
  
  // Get next position if not provided
  let position = data.position;
  if (position === undefined) {
    const maxPos = db.prepare('SELECT MAX(position) as max FROM tasks WHERE column_id = ?').get(data.column_id) as { max: number | null };
    position = (maxPos.max ?? -1) + 1;
  }
  
  const stmt = db.prepare(`
    INSERT INTO tasks (id, column_id, title, description, position, priority, due_date, start_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    data.column_id,
    data.title,
    data.description || null,
    position,
    data.priority || 'medium',
    data.due_date || null,
    data.start_date || null,
    data.created_by
  );
  
  return getTaskById(id)!;
}

export function getTaskById(id: string): Task | undefined {
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  return stmt.get(id) as Task | undefined;
}

export function getTasksByColumn(columnId: string): Task[] {
  const stmt = db.prepare('SELECT * FROM tasks WHERE column_id = ? ORDER BY position');
  return stmt.all(columnId) as Task[];
}

export function getTasksByProject(projectId: string): Task[] {
  const stmt = db.prepare(`
    SELECT t.* FROM tasks t
    JOIN columns c ON t.column_id = c.id
    WHERE c.project_id = ?
    ORDER BY c.position, t.position
  `);
  return stmt.all(projectId) as Task[];
}

export function updateTask(id: string, data: Partial<z.infer<typeof TaskSchema>> & { completed?: boolean }): Task | undefined {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.position !== undefined) {
    fields.push('position = ?');
    values.push(data.position);
  }
  if (data.priority !== undefined) {
    fields.push('priority = ?');
    values.push(data.priority);
  }
  if (data.due_date !== undefined) {
    fields.push('due_date = ?');
    values.push(data.due_date);
  }
  if (data.start_date !== undefined) {
    fields.push('start_date = ?');
    values.push(data.start_date);
  }
  if (data.column_id !== undefined) {
    fields.push('column_id = ?');
    values.push(data.column_id);
  }
  if (data.completed !== undefined) {
    fields.push('completed_at = ?');
    values.push(data.completed ? new Date().toISOString() : null);
  }
  
  if (fields.length === 0) return getTaskById(id);
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  
  return getTaskById(id);
}

export function deleteTask(id: string): boolean {
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function moveTask(taskId: string, targetColumnId: string, targetPosition: number): Task | undefined {
  const task = getTaskById(taskId);
  if (!task) return undefined;
  
  const oldColumnId = task.column_id;
  
  // Update positions in old column
  if (oldColumnId !== targetColumnId) {
    db.prepare('UPDATE tasks SET position = position - 1 WHERE column_id = ? AND position > ?')
      .run(oldColumnId, task.position);
  }
  
  // Update positions in target column
  db.prepare('UPDATE tasks SET position = position + 1 WHERE column_id = ? AND position >= ?')
    .run(targetColumnId, targetPosition);
  
  // Move the task
  const stmt = db.prepare(`
    UPDATE tasks SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.run(targetColumnId, targetPosition, taskId);
  
  return getTaskById(taskId);
}

// Assignees
export function addTaskAssignee(taskId: string, userId: string): void {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO task_assignees (task_id, user_id)
    VALUES (?, ?)
  `);
  stmt.run(taskId, userId);
}

export function removeTaskAssignee(taskId: string, userId: string): boolean {
  const stmt = db.prepare('DELETE FROM task_assignees WHERE task_id = ? AND user_id = ?');
  const result = stmt.run(taskId, userId);
  return result.changes > 0;
}

export function getTaskAssignees(taskId: string): any[] {
  const stmt = db.prepare(`
    SELECT u.* FROM users u
    JOIN task_assignees ta ON u.id = ta.user_id
    WHERE ta.task_id = ?
  `);
  return stmt.all(taskId);
}

// Labels
export function addTaskLabel(taskId: string, labelId: string): void {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO task_labels (task_id, label_id)
    VALUES (?, ?)
  `);
  stmt.run(taskId, labelId);
}

export function removeTaskLabel(taskId: string, labelId: string): boolean {
  const stmt = db.prepare('DELETE FROM task_labels WHERE task_id = ? AND label_id = ?');
  const result = stmt.run(taskId, labelId);
  return result.changes > 0;
}

// Get task with full details
export function getTaskWithDetails(taskId: string): any {
  const task = getTaskById(taskId);
  if (!task) return null;
  
  const assignees = getTaskAssignees(taskId);
  
  const labels = db.prepare(`
    SELECT l.* FROM labels l
    JOIN task_labels tl ON l.id = tl.label_id
    WHERE tl.task_id = ?
  `).all(taskId);
  
  return { ...task, assignees, labels };
}
