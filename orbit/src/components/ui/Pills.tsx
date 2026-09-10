import type { Priority, TaskType } from "@/types";
import { TASK_TYPE_ICON } from "@/lib/icons";

export function PriorityPill({ priority, bar = true }: { priority: Priority; bar?: boolean }) {
  return (
    <span className={`prio prio-${priority}`}>
      {bar && <span className="prio-bar" style={{ background: "currentColor" }} />}
      {priority}
    </span>
  );
}

export function TypeLabel({ type }: { type: TaskType }) {
  const Icon = TASK_TYPE_ICON[type];
  return (
    <span className="tc-type">
      <Icon size={13} strokeWidth={2} />
      {type}
    </span>
  );
}
