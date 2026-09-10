import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { TASK_TYPE_ICON } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { Avatar } from "@/components/ui/Avatar";

type Result =
  | { type: "nav"; id: string; label: string; to: string }
  | { type: "task"; id: string; label: string }
  | { type: "proj"; id: string; label: string; color: string }
  | { type: "person"; id: string; label: string };

const PAGES = [
  { label: "Dashboard", to: "/" },
  { label: "All Tasks", to: "/tasks" },
  { label: "My Tasks", to: "/my-tasks" },
  { label: "Projects", to: "/projects" },
  { label: "Chats", to: "/chats" },
  { label: "Activity", to: "/activity" },
  { label: "Connectors", to: "/connectors" },
  { label: "Settings", to: "/settings" },
];

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen);
  const setPalette = useStore((s) => s.setPalette);
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const selectTask = useStore((s) => s.selectTask);
  const setFilter = useStore((s) => s.setFilter);
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const needle = q.toLowerCase();
    const out: Result[] = [];
    PAGES.filter((p) => p.label.toLowerCase().includes(needle)).forEach((p) =>
      out.push({ type: "nav", id: p.to, label: p.label, to: p.to })
    );
    tasks
      .filter((t) => t.title.toLowerCase().includes(needle) || t.id.toLowerCase().includes(needle))
      .slice(0, 6)
      .forEach((t) => out.push({ type: "task", id: t.id, label: t.title }));
    projects
      .filter((p) => p.name.toLowerCase().includes(needle))
      .slice(0, 4)
      .forEach((p) => out.push({ type: "proj", id: p.id, label: p.name, color: p.color }));
    users
      .filter((u) => u.name.toLowerCase().includes(needle))
      .slice(0, 4)
      .forEach((u) => out.push({ type: "person", id: u.id, label: u.name }));
    return out;
  }, [q, tasks, projects, users]);

  useEffect(() => setSel(0), [q]);

  function exec(r: Result | undefined) {
    if (!r) return;
    setPalette(false);
    if (r.type === "nav") navigate(r.to);
    else if (r.type === "task") {
      navigate("/tasks");
      setTimeout(() => selectTask(r.id), 80);
    } else if (r.type === "proj") navigate(`/projects/${r.id}`);
    else if (r.type === "person") {
      setFilter("assigneeId", r.id);
      navigate("/tasks");
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPalette(false);
      if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); exec(results[sel]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, sel]); // eslint-disable-line react-hooks/exhaustive-deps

  // group results for rendering, preserving order
  let lastType = "";
  const groupTitle: Record<string, string> = { nav: "Navigate", task: "Tasks", proj: "Projects", person: "People" };

  return (
    <>
      <div className={`scrim ${open ? "open" : ""}`} onClick={() => setPalette(false)} />
      <div className={`palette ${open ? "open" : ""}`}>
        <div className="palette-input">
          <Search size={18} strokeWidth={2} color="var(--text-muted)" />
          <input ref={inputRef} placeholder="Search or jump to…" value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="kbd">esc</span>
        </div>
        <div className="palette-results">
          {results.length === 0 && <div className="empty" style={{ padding: 40 }}><p>No results</p></div>}
          {results.map((r, i) => {
            const header = r.type !== lastType ? ((lastType = r.type), <div className="pal-group" key={`g-${r.type}`}>{groupTitle[r.type]}</div>) : null;
            return (
              <div key={`${r.type}-${r.id}`}>
                {header}
                <button className={`pal-item ${i === sel ? "sel" : ""}`} onMouseEnter={() => setSel(i)} onClick={() => exec(r)}>
                  <ResultIcon r={r} />
                  <span>{r.label}</span>
                  {r.type === "task" ? <span className="pid">{r.id}</span> : <span className="pkind" style={{ marginLeft: "auto" }}>{groupTitle[r.type]}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ResultIcon({ r }: { r: Result }) {
  const users = useStore((s) => s.users);
  if (r.type === "proj") return <span className="tc-dot" style={{ background: r.color, width: 12, height: 12 }} />;
  if (r.type === "person") { const u = users.find((x) => x.id === r.id)!; return <Avatar user={u} size="sm" />; }
  if (r.type === "task") { const t = useStore.getState().tasks.find((x) => x.id === r.id); const Icon = t ? TASK_TYPE_ICON[t.type] : Search; return <Icon size={16} strokeWidth={1.9} />; }
  return <Search size={16} strokeWidth={1.9} />;
}
