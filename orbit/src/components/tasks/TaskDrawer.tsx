import { useEffect, useState } from "react";
import { Calendar, MoreVertical, Pencil, X, Send } from "lucide-react";
import { projectById, userById, useStore } from "@/store/useStore";
import { TASK_TYPE_ICON } from "@/lib/icons";
import { Avatar } from "@/components/ui/Avatar";
import { PriorityPill } from "@/components/ui/Pills";
import { StatusSelect } from "@/components/ui/StatusSelect";

export function TaskDrawer() {
  const task = useStore((s) => s.selectedTask);
  const selectTask = useStore((s) => s.selectTask);
  const setTaskStatus = useStore((s) => s.setTaskStatus);
  const comments = useStore((s) => s.comments);
  const commentsLoading = useStore((s) => s.commentsLoading);
  const loadComments = useStore((s) => s.loadComments);
  const postComment = useStore((s) => s.postComment);

  const open = !!task;
  const [draft, setDraft] = useState("");

  // Load comments whenever a different task opens.
  useEffect(() => {
    if (task) loadComments(task.id);
  }, [task?.id, loadComments]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && selectTask(null);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selectTask]);

  const close = () => selectTask(null);

  async function submitComment() {
    if (!task || !draft.trim()) return;
    const text = draft;
    setDraft("");
    await postComment(task.id, text);
  }

  return (
    <>
      <div className={`scrim ${open ? "open" : ""}`} onClick={close} />
      <aside className={`drawer ${open ? "open" : ""}`}>
        {task && (
          <>
            <div className="drawer-head">
              <span className="task-id" style={{ fontSize: 12.5 }}>{task.id}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                <button className="icon-btn" title="Edit"><Pencil size={17} strokeWidth={2} /></button>
                <button className="icon-btn" title="More"><MoreVertical size={17} strokeWidth={2} /></button>
                <button className="icon-btn" title="Close" onClick={close}><X size={18} strokeWidth={2} /></button>
              </div>
            </div>
            <div className="drawer-body">
              <div style={{ marginBottom: 4 }}>
                <StatusSelect status={task.status} onChange={(s) => setTaskStatus(task.id, s)} />
              </div>
              <div className="drawer-title">{task.title}</div>
              <div className="drawer-desc">{task.desc || "No description provided."}</div>

              <DrawerMeta task={task} />

              <div className="subhead">Activity</div>
              <div className="activity-item" style={{ border: "none", paddingTop: 0 }}>
                <Avatar user={userById(task.assigneeId)} size="sm" />
                <div>
                  <div className="act-body">
                    <b>{userById(task.assigneeId).name.split(" ")[0]}</b> created this task
                  </div>
                  <div className="act-time">3 days ago</div>
                </div>
              </div>

              <div className="subhead">Comments{comments.length ? ` (${comments.length})` : ""}</div>
              {commentsLoading ? (
                <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "4px 0 12px" }}>Loading…</div>
              ) : comments.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "4px 0 12px" }}>No comments yet.</div>
              ) : (
                comments.map((c) => {
                  const u = userById(c.userId);
                  return (
                    <div className="comment" key={c.id}>
                      <Avatar user={u} size="sm" />
                      <div className="c-body">
                        <div className="c-top">
                          <b>{u.name}</b>
                          <time>{c.time}</time>
                        </div>
                        <div className="c-text">{c.text}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div className="field" style={{ marginTop: 14 }}>
                <input
                  placeholder="Write a comment…"
                  style={{ width: "100%" }}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submitComment();
                    }
                  }}
                />
                <button className="icon-btn" title="Send" onClick={() => void submitComment()} disabled={!draft.trim()}>
                  <Send size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function DrawerMeta({ task }: { task: NonNullable<ReturnType<typeof useStore.getState>["tasks"][number]> }) {
  const p = projectById(task.projectId);
  const u = userById(task.assigneeId);
  const TypeIcon = TASK_TYPE_ICON[task.type];
  return (
    <div className="meta-grid">
      <span className="meta-key">Project</span>
      <span className="meta-val"><span className="tc-dot" style={{ background: p.color }} />{p.name}</span>
      <span className="meta-key">Assignee</span>
      <span className="meta-val"><Avatar user={u} size="sm" />{u.name}</span>
      <span className="meta-key">Priority</span>
      <span className="meta-val"><PriorityPill priority={task.priority} bar={false} /></span>
      <span className="meta-key">Type</span>
      <span className="meta-val"><TypeIcon size={14} strokeWidth={2} />{task.type}</span>
      <span className="meta-key">Due date</span>
      <span className="meta-val"><Calendar size={14} strokeWidth={2} />{task.due}</span>
      <span className="meta-key">Labels</span>
      <span className="meta-val" style={{ flexWrap: "wrap" }}>
        {task.labels.map((l) => <span className="chip" key={l}>{l}</span>)}
      </span>
    </div>
  );
}
