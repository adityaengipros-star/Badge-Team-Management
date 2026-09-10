import { Menu, PanelLeft, Search, Sun, Moon, Bell, Plus } from "lucide-react";
import { useStore } from "@/store/useStore";

export function Header({
  onToggleSidebar,
  onOpenMobileNav,
}: {
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
}) {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const openNewTask = useStore((s) => s.openNewTask);
  const setPalette = useStore((s) => s.setPalette);

  return (
    <header className="header">
      <button className="icon-btn mobile-menu" title="Menu" onClick={onOpenMobileNav}>
        <Menu size={18} strokeWidth={2} />
      </button>
      <button className="icon-btn" title="Collapse sidebar" onClick={onToggleSidebar}>
        <PanelLeft size={18} strokeWidth={2} />
      </button>

      <button className="search-trigger" onClick={() => setPalette(true)}>
        <Search size={15} strokeWidth={2} />
        <span>Search tasks, projects, people…</span>
        <span className="kbd">⌘K</span>
      </button>

      <div className="header-right">
        <button className="icon-btn" title="Toggle theme" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
        </button>
        <button className="icon-btn" title="Notifications">
          <Bell size={17} strokeWidth={2} />
        </button>
        <button className="btn btn-primary" onClick={openNewTask}>
          <Plus size={15} strokeWidth={2.4} />
          <span className="btn-label">New Task</span>
        </button>
      </div>
    </header>
  );
}
