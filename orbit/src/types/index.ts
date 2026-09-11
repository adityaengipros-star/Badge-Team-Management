// Core domain types. In Phase 2 these will mirror the API/DB schema.

export type StatusId =
  | "backlog"
  | "todo"
  | "progress"
  | "review"
  | "blocked"
  | "done";

export type Priority = "low" | "medium" | "high" | "urgent";

export type TaskType =
  | "Issue"
  | "Development"
  | "Bug"
  | "Enhancement"
  | "Upgrade"
  | "Research"
  | "Documentation"
  | "Testing"
  | "Maintenance"
  | "Feature";

export type Presence = "online" | "away" | "offline";
export type ProjectStatus = "active" | "planning" | "paused";

export interface User {
  id: string;
  name: string;
  init: string;
  color: string;
  presence: Presence;
  email?: string;
  role?: "admin" | "member";
  status?: "pending" | "active" | "declined";
}

export interface Project {
  id: string;
  name: string;
  prefix: string;
  desc: string;
  color: string;
  status: ProjectStatus;
  progress: number;
  members: string[];
  taskCount?: number;
}

export interface Task {
  id: string;
  title: string;
  desc: string;
  projectId: string;
  assigneeId: string;
  status: StatusId;
  priority: Priority;
  type: TaskType;
  due: string; // display string in Phase 1; ISO date in Phase 2
  labels: string[];
  overdue?: boolean;
}

export interface ActivityEntry {
  id: string;
  userId: string;
  action: string;
  target: string;
  extra?: string;
  from?: string;
  to?: string;
  time: string;
}

export interface Channel {
  id: string;
  name: string;
  desc?: string;
  unread?: number;
  kind?: "channel" | "dm";
}

export interface DirectMessage {
  id: string;
  userId: string;
}

export interface Message {
  id: string;
  userId: string;
  time: string;
  text: string;
  ts?: string;
}

export interface Connector {
  name: string;
  status: "on" | "off";
  color: string;
  desc: string;
}

export interface Comment {
  id: string;
  userId: string;
  time: string;
  text: string;
}

export interface Filters {
  q: string;
  projectId: string;
  assigneeId: string;
  status: StatusId | "";
  priority: Priority | "";
  type: TaskType | "";
}

export type TaskView = "tile" | "list" | "board";

export interface Toast {
  id: string;
  message: string;
}

// Payload used when creating a task from the modal.
export type NewTaskInput = Omit<Task, "id" | "overdue">;
