import { db } from '../db/index.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export const CommentSchema = z.object({
  task_id: z.string(),
  user_id: z.string(),
  content: z.string().min(1),
});

export type Comment = {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export function createComment(data: z.infer<typeof CommentSchema>): Comment {
  const id = nanoid(12);
  
  const stmt = db.prepare(`
    INSERT INTO comments (id, task_id, user_id, content)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.run(id, data.task_id, data.user_id, data.content);
  
  return getCommentById(id)!;
}

export function getCommentById(id: string): Comment | undefined {
  const stmt = db.prepare('SELECT * FROM comments WHERE id = ?');
  return stmt.get(id) as Comment | undefined;
}

export function getCommentsByTask(taskId: string): (Comment & { user?: any })[] {
  const stmt = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar_color as user_avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.task_id = ?
    ORDER BY c.created_at ASC
  `);
  return stmt.all(taskId) as (Comment & { user?: any })[];
}

export function updateComment(id: string, content: string): Comment | undefined {
  const stmt = db.prepare(`
    UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.run(content, id);
  return getCommentById(id);
}

export function deleteComment(id: string): boolean {
  const stmt = db.prepare('DELETE FROM comments WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}
