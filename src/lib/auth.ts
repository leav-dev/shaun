import { db } from './db/index.js';
import { nanoid } from 'nanoid';

// Simple session-based auth for hackathon
// In production, use JWT or proper session management

export function createSession(userId: string): string {
  const sessionId = nanoid(32);
  
  // Session expires in 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `);
  
  stmt.run(sessionId, userId, expiresAt.toISOString());
  
  return sessionId;
}

export function getSession(sessionId: string): { userId: string; expiresAt: string } | null {
  const stmt = db.prepare(`
    SELECT user_id, expires_at FROM sessions 
    WHERE id = ? AND expires_at > datetime('now')
  `);
  
  const result = stmt.get(sessionId) as { user_id: string; expires_at: string } | undefined;
  
  if (!result) return null;
  
  return { userId: result.user_id, expiresAt: result.expires_at };
}

export function deleteSession(sessionId: string): void {
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  stmt.run(sessionId);
}

export function cleanupExpiredSessions(): void {
  const stmt = db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')");
  stmt.run();
}

// Cookie helpers
export const SESSION_COOKIE = 'orgnizador_session';

export function setSessionCookie(response: Response, sessionId: string): Response {
  response.headers.set('Set-Cookie', 
    `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60*60*24*7}`
  );
  return response;
}

export function clearSessionCookie(response: Response): Response {
  response.headers.set('Set-Cookie', 
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return response;
}
