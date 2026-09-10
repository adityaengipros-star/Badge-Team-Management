import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  ListChecks,
  List,
  FolderKanban,
  MessageSquare,
  Activity,
  Plug,
  Settings,
  ChevronsUpDown,
  MoreVertical,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { CHANNELS } from "@/data/mock";
import { useStore } from "@/store/useStore";
import { Avatar } from "@/components/ui/Avatar";

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
  badge?: number;
  end?: boolean;
}

export function Sidebar({ mobileOpen, onNavigate }: { mobileOpen: boolean; onNavigate: () => void }) {
  const stats = useStore((s) => s.stats);
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const me = currentUser ?? { id: "u1", name: "You", init: "Y", color: "#5b63d3", presence: "online" as const, email: "" };
  const [menuOpen, setMenuOpen] = useState(false);

  const myOpen = stats?.myOpen ?? 0;
  const total = stats?.total ?? 0;
  const unread = CHANNELS.reduce((n, c) => n + (c.unread ?? 0), 0);

  const groups: { group: string; items: NavItem[] }[] = [
    {
      group: "Main",
      items: [
        { to: "/", label: "Dashboard", Icon: LayoutDashboard, end: true },
        { to: "/my-tasks", label: "My Tasks", Icon: ListChecks, badge: myOpen },
        { to: "/tasks", label: "All Tasks", Icon: List, badge: total },
        { to: "/projects", label: "Projects", Icon: FolderKanban },
      ],
    },
    {
      group: "Collaboration",
      items: [
        { to: "/chats", label: "Chats", Icon: MessageSquare, badge: unread },
        { to: "/activity", label: "Activity", Icon: Activity },
      ],
    },
    { group: "Integrations", items: [{ to: "/connectors", label: "Connectors", Icon: Plug }] },
    { group: "System", items: [{ to: "/settings", label: "Settings", Icon: Settings }] },
  ];

  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="brand">
        <div className="brand-logo">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">Orbit</span>
          <span className="brand-sub">Hardware Team</span>
        </div>
        <button className="brand-switch" title="Switch workspace">
          <ChevronsUpDown size={15} strokeWidth={2} />
        </button>
      </div>

      <nav className="nav">
        {groups.map((g) => (
          <div key={g.group}>
            <div className="nav-group">{g.group}</div>
            {g.items.map(({ to, label, Icon, badge, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} onClick={onNavigate}>
                <Icon size={18} strokeWidth={1.9} />
                <span>{label}</span>
                {badge ? <span className="badge">{badge}</span> : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot" style={{ position: "relative" }}>
        {menuOpen && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 84 }} onClick={() => setMenuOpen(false)} />
            <div className="menu open" style={{ position: "absolute", left: 10, right: 10, bottom: 64, zIndex: 85 }}>
              <div style={{ padding: "6px 10px 8px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{me.name}</div>
                {me.email && <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{me.email}</div>}
              </div>
              <button className="menu-item" onClick={() => { setMenuOpen(false); void logout(); }}>
                <LogOut size={15} strokeWidth={2} /> Log out
              </button>
            </div>
          </>
        )}
        <button className="user-chip" onClick={() => setMenuOpen((o) => !o)}>
          <Avatar user={me} showPresence />
          <div className="user-meta">
            <b>{me.name}</b>
            <span>Online</span>
          </div>
          <MoreVertical className="more" size={15} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
