import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { User } from "@/types";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
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
  const currentUser = useStore((s) => s.currentUser);
  const pushToast = useStore((s) => s.pushToast);
  const isAdmin = currentUser?.role === "admin";

  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    api.listMembers().then(setMembers).catch(() => {}).finally(() => setLoading(false));
  }, [isAdmin]);

  async function act(id: string, action: "approve" | "decline") {
    try {
      const updated = action === "approve" ? await api.approveUser(id) : await api.declineUser(id);
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
      pushToast(`${updated.name} ${action === "approve" ? "approved" : "declined"}`);
    } catch (e) {
      pushToast((e as Error).message);
    }
  }

  const pending = members.filter((m) => m.status === "pending");
  const others = members.filter((m) => m.status !== "pending");

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
        <Row label="Your name">{currentUser?.name ?? "\u2014"}</Row>
        <Row label="Email">{currentUser?.email ?? "\u2014"}</Row>
        <Row label="Role">
          <span className={`badge-pill ${isAdmin ? "badge-admin" : "badge-active"}`}>{cap(currentUser?.role ?? "member")}</span>
        </Row>
        <Row label="Theme">
          <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>{cap(theme)} mode</button>
        </Row>
      </div>

      {isAdmin && (
        <>
          <div className="section-head" style={{ marginTop: 28 }}>
            <span className="section-title">Access requests</span>
            {pending.length > 0 && <span className="badge-pill badge-pending">{pending.length} pending</span>}
          </div>
          <div className="panel" style={{ padding: "6px 20px" }}>
            {loading ? (
              <div style={{ padding: 14, color: "var(--text-muted)", fontSize: 13 }}>Loading\u2026</div>
            ) : pending.length === 0 ? (
              <div style={{ padding: 14, color: "var(--text-muted)", fontSize: 13 }}>No pending requests.</div>
            ) : (
              pending.map((u) => (
                <div className="req-row" key={u.id}>
                  <Avatar user={u as any} />
                  <div className="req-info"><b>{u.name}</b><span>{u.email}</span></div>
                  <div className="req-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => act(u.id, "approve")}>
                      <Check size={14} strokeWidth={2.4} /> Approve
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => act(u.id, "decline")}>
                      <X size={14} strokeWidth={2.4} /> Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="section-head" style={{ marginTop: 28 }}>
            <span className="section-title">Members</span>
          </div>
          <div className="panel" style={{ padding: "6px 20px" }}>
            {others.map((u) => (
              <div className="req-row" key={u.id}>
                <Avatar user={u as any} />
                <div className="req-info"><b>{u.name}</b><span>{u.email}</span></div>
                <div className="req-actions">
                  {u.role === "admin" && <span className="badge-pill badge-admin">Admin</span>}
                  <span className={`badge-pill badge-${u.status}`}>{cap(u.status ?? "active")}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isAdmin && (
        <div className="section-head" style={{ marginTop: 28 }}>
          <span className="section-title">Team</span>
        </div>
      )}
      {!isAdmin && (
        <div className="panel" style={{ padding: "14px 20px" }}>
          <div className="avatars">{useStore.getState().users.map((u) => <Avatar user={u} key={u.id} />)}</div>
        </div>
      )}
    </div>
  );
}
