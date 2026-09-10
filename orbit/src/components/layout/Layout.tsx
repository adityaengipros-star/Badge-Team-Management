import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";
import { CommandPalette } from "@/components/palette/CommandPalette";
import { Toasts } from "@/components/ui/Toasts";

export function Layout() {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const setPalette = useStore((s) => s.setPalette);
  const bootstrap = useStore((s) => s.bootstrap);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load users, projects, connectors and stats once, on first mount.
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Global Cmd/Ctrl+K to toggle the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(!useStore.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPalette]);

  const onToggleSidebar = () => {
    if (window.innerWidth <= 900) setMobileOpen((o) => !o);
    else toggleSidebar();
  };

  return (
    <>
      <div className={`app ${collapsed ? "collapsed" : ""}`}>
        <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
        <Header onToggleSidebar={onToggleSidebar} onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="main">
          <Outlet />
        </main>
      </div>

      <div className={`mobile-overlay ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} />

      {/* global overlays */}
      <TaskDrawer />
      <NewTaskModal />
      <CommandPalette />
      <Toasts />
    </>
  );
}
