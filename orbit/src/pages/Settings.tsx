import type { ReactNode } from "react";
import { useStore, userById } from "@/store/useStore";
import { Avatar } from "@/components/ui/Avatar";
import { cap } from "@/data/constants";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="meta-grid" style={{ gridTemplateColumns: "180px 1fr", marginBottom: 0, padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
      <div className="meta-key">{label}</div>
      <div className="meta-val">{children}</div>
    </div>
  );
}

export default function Settings() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const users = useStore((s) => s.users);

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Manage your workspace and preferences.</div>
        </div>
      </div>
      <div className="panel" style={{ padding: "6px 20px" }}>
        <Row label="Workspace name">Hardware Team</Row>
        <Row label="Your name">{userById("u1").name}</Row>
        <Row label="Email">aditya@orbit.dev</Row>
        <Row label="Theme">
          <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>{cap(theme)} mode</button>
        </Row>
        <Row label="Task prefix">Defined per project (BADGE, WEB, ENG…)</Row>
        <div style={{ padding: "14px 0" }}>
          <div className="meta-key" style={{ marginBottom: 10 }}>Members</div>
          <div className="avatars">{users.map((u) => <Avatar user={u} key={u.id} />)}</div>
        </div>
      </div>
    </div>
  );
}
