import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore, userById } from "@/store/useStore";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Avatar } from "@/components/ui/Avatar";
import { cap } from "@/data/constants";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCards } from "@/components/ui/Skeleton";

export function ProjectWorkspace() {
  const { id } = useParams();
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const loading = useStore((s) => s.tasksLoading);
  const openNewTask = useStore((s) => s.openNewTask);
  const loadTasks = useStore((s) => s.loadTasks);
  const project = projects.find((p) => p.id === id);

  // Load this project's tasks (server-side filter) whenever the id changes.
  useEffect(() => {
    if (id) loadTasks({ projectId: id, pageSize: 200 });
  }, [id, loadTasks]);

  if (!project) {
    return (
      <div className="page">
        <EmptyState title="Project not found" body="This project may have been removed." />
      </div>
    );
  }

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const firstLoad = loading && projectTasks.length === 0;

  const stats = [
    { label: "Tasks", value: projectTasks.length },
    { label: "Progress", value: `${project.progress}%` },
    { label: "Members", value: project.members.length },
    { label: "Status", value: cap(project.status) },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="proj-ic" style={{ background: project.color, width: 44, height: 44, borderRadius: 12, fontSize: 16 }}>{project.prefix[0]}</div>
          <div>
            <div className="page-title">{project.name}</div>
            <div className="page-sub">{project.desc}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="avatars">{project.members.map((m) => <Avatar user={userById(m)} size="sm" key={m} />)}</div>
          <Link className="btn btn-ghost btn-sm" to="/projects">← Projects</Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, marginBottom: 22, flexWrap: "wrap" }}>
        {stats.map((s) => (
          <div className="stat" style={{ flex: 1, minWidth: 160 }} key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-val" style={{ marginTop: 6, fontSize: typeof s.value === "string" && isNaN(Number(s.value.replace("%", ""))) ? 18 : 26, textTransform: "capitalize" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="section-head"><span className="section-title">Tasks</span></div>
      {firstLoad ? (
        <SkeletonCards />
      ) : projectTasks.length ? (
        <div className="task-grid">{projectTasks.map((t) => <TaskCard task={t} key={t.id} />)}</div>
      ) : (
        <EmptyState title="No tasks yet" body="Create the first task for this project." action={{ label: "New Task", onClick: openNewTask }} />
      )}
    </div>
  );
}
