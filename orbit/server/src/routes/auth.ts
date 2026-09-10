import { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import { db } from "../db";
import {
  SESSION_COOKIE,
  createSession,
  deleteSession,
  hashPassword,
  verifyPassword,
} from "../auth";

// Secure cookies require HTTPS. Default off so login works over plain HTTP on
// first deploy; set COOKIE_SECURE=true once TLS is in front of the app.
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

// Very small in-memory throttle to slow password guessing.
const attempts = new Map<string, { n: number; first: number }>();
const WINDOW = 15 * 60_000;
const MAX_FAILS = 8;

function tooMany(key: string): boolean {
  const rec = attempts.get(key);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW) {
    attempts.delete(key);
    return false;
  }
  return rec.n >= MAX_FAILS;
}
function recordFail(key: string) {
  const rec = attempts.get(key);
  if (!rec || Date.now() - rec.first > WINDOW) attempts.set(key, { n: 1, first: Date.now() });
  else rec.n += 1;
}

function setSessionCookie(reply: any, token: string, expires: Date) {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/",
    expires,
  });
}

function publicUser(u: any) {
  return { id: u.id, name: u.name, init: u.init, color: u.color, presence: u.presence, email: u.email };
}

export async function authRoutes(app: FastifyInstance) {
  // Who am I? (populated by the global hook)
  app.get("/api/auth/me", (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: "not authenticated" });
    return req.user;
  });

  app.post("/api/auth/login", (req, reply) => {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    if (!email || !password) return reply.code(400).send({ error: "email and password are required" });

    const key = `${req.ip}:${email.toLowerCase()}`;
    if (tooMany(key)) return reply.code(429).send({ error: "Too many attempts. Try again in a few minutes." });

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim()) as any;
    if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
      recordFail(key);
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    attempts.delete(key);
    const { token, expires } = createSession(user.id);
    setSessionCookie(reply, token, expires);
    return publicUser(user);
  });

  app.post("/api/auth/logout", (req, reply) => {
    deleteSession(req.cookies?.[SESSION_COOKIE]);
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  });

  // Optional self-signup, off unless ALLOW_SIGNUP=true.
  app.post("/api/auth/register", (req, reply) => {
    if (process.env.ALLOW_SIGNUP !== "true") return reply.code(403).send({ error: "signups are disabled" });
    const { name, email, password } = (req.body ?? {}) as { name?: string; email?: string; password?: string };
    if (!name || !email || !password) return reply.code(400).send({ error: "name, email and password are required" });
    if (password.length < 8) return reply.code(400).send({ error: "password must be at least 8 characters" });
    const lower = email.toLowerCase().trim();
    if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(lower)) {
      return reply.code(409).send({ error: "an account with that email already exists" });
    }
    const id = `u_${randomBytes(5).toString("hex")}`;
    const palette = ["#5b63d3", "#2f9e5f", "#d64545", "#c8880e", "#8b5cf6", "#0ea5a4"];
    db.prepare("INSERT INTO users (id,name,init,color,presence,email,password_hash) VALUES (?,?,?,?,?,?,?)").run(
      id,
      name.trim(),
      name.trim()[0]?.toUpperCase() ?? "?",
      palette[Math.floor(Math.random() * palette.length)],
      "online",
      lower,
      hashPassword(password)
    );
    const { token, expires } = createSession(id);
    setSessionCookie(reply, token, expires);
    const created = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return reply.code(201).send(publicUser(created));
  });
}
