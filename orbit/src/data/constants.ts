import type { Priority, StatusId, TaskType } from "@/types";

export const STATUSES: { id: StatusId; label: string; cls: string }[] = [
  { id: "backlog", label: "Backlog", cls: "st-backlog" },
  { id: "todo", label: "Todo", cls: "st-todo" },
  { id: "progress", label: "In Progress", cls: "st-progress" },
  { id: "review", label: "Review", cls: "st-review" },
  { id: "blocked", label: "Blocked", cls: "st-blocked" },
  { id: "done", label: "Done", cls: "st-done" },
];

export const statusById = (id: StatusId) =>
  STATUSES.find((s) => s.id === id) ?? STATUSES[0];

export const STATUS_COLORS: Record<StatusId, string> = {
  backlog: "#8a909c",
  todo: "var(--info)",
  progress: "var(--accent)",
  review: "var(--warning)",
  blocked: "var(--danger)",
  done: "var(--success)",
};

export const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

export const TASK_TYPES: TaskType[] = [
  "Issue",
  "Development",
  "Bug",
  "Enhancement",
  "Upgrade",
  "Research",
  "Documentation",
  "Testing",
  "Maintenance",
  "Feature",
];

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
