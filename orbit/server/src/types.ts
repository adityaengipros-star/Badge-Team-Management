// API DTOs are shaped to match the frontend types exactly, so no client mapping.

export interface UserDTO {
  id: string;
  name: string;
  init: string;
  color: string;
  presence: string;
}

export interface ProjectDTO {
  id: string;
  name: string;
  prefix: string;
  desc: string;
  color: string;
  status: string;
  progress: number;
  members: string[];
  taskCount: number;
}

export interface TaskDTO {
  id: string;
  title: string;
  desc: string;
  projectId: string;
  assigneeId: string;
  status: string;
  priority: string;
  type: string;
  due: string;
  labels: string[];
  overdue: boolean;
}

export interface ActivityDTO {
  id: string;
  userId: string;
  action: string;
  target: string;
  extra?: string;
  from?: string;
  to?: string;
  time: string;
}

// Row shapes from the DB (snake_case).
export interface TaskRow {
  id: string;
  project_id: string;
  title: string;
  description: string;
  assignee_id: string;
  status: string;
  priority: string;
  type: string;
  due: string;
  overdue: number;
}

export function nowISO() {
  return new Date().toISOString();
}

export function genId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// Compact relative-time formatter for the activity feed.
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const s = Math.max(1, Math.round((Date.now() - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  const w = Math.round(d / 7);
  return `${w} week${w === 1 ? "" : "s"} ago`;
}
