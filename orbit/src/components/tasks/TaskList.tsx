import type { Task } from "@/types";
import { projectById, userById, useStore } from "@/store/useStore";
import { statusById } from "@/data/constants";
import { Avatar } from "@/components/ui/Avatar";
import { PriorityPill } from "@/components/ui/Pills";

export function TaskList({ tasks }: { tasks: Task[] }) {
  const selectTask = useStore((s) => s.selectTask);
  return (
    <div className="list">
      <div className="list-row list-head">
        <span>ID</span>
        <span>Title</span>
        <span className="lr-hide">Project</span>
        <span className="lr-hide">Priority</span>
        <span className="lr-hide">Assignee</span>
        <span>Status</span>
      </div>
      {tasks.map((t) => {
        const u = userById(t.assigneeId);
        const p = projectById(t.projectId);
        const s = statusById(t.status);
        return (
          <div className="list-row" key={t.id} onClick={() => selectTask(t.id)}>
            <span className="task-id">{t.id}</span>
            <span className="lr-title">
              {t.title}
              <small>{t.type}</small>
            </span>
            <span className="lr-cell lr-hide">
              <span className="tc-dot" style={{ background: p.color, display: "inline-block", marginRight: 6 }} />
              {p.name}
            </span>
            <span className="lr-hide">
              <PriorityPill priority={t.priority} bar={false} />
            </span>
            <span className="lr-cell lr-hide">
              <Avatar user={u} size="sm" />
            </span>
            <span>
              <span className={`status ${s.cls}`}>
                <span className="sdot" />
                {s.label}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
