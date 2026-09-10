const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "Todo",
  progress: "In Progress",
  review: "Review",
  blocked: "Blocked",
  done: "Done",
};

export const statusLabel = (id: string) => STATUS_LABELS[id] ?? id;
