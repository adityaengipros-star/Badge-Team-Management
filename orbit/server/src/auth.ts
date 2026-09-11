import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { nowISO } from "./types";

// ---- password hashing (Node built-in scrypt, no native deps) ----

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const dk = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${dk.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const dk = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  const target = Buffer.from(hashHex, "hex");
  return dk.length === target.length && timingSafeEqual(dk, target);
}

// ---- sessions (stored in SQLite; opaque token in an httpOnly cookie) ----

export const SESSION_COOKIE = "orbit_session";
const SESSION_DAYS = 7;

export interface SessionUser {
  id: string;
  name: string;
  init: string;
  color: string;
  presence: string;
  email: string;
  role: string;
  status: string;
}

export function createSession(userId: string): { token: string; expires: Date } {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  db.prepare("INSERT INTO sessions (id,user_id,created_at,expires_at) VALUES (?,?,?,?)").run(
    token,
    userId,
    nowISO(),
    expires.toISOString()
  );
  return { token, expires };
}

export function getSessionUser(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.init, u.color, u.presence, u.email, u.role, u.status
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`
    )
    .get(token, nowISO()) as SessionUser | undefined;
  return row ?? null;
}

export function deleteSession(token: string | undefined) {
  if (token) db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
}

export function cleanupExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(nowISO());
}

// Make request.user available and typed across routes.
declare module "fastify" {
  interface FastifyRequest {
    user: SessionUser | null;
  }
}
