import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useStore, userById } from "@/store/useStore";
import { Avatar } from "@/components/ui/Avatar";
import { cap } from "@/data/constants";

const TAG_CLASS: Record<string, string> = { active: "tag-active", planning: "tag-planning", paused: "tag-paused" };

export function Projects() {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Projects</div>
          <div className="page-sub">{projects.length} active workspaces for the hardware team.</div>
        </div>
        <button className="btn btn-ghost"><Plus size={15} strokeWidth={2.2} /> New Project</button>
      </div>

      <div className="proj-grid">
        {projects.map((p) => {
          const count = tasks.filter((t) => t.projectId === p.id).length;
          return (
            <Link className="proj-card" to={`/projects/${p.id}`} key={p.id}>
              <div className="pc-top">
                <div className="proj-ic" style={{ background: p.color, width: 38, height: 38, borderRadius: 10 }}>{p.prefix[0]}</div>
                <div>
                  <div className="pc-title">{p.name}</div>
                  <div className="pc-desc">{p.desc}</div>
                </div>
                <span className={`pc-status tag ${TAG_CLASS[p.status]}`}>{cap(p.status)}</span>
              </div>
              <div className="pc-progress-row"><span>Progress</span><b style={{ color: "var(--text-primary)" }}>{p.progress}%</b></div>
              <div className="progress"><i style={{ width: `${p.progress}%`, background: p.color }} /></div>
              <div className="pc-foot">
                <div className="pc-meta">
                  <span><b>{count}</b> Tasks</span>
                  <span><b>{p.members.length}</b> Members</span>
                </div>
                <div className="avatars">
                  {p.members.map((m) => <Avatar user={userById(m)} size="sm" key={m} />)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
