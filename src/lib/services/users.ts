import { db } from '../db/index.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  avatar_color: z.string().optional(),
});

export type User = {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
};

export function createUser(data: z.infer<typeof UserSchema>): User {
  const id = nanoid(12);
  const avatar_color = data.avatar_color || `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
  
  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, avatar_color)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.run(id, data.name, data.email, avatar_color);
  
  return getUserById(id)!;
}

export function getUserById(id: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | undefined;
}

export function getUserByEmail(email: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as User | undefined;
}

export function getAllUsers(): User[] {
  const stmt = db.prepare('SELECT * FROM users ORDER BY name');
  return stmt.all() as User[];
}

export function updateUser(id: string, data: Partial<z.infer<typeof UserSchema>>): User | undefined {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    values.push(data.email);
  }
  if (data.avatar_color !== undefined) {
    fields.push('avatar_color = ?');
    values.push(data.avatar_color);
  }
  
  if (fields.length === 0) return getUserById(id);
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  
  return getUserById(id);
}

export function deleteUser(id: string): boolean {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}
