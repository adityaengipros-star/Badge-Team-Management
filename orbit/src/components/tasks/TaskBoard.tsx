import { Plus } from "lucide-react";
import type { Task } from "@/types";
import { STATUSES } from "@/data/constants";
import { TaskCard } from "./TaskCard";

// Lazy-loaded via React.lazy from the Tasks page so board code isn't in the
// initial bundle (per the performance brief).
export default function TaskBoard({ tasks }: { tasks: Task[] }) {
  const columns = STATUSES.filter((s) => s.id !== "blocked");
  return (
    <div className="board">
      {columns.map((col) => {
        const items = tasks.filter((t) => t.status === col.id);
        return (
          <div className="board-col" key={col.id}>
            <div className="board-col-head">
              <span className={`status ${col.cls}`} style={{ border: "none", background: "none", padding: 0 }}>
                <span className="sdot" />
                {col.label}
              </span>
              <span className="count">{items.length}</span>
            </div>
            {items.map((t) => (
              <TaskCard task={t} key={t.id} />
            ))}
            <button className="board-add">
              <Plus size={14} strokeWidth={2} /> Add task
            </button>
          </div>
        );
      })}
    </div>
  );
}
