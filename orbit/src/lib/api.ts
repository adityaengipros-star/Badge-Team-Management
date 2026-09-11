import type {
  ActivityEntry,
  Channel,
  Comment,
  Connector,
  Message,
  NewTaskInput,
  Project,
  Task,
  User,
} from "@/types";

const BASE = "/api";

// The store registers this so an expired session anywhere drops us to login.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function http<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "content-type": "application/json" },
    credentials: "include", // send/receive the session cookie
    ...opts,
  });
  if (!res.ok) {
    // A 401 on anything other than the auth endpoints means the session is gone.
    if (res.status === 401 && !path.startsWith("/auth/")) onUnauthorized?.();
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface TaskQuery {
  q?: string;
  projectId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  type?: string;
  scope?: "all" | "mine";
  page?: number;
  pageSize?: number;
}

export interface TaskPage {
  items: Task[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface Stats {
  total: number;
  inProgress: number;
  dueSoon: number;
  completed: number;
  myOpen: number;
}

export interface BootstrapData {
  users: User[];
  projects: Project[];
  currentUserId: string;
}

function qs(params: Record<string, unknown>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const api = {
  bootstrap: () => http<BootstrapData>("/bootstrap"),
  stats: () => http<Stats>("/stats"),
  listTasks: (query: TaskQuery = {}) => http<TaskPage>(`/tasks${qs(query as Record<string, unknown>)}`),
  getTask: (id: string) => http<Task>(`/tasks/${id}`),
  createTask: (body: NewTaskInput) => http<Task>("/tasks", { method: "POST", body: JSON.stringify(body) }),
  updateTask: (id: string, patch: Partial<Task>) => http<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteTask: (id: string) => http<{ ok: boolean }>(`/tasks/${id}`, { method: "DELETE" }),
  listActivity: (limit = 30) => http<ActivityEntry[]>(`/activity?limit=${limit}`),
  listConnectors: () => http<Connector[]>("/connectors"),

  // auth
  me: () => http<User>("/auth/me"),
  login: (email: string, password: string) =>
    http<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => http<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  register: (name: string, email: string, password: string) =>
    http<{ ok: boolean; pending: boolean; message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  // admin
  listPending: () => http<User[]>("/admin/pending"),
  listMembers: () => http<User[]>("/admin/users"),
  approveUser: (id: string) => http<User>(`/admin/users/${id}/approve`, { method: "POST" }),
  declineUser: (id: string) => http<User>(`/admin/users/${id}/decline`, { method: "POST" }),

  // comments
  listComments: (taskId: string) => http<Comment[]>(`/tasks/${taskId}/comments`),
  addComment: (taskId: string, text: string) =>
    http<Comment>(`/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify({ text }) }),

  // chat
  listChannels: () => http<{ channels: Channel[]; dms: Channel[] }>("/channels"),
  listMessages: (channelId: string, after?: string) =>
    http<Message[]>(`/channels/${channelId}/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`),
  postMessage: (channelId: string, text: string) =>
    http<Message>(`/channels/${channelId}/messages`, { method: "POST", body: JSON.stringify({ text }) }),
  openDm: (userId: string) => http<{ id: string }>(`/dms/${userId}`, { method: "POST" }),
};
