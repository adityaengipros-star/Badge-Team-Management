import { FastifyInstance } from "fastify";
import { db } from "../db";
import { TaskRow, nowISO } from "../types";
import {
  attachLabels,
  logActivity,
  nextTaskId,
  setTaskLabels,
  taskDTOById,
  commentDTOs,
  addComment,
} from "../repo";
import { statusLabel } from "../labels";

const ALLOWED_STATUS = ["backlog", "todo", "progress", "review", "blocked", "done"];

export async function taskRoutes(app: FastifyInstance) {
  // GET /api/tasks — filter, search, paginate (server-side)
  app.get("/api/tasks", (req) => {
    const q = req.query as Record<string, string | undefined>;
    const where: string[] = [];
    const params: any[] = [];

    if (q.scope === "mine") { where.push("assignee_id = ?"); params.push(req.user!.id); }
    if (q.projectId) { where.push("project_id = ?"); params.push(q.projectId); }
    if (q.assigneeId) { where.push("assignee_id = ?"); params.push(q.assigneeId); }
    if (q.status) { where.push("status = ?"); params.push(q.status); }
    if (q.priority) { where.push("priority = ?"); params.push(q.priority); }
    if (q.type) { where.push("type = ?"); params.push(q.type); }
    if (q.q) {
      where.push("(title LIKE ? OR id LIKE ? OR description LIKE ?)");
      const like = `%${q.q}%`;
      params.push(like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const page = Math.max(1, parseInt(q.page ?? "1", 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(q.pageSize ?? "50", 10) || 50));
    const offset = (page - 1) * pageSize;

    const total = (db.prepare(`SELECT COUNT(*) AS n FROM tasks ${whereSql}`).get(...params) as { n: number }).n;

    // Sort: overdue first, then by status pipeline order, then updated desc.
    const rows = db
      .prepare(
        `SELECT * FROM tasks ${whereSql}
         ORDER BY overdue DESC,
           CASE status WHEN 'blocked' THEN 0 WHEN 'progress' THEN 1 WHEN 'review' THEN 2
                       WHEN 'todo' THEN 3 WHEN 'backlog' THEN 4 ELSE 5 END,
           updated_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as TaskRow[];

    return {
      items: attachLabels(rows),
      total,
      page,
      pageSize,
      hasMore: offset + rows.length < total,
    };
  });

  // GET /api/tasks/:id
  app.get("/api/tasks/:id", (req, reply) => {
    const { id } = req.params as { id: string };
    const task = taskDTOById(id);
    if (!task) return reply.code(404).send({ error: "task not found" });
    return task;
  });

  // POST /api/tasks
  app.post("/api/tasks", (req, reply) => {
    const b = req.body as any;
    if (!b?.projectId) return reply.code(400).send({ error: "projectId is required" });
    const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(b.projectId);
    if (!project) return reply.code(400).send({ error: "unknown projectId" });

    const id = nextTaskId(b.projectId);
    const ts = nowISO();
    db.prepare(
      `INSERT INTO tasks (id,project_id,title,description,assignee_id,status,priority,type,due,overdue,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id,
      b.projectId,
      (b.title ?? "Untitled task").trim() || "Untitled task",
      b.desc ?? "",
      b.assigneeId ?? req.user!.id,
      ALLOWED_STATUS.includes(b.status) ? b.status : "todo",
      b.priority ?? "medium",
      b.type ?? "Development",
      b.due ?? "",
      b.overdue ? 1 : 0,
      ts,
      ts
    );
    if (Array.isArray(b.labels)) setTaskLabels(id, b.labels);

    const task = taskDTOById(id)!;
    logActivity({ userId: req.user!.id, action: "created", target: task.title });
    return reply.code(201).send(task);
  });

  // PATCH /api/tasks/:id
  app.patch("/api/tasks/:id", (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined;
    if (!existing) return reply.code(404).send({ error: "task not found" });

    const b = req.body as any;
    const map: Record<string, string> = {
      title: "title", desc: "description", assigneeId: "assignee_id",
      status: "status", priority: "priority", type: "type", due: "due",
    };
    const sets: string[] = [];
    const params: any[] = [];
    for (const [key, col] of Object.entries(map)) {
      if (b[key] !== undefined) { sets.push(`${col} = ?`); params.push(b[key]); }
    }
    if (b.overdue !== undefined) { sets.push("overdue = ?"); params.push(b.overdue ? 1 : 0); }

    if (sets.length) {
      sets.push("updated_at = ?");
      params.push(nowISO(), id);
      db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    }
    if (Array.isArray(b.labels)) setTaskLabels(id, b.labels);

    // Log a status change with human labels.
    if (b.status && b.status !== existing.status) {
      logActivity({
        userId: req.user!.id,
        action: "moved",
        target: existing.title,
        from: statusLabel(existing.status),
        to: statusLabel(b.status),
      });
    }

    return taskDTOById(id)!;
  });

  // GET /api/tasks/:id/comments
  app.get("/api/tasks/:id/comments", (req, reply) => {
    const { id } = req.params as { id: string };
    if (!db.prepare("SELECT 1 FROM tasks WHERE id = ?").get(id)) {
      return reply.code(404).send({ error: "task not found" });
    }
    return commentDTOs(id);
  });

  // POST /api/tasks/:id/comments
  app.post("/api/tasks/:id/comments", (req, reply) => {
    const { id } = req.params as { id: string };
    const task = db.prepare("SELECT title FROM tasks WHERE id = ?").get(id) as { title: string } | undefined;
    if (!task) return reply.code(404).send({ error: "task not found" });
    const body = ((req.body as any)?.text ?? "").trim();
    if (!body) return reply.code(400).send({ error: "comment text is required" });

    const comment = addComment(id, req.user!.id, body);
    logActivity({ userId: req.user!.id, action: "commented on", target: task.title });
    return reply.code(201).send(comment);
  });

  // DELETE /api/tasks/:id
  app.delete("/api/tasks/:id", (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = db.prepare("SELECT id FROM tasks WHERE id = ?").get(id);
    if (!existing) return reply.code(404).send({ error: "task not found" });
    db.prepare("DELETE FROM tasks WHERE id = ?").run(id); // labels cascade
    return { ok: true };
  });
}
