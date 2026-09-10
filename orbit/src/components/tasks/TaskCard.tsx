import { Calendar } from "lucide-react";
import type { Task } from "@/types";
import { projectById, userById, useStore } from "@/store/useStore";
import { Avatar } from "@/components/ui/Avatar";
import { PriorityPill, TypeLabel } from "@/components/ui/Pills";
import { StatusSelect } from "@/components/ui/StatusSelect";

export function TaskCard({ task }: { task: Task }) {
  const selectTask = useStore((s) => s.selectTask);
  const setTaskStatus = useStore((s) => s.setTaskStatus);
  const user = userById(task.assigneeId);
  const project = projectById(task.projectId);

  return (
    <div className="task-card" onClick={() => selectTask(task.id)}>
      <div className="tc-top">
        <span className="task-id">{task.id}</span>
        <PriorityPill priority={task.priority} />
      </div>
      <div className="tc-title">{task.title}</div>
      {task.desc && <div className="tc-desc">{task.desc}</div>}
      <div className="tc-labels">
        <TypeLabel type={task.type} />
        {task.labels.map((l) => (
          <span className="chip" key={l}>
            {l}
          </span>
        ))}
      </div>
      <div className="tc-project">
        <span className="tc-dot" style={{ background: project.color }} />
        {project.name}
      </div>
      <div className="tc-foot">
        <span className="tc-assignee">
          <Avatar user={user} size="sm" />
          {user.name.split(" ")[0]}
        </span>
        <span className={`tc-due ${task.overdue ? "overdue" : ""}`}>
          <Calendar size={12} strokeWidth={2} />
          {task.due}
        </span>
      </div>
      <StatusSelect
        status={task.status}
        onChange={(s) => setTaskStatus(task.id, s)}
        onClickCapture={(e) => e.stopPropagation()}
      />
    </div>
  );
}
