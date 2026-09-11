import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { NewTaskInput, Priority, StatusId, TaskType } from "@/types";
import { useStore } from "@/store/useStore";
import { PRIORITIES, STATUSES, TASK_TYPES, cap } from "@/data/constants";

const blank = (projectId: string): NewTaskInput => ({
  title: "",
  desc: "",
  projectId,
  assigneeId: "u1",
  status: "todo",
  priority: "medium",
  type: "Development",
  due: "",
  labels: [],
});

export function NewTaskModal() {
  const open = useStore((s) => s.newTaskOpen);
  const close = useStore((s) => s.closeNewTask);
  const addTask = useStore((s) => s.addTask);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);

  const [form, setForm] = useState<NewTaskInput>(() => blank(projects[0]?.id ?? ""));
  const [labels, setLabels] = useState("");

  useEffect(() => {
    if (open) {
      setForm(blank(projects[0]?.id ?? ""));
      setLabels("");
    }
  }, [open, projects]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const set = <K extends keyof NewTaskInput>(k: K, v: NewTaskInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function create() {
    const title = form.title.trim() || "Untitled task";
    close();
    await addTask({
      ...form,
      title,
      labels: labels.split(",").map((l) => l.trim()).filter(Boolean),
      due: form.due || "No date",
    });
  }

  return (
    <>
      <div className={`scrim ${open ? "open" : ""}`} onClick={close} />
      <div className={`modal ${open ? "open" : ""}`}>
        <div className="modal-head">
          <h2>New Task</h2>
          <button className="icon-btn" onClick={close}><X size={18} strokeWidth={2} /></button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="form-label">Title</label>
            <input className="form-input" autoFocus placeholder="What needs to be done?" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="form-row">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Add more detail…" value={form.desc} onChange={(e) => set("desc", e.target.value)} />
          </div>
          <div className="form-row two">
            <div>
              <label className="form-label">Project</label>
              <select className="form-select" value={form.projectId} onChange={(e) => set("projectId", e.target.value)}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={(e) => set("type", e.target.value as TaskType)}>
                {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row two">
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => set("status", e.target.value as StatusId)}>
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={(e) => set("priority", e.target.value as Priority)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{cap(p)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row two">
            <div>
              <label className="form-label">Assignee</label>
              <select className="form-select" value={form.assigneeId} onChange={(e) => set("assigneeId", e.target.value)}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Due date</label>
              <input className="form-input" type="date" value={form.due} onChange={(e) => set("due", e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">Labels</label>
            <input className="form-input" placeholder="Firmware, Power (comma separated)" value={labels} onChange={(e) => setLabels(e.target.value)} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button className="btn btn-primary" onClick={create}>Create Task</button>
        </div>
      </div>
    </>
  );
}
