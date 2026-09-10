import { db } from "./db";
import {
  ActivityDTO,
  ProjectDTO,
  TaskDTO,
  TaskRow,
  genId,
  nowISO,
  relativeTime,
} from "./types";

// --- tasks ---------------------------------------------------------------

const rowToDTO = (r: TaskRow, labels: string[]): TaskDTO => ({
  id: r.id,
  title: r.title,
  desc: r.description,
  projectId: r.project_id,
  assigneeId: r.assignee_id,
  status: r.status,
  priority: r.priority,
  type: r.type,
  due: r.due,
  labels,
  overdue: !!r.overdue,
});

// Attach labels to many task rows using a single IN query (no N+1).
export function attachLabels(rows: TaskRow[]): TaskDTO[] {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");
  const labelRows = db
    .prepare(`SELECT task_id, label FROM task_labels WHERE task_id IN (${placeholders}) ORDER BY label`)
    .all(...ids) as { task_id: string; label: string }[];
  const byTask = new Map<string, string[]>();
  for (const l of labelRows) {
    const arr = byTask.get(l.task_id) ?? [];
    arr.push(l.label);
    byTask.set(l.task_id, arr);
  }
  return rows.map((r) => rowToDTO(r, byTask.get(r.id) ?? []));
}

export function taskDTOById(id: string): TaskDTO | undefined {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined;
  if (!row) return undefined;
  return attachLabels([row])[0];
}

export function setTaskLabels(taskId: string, labels: string[]) {
  db.prepare("DELETE FROM task_labels WHERE task_id = ?").run(taskId);
  const ins = db.prepare("INSERT OR IGNORE INTO task_labels (task_id,label) VALUES (?,?)");
  for (const l of labels) if (l.trim()) ins.run(taskId, l.trim());
}

// Bump the project's per-project counter and return the next human id.
export const nextTaskId = db.transaction((projectId: string): string => {
  const p = db.prepare("SELECT prefix, seq FROM projects WHERE id = ?").get(projectId) as
    | { prefix: string; seq: number }
    | undefined;
  if (!p) throw new Error("project not found");
  const next = p.seq + 1;
  db.prepare("UPDATE projects SET seq = ? WHERE id = ?").run(next, projectId);
  return `${p.prefix}-${next}`;
});

// --- projects ------------------------------------------------------------

export function projectDTOs(): ProjectDTO[] {
  const projects = db.prepare("SELECT * FROM projects ORDER BY created_at").all() as any[];
  const members = db.prepare("SELECT project_id, user_id FROM project_members").all() as { project_id: string; user_id: string }[];
  const counts = db.prepare("SELECT project_id, COUNT(*) AS total, SUM(status='done') AS done FROM tasks GROUP BY project_id").all() as { project_id: string; total: number; done: number }[];

  const memberMap = new Map<string, string[]>();
  for (const m of members) {
    const arr = memberMap.get(m.project_id) ?? [];
    arr.push(m.user_id);
    memberMap.set(m.project_id, arr);
  }
  const countMap = new Map(counts.map((c) => [c.project_id, c]));

  return projects.map((p) => {
    const c = countMap.get(p.id);
    const total = c?.total ?? 0;
    const done = c?.done ?? 0;
    return {
      id: p.id,
      name: p.name,
      prefix: p.prefix,
      desc: p.description,
      color: p.color,
      status: p.status,
      progress: total ? Math.round((done / total) * 100) : 0,
      members: memberMap.get(p.id) ?? [],
      taskCount: total,
    };
  });
}

// --- activity ------------------------------------------------------------

export function logActivity(a: {
  userId: string;
  action: string;
  target: string;
  extra?: string;
  from?: string;
  to?: string;
}) {
  db.prepare(
    "INSERT INTO activity (id,user_id,action,target,extra,from_status,to_status,created_at) VALUES (?,?,?,?,?,?,?,?)"
  ).run(genId("a"), a.userId, a.action, a.target, a.extra ?? null, a.from ?? null, a.to ?? null, nowISO());
}

export function activityDTOs(limit = 30): ActivityDTO[] {  const rows = db.prepare("SELECT * FROM activity ORDER BY created_at DESC LIMIT ?").all(limit) as any[];
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    action: r.action,
    target: r.target,
    extra: r.extra ?? undefined,
    from: r.from_status ?? undefined,
    to: r.to_status ?? undefined,
    time: relativeTime(r.created_at),
  }));
}

// --- comments ------------------------------------------------------------

export interface CommentDTO {
  id: string;
  userId: string;
  text: string;
  time: string;
}

export function commentDTOs(taskId: string): CommentDTO[] {
  const rows = db
    .prepare("SELECT id, user_id, body, created_at FROM comments WHERE task_id = ? ORDER BY created_at ASC")
    .all(taskId) as { id: string; user_id: string; body: string; created_at: string }[];
  return rows.map((r) => ({ id: r.id, userId: r.user_id, text: r.body, time: relativeTime(r.created_at) }));
}

export function addComment(taskId: string, userId: string, body: string): CommentDTO {
  const id = genId("cm");
  const created = nowISO();
  db.prepare("INSERT INTO comments (id,task_id,user_id,body,created_at) VALUES (?,?,?,?,?)").run(id, taskId, userId, body, created);
  return { id, userId, text: body, time: relativeTime(created) };
}
