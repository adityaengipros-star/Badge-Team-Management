import { FastifyInstance } from "fastify";
import { db } from "../db";
import { nowISO } from "../types";
import { projectDTOs } from "../repo";

export async function projectRoutes(app: FastifyInstance) {
  app.get("/api/projects", () => projectDTOs());

  app.get("/api/projects/:id", (req, reply) => {
    const { id } = req.params as { id: string };
    const project = projectDTOs().find((p) => p.id === id);
    if (!project) return reply.code(404).send({ error: "project not found" });
    return project;
  });

  // Minimal create so projects can be added later; prefix must be unique.
  app.post("/api/projects", (req, reply) => {
    const b = req.body as any;
    if (!b?.name || !b?.prefix) return reply.code(400).send({ error: "name and prefix are required" });
    const prefix = String(b.prefix).toUpperCase();
    if (db.prepare("SELECT 1 FROM projects WHERE prefix = ?").get(prefix)) {
      return reply.code(409).send({ error: "prefix already in use" });
    }
    const id = `p_${Date.now().toString(36)}`;
    db.prepare(
      "INSERT INTO projects (id,name,prefix,description,color,status,seq,created_at) VALUES (?,?,?,?,?,?,?,?)"
    ).run(id, b.name, prefix, b.desc ?? "", b.color ?? "#5b63d3", b.status ?? "planning", 100, nowISO());
    for (const m of b.members ?? []) {
      db.prepare("INSERT OR IGNORE INTO project_members (project_id,user_id) VALUES (?,?)").run(id, m);
    }
    return reply.code(201).send(projectDTOs().find((p) => p.id === id));
  });
}
