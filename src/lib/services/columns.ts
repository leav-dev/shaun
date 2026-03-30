import { db } from '../db/index.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export const ColumnSchema = z.object({
  project_id: z.string(),
  name: z.string().min(1),
  position: z.number().optional(),
  color: z.string().optional(),
  wip_limit: z.number().optional(),
});

export type Column = {
  id: string;
  project_id: string;
  name: string;
  position: number;
  color: string;
  wip_limit: number | null;
  created_at: string;
  updated_at: string;
};

export function createColumn(data: z.infer<typeof ColumnSchema>): Column {
  const id = nanoid(12);
  
  // Get next position if not provided
  let position = data.position;
  if (position === undefined) {
    const maxPos = db.prepare('SELECT MAX(position) as max FROM columns WHERE project_id = ?').get(data.project_id) as { max: number | null };
    position = (maxPos.max ?? -1) + 1;
  }
  
  const stmt = db.prepare(`
    INSERT INTO columns (id, project_id, name, position, color, wip_limit)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    data.project_id,
    data.name,
    position,
    data.color || '#6b7280',
    data.wip_limit || null
  );
  
  return getColumnById(id)!;
}

export function getColumnById(id: string): Column | undefined {
  const stmt = db.prepare('SELECT * FROM columns WHERE id = ?');
  return stmt.get(id) as Column | undefined;
}

export function getColumnsByProject(projectId: string): Column[] {
  const stmt = db.prepare('SELECT * FROM columns WHERE project_id = ? ORDER BY position');
  return stmt.all(projectId) as Column[];
}

export function updateColumn(id: string, data: Partial<z.infer<typeof ColumnSchema>>): Column | undefined {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.position !== undefined) {
    fields.push('position = ?');
    values.push(data.position);
  }
  if (data.color !== undefined) {
    fields.push('color = ?');
    values.push(data.color);
  }
  if (data.wip_limit !== undefined) {
    fields.push('wip_limit = ?');
    values.push(data.wip_limit);
  }
  
  if (fields.length === 0) return getColumnById(id);
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`UPDATE columns SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  
  return getColumnById(id);
}

export function deleteColumn(id: string): boolean {
  const stmt = db.prepare('DELETE FROM columns WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function reorderColumns(projectId: string, columnIds: string[]): void {
  const stmt = db.prepare('UPDATE columns SET position = ? WHERE id = ? AND project_id = ?');
  
  const transaction = db.transaction(() => {
    columnIds.forEach((colId, index) => {
      stmt.run(index, colId, projectId);
    });
  });
  
  transaction();
}
