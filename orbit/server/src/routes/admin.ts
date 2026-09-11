import { FastifyInstance } from "fastify";
import { db } from "../db";
import { logActivity } from "../repo";

// Guard: only admins may use these endpoints.
function requireAdmin(req: any, reply: any, done: any) {
  if (!req.user || req.user.role !== "admin") {
    reply.code(403).send({ error: "admin access required" });
    return;
  }
  done();
}

function userRow(u: any) {
  return { id: u.id, name: u.name, init: u.init, color: u.color, email: u.email, role: u.role, status: u.status };
}

export async function adminRoutes(app: FastifyInstance) {
  // All members (for a members screen).
  app.get("/api/admin/users", { preHandler: requireAdmin }, () => {
    const rows = db.prepare("SELECT id,name,init,color,email,role,status FROM users ORDER BY status, name").all();
    return rows.map(userRow);
  });

  // Just the pending requests.
  app.get("/api/admin/pending", { preHandler: requireAdmin }, () => {
    const rows = db.prepare("SELECT id,name,init,color,email,role,status FROM users WHERE status='pending' ORDER BY name").all();
    return rows.map(userRow);
  });

  app.post("/api/admin/users/:id/approve", { preHandler: requireAdmin }, (req, reply) => {
    const { id } = req.params as { id: string };
    const u = db.prepare("SELECT * FROM users WHERE id=?").get(id) as any;
    if (!u) return reply.code(404).send({ error: "user not found" });
    db.prepare("UPDATE users SET status='active' WHERE id=?").run(id);
    logActivity({ userId: req.user!.id, action: "approved", target: u.name, extra: "as a member" });
    return userRow({ ...u, status: "active" });
  });

  app.post("/api/admin/users/:id/decline", { preHandler: requireAdmin }, (req, reply) => {
    const { id } = req.params as { id: string };
    const u = db.prepare("SELECT * FROM users WHERE id=?").get(id) as any;
    if (!u) return reply.code(404).send({ error: "user not found" });
    // Declining also kills any session they might somehow hold.
    db.prepare("UPDATE users SET status='declined' WHERE id=?").run(id);
    db.prepare("DELETE FROM sessions WHERE user_id=?").run(id);
    logActivity({ userId: req.user!.id, action: "declined", target: u.name });
    return userRow({ ...u, status: "declined" });
  });
}
