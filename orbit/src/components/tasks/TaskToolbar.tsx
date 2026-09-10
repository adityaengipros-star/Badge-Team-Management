import { useEffect, useRef, useState } from "react";
import { Search, LayoutGrid, List as ListIcon, Columns3 } from "lucide-react";
import type { TaskView } from "@/types";
import { useStore } from "@/store/useStore";
import { PRIORITIES, STATUSES, cap } from "@/data/constants";

export function TaskToolbar() {
  const { projects, users, filters, taskView } = useStore();
  const setFilter = useStore((s) => s.setFilter);
  const clearFilters = useStore((s) => s.clearFilters);
  const setTaskView = useStore((s) => s.setTaskView);

  // Debounce the search input so filtering doesn't run on every keystroke.
  const [q, setQ] = useState(filters.q);
  const timer = useRef<number>();
  useEffect(() => {
    timer.current = window.setTimeout(() => setFilter("q", q), 220);
    return () => window.clearTimeout(timer.current);
  }, [q, setFilter]);
  useEffect(() => setQ(filters.q), [filters.q]);

  const hasFilters = Object.values(filters).some(Boolean);
  const views: { id: TaskView; label: string; Icon: typeof LayoutGrid }[] = [
    { id: "tile", label: "Tile", Icon: LayoutGrid },
    { id: "list", label: "List", Icon: ListIcon },
    { id: "board", label: "Board", Icon: Columns3 },
  ];

  return (
    <div className="toolbar">
      <div className="field">
        <Search size={15} strokeWidth={2} />
        <input placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <select className="select" value={filters.projectId} onChange={(e) => setFilter("projectId", e.target.value)}>
        <option value="">All Projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <select className="select" value={filters.status} onChange={(e) => setFilter("status", e.target.value as never)}>
        <option value="">All Status</option>
        {STATUSES.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>

      <select className="select" value={filters.priority} onChange={(e) => setFilter("priority", e.target.value as never)}>
        <option value="">All Priority</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{cap(p)}</option>
        ))}
      </select>

      <select className="select" value={filters.assigneeId} onChange={(e) => setFilter("assigneeId", e.target.value)}>
        <option value="">Anyone</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>

      {hasFilters && (
        <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
      )}

      <div className="view-switch">
        {views.map(({ id, label, Icon }) => (
          <button key={id} className={taskView === id ? "active" : ""} onClick={() => setTaskView(id)}>
            <Icon size={14} strokeWidth={2} /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}
