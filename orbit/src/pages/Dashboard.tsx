import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { List, Clock, Calendar, Check, type LucideIcon } from "lucide-react";
import { useStore, userById } from "@/store/useStore";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Avatar } from "@/components/ui/Avatar";
import { SkeletonCards } from "@/components/ui/Skeleton";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function Dashboard() {
  const projects = useStore((s) => s.projects);
  const stats = useStore((s) => s.stats);
  const myTasks = useStore((s) => s.myTasks);
  const upcoming = useStore((s) => s.upcoming);
  const activity = useStore((s) => s.activity);
  const loading = useStore((s) => s.dashboardLoading);
  const loadDashboard = useStore((s) => s.loadDashboard);
  const currentUserId = useStore((s) => s.currentUserId);
  const selectTask = useStore((s) => s.selectTask);
  const me = userById(currentUserId);
  const navigate = useNavigate();

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">{greeting()}, {me.name.split(" ")[0]}</div>
          <div className="page-sub">Here's what's happening across your projects.</div>
        </div>
      </div>

      <div className="stat-row">
        <Stat label="Total Tasks" value={stats?.total} delta="all projects" Icon={List} color="var(--accent)" />
        <Stat label="In Progress" value={stats?.inProgress} delta="active now" Icon={Clock} color="var(--info)" />
        <Stat label="Due Soon" value={stats?.dueSoon} delta="next 7 days" Icon={Calendar} color="var(--warning)" />
        <Stat label="Completed" value={stats?.completed} delta="done" Icon={Check} color="var(--success)" up />
      </div>

      <div className="dash-grid">
        <div>
          <div className="section-head">
            <span className="section-title">Your Tasks</span>
            <Link className="link-btn" to="/my-tasks">View all →</Link>
          </div>
          {loading && myTasks.length === 0 ? (
            <SkeletonCards count={4} />
          ) : myTasks.length === 0 ? (
            <div className="empty" style={{ padding: 40 }}><p>You're all caught up. Nice.</p></div>
          ) : (
            <div className="task-grid">{myTasks.map((t) => <TaskCard task={t} key={t.id} />)}</div>
          )}
        </div>

        <div className="rail">
          <div className="panel">
            <h3>Recent Activity <Link className="link-btn" to="/activity">All</Link></h3>
            {activity.slice(0, 5).map((a) => {
              const u = userById(a.userId);
              return (
                <div className="activity-item" key={a.id}>
                  <Avatar user={u} size="sm" />
                  <div>
                    <div className="act-body">
                      <b>{u.name.split(" ")[0]}</b> {a.action} <b>{a.target}</b>
                      {a.extra ? ` ${a.extra}` : ""}
                      {a.from ? <> from <b>{a.from}</b> to <b>{a.to}</b></> : null}
                    </div>
                    <div className="act-time">{a.time}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="panel">
            <h3>Upcoming</h3>
            {upcoming.map((t) => {
              const p = projects.find((x) => x.id === t.projectId);
              const [m, d] = t.due.split(" ");
              return (
                <div className="upcoming-item" key={t.id} style={{ cursor: "pointer" }} onClick={() => { navigate("/tasks"); void selectTask(t.id); }}>
                  <div className="up-date"><div className="d">{d ?? "—"}</div><div className="m">{m}</div></div>
                  <div className="up-info"><b>{t.title}</b><span>{p?.prefix} · {t.id}</span></div>
                </div>
              );
            })}
          </div>

          <div className="panel">
            <h3>Projects <Link className="link-btn" to="/projects">All</Link></h3>
            {projects.slice(0, 4).map((p) => (
              <Link className="mini-proj" key={p.id} to={`/projects/${p.id}`} style={{ cursor: "pointer" }}>
                <div className="proj-ic" style={{ background: p.color }}>{p.prefix[0]}</div>
                <div className="pm-info">
                  <b>{p.name}</b>
                  <div className="progress"><i style={{ width: `${p.progress}%`, background: p.color }} /></div>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{p.progress}%</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, delta, Icon, color, up }: { label: string; value?: number; delta: string; Icon: LucideIcon; color: string; up?: boolean }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-ic" style={{ background: `color-mix(in srgb, ${color} 13%, transparent)`, color }}>
          <Icon size={15} strokeWidth={2.1} />
        </span>
      </div>
      <div className="stat-val">{value ?? "—"}</div>
      <div className={`stat-delta ${up ? "up" : ""}`}>{delta}</div>
    </div>
  );
}
