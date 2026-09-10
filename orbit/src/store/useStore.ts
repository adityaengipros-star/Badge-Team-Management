import { create } from "zustand";
import type {
  ActivityEntry,
  Comment,
  Connector,
  Filters,
  NewTaskInput,
  Project,
  StatusId,
  Task,
  TaskView,
  Toast,
  User,
} from "@/types";
import { api, setUnauthorizedHandler, type Stats, type TaskQuery } from "@/lib/api";
import { statusById } from "@/data/constants";

type Theme = "light" | "dark";

const emptyFilters: Filters = {
  q: "",
  projectId: "",
  assigneeId: "",
  status: "",
  priority: "",
  type: "",
};

const FALLBACK_USER: User = { id: "?", name: "Unknown", init: "?", color: "#8a909c", presence: "offline" };
const FALLBACK_PROJECT: Project = { id: "?", name: "Unknown", prefix: "?", desc: "", color: "#8a909c", status: "active", progress: 0, members: [] };

interface Store {
  // auth
  currentUser: User | null;
  authChecked: boolean;
  authError: string | null;
  loggingIn: boolean;

  // shared data
  users: User[];
  projects: Project[];
  connectors: Connector[];
  currentUserId: string;
  bootstrapped: boolean;

  // tasks working set (Tasks page + Project workspace)
  tasks: Task[];
  tasksTotal: number;
  tasksLoading: boolean;
  tasksError: string | null;
  tasksHasMore: boolean;
  lastQuery: TaskQuery;

  // dashboard
  stats: Stats | null;
  myTasks: Task[];
  upcoming: Task[];
  activity: ActivityEntry[];
  dashboardLoading: boolean;

  // detail
  selectedTask: Task | null;
  comments: Comment[];
  commentsLoading: boolean;

  // ui state
  theme: Theme;
  sidebarCollapsed: boolean;
  taskView: TaskView;
  filters: Filters;
  newTaskOpen: boolean;
  paletteOpen: boolean;
  toasts: Toast[];

  // auth actions
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // loaders
  bootstrap: () => Promise<void>;  refreshProjects: () => Promise<void>;
  loadTasks: (query: TaskQuery, opts?: { append?: boolean }) => Promise<void>;
  loadMore: () => Promise<void>;
  loadDashboard: () => Promise<void>;
  loadActivity: (limit?: number) => Promise<void>;
  selectTask: (id: string | null) => Promise<void>;
  loadComments: (taskId: string) => Promise<void>;
  postComment: (taskId: string, text: string) => Promise<void>;

  // mutations
  addTask: (input: NewTaskInput) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  setTaskStatus: (id: string, status: StatusId) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // ui actions
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setTaskView: (v: TaskView) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  clearFilters: () => void;
  openNewTask: () => void;
  closeNewTask: () => void;
  setPalette: (open: boolean) => void;
  pushToast: (message: string) => void;
  dismissToast: (id: string) => void;
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
}

let toastCounter = 0;
let bootstrapPromise: Promise<void> | null = null;

export const useStore = create<Store>((set, get) => ({
  currentUser: null,
  authChecked: false,
  authError: null,
  loggingIn: false,

  users: [],
  projects: [],
  connectors: [],
  currentUserId: "u1",
  bootstrapped: false,

  tasks: [],
  tasksTotal: 0,
  tasksLoading: false,
  tasksError: null,
  tasksHasMore: false,
  lastQuery: {},

  stats: null,
  myTasks: [],
  upcoming: [],
  activity: [],
  dashboardLoading: false,

  selectedTask: null,
  comments: [],
  commentsLoading: false,

  theme: "dark",
  sidebarCollapsed: false,
  taskView: "tile",
  filters: emptyFilters,
  newTaskOpen: false,
  paletteOpen: false,
  toasts: [],

  // ---- auth ----
  checkAuth: async () => {
    try {
      const user = await api.me();
      set({ currentUser: user, currentUserId: user.id, authChecked: true });
    } catch {
      set({ currentUser: null, authChecked: true });
    }
  },

  login: async (email, password) => {
    set({ loggingIn: true, authError: null });
    try {
      const user = await api.login(email, password);
      set({ currentUser: user, currentUserId: user.id, loggingIn: false });
      return true;
    } catch (e) {
      set({ loggingIn: false, authError: (e as Error).message });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    // Reset to a clean, logged-out state so nothing leaks between users.
    set({
      currentUser: null,
      bootstrapped: false,
      tasks: [],
      myTasks: [],
      upcoming: [],
      activity: [],
      stats: null,
      selectedTask: null,
      filters: emptyFilters,
    });
  },

  // ---- loaders ----
  bootstrap: async () => {
    if (get().bootstrapped) return;
    if (bootstrapPromise) return bootstrapPromise; // dedupe (StrictMode)
    bootstrapPromise = (async () => {
      try {
        const [data, connectors, stats] = await Promise.all([api.bootstrap(), api.listConnectors(), api.stats()]);
        set({
          users: data.users,
          projects: data.projects,
          currentUserId: data.currentUserId,
          connectors,
          stats,
          bootstrapped: true,
        });
      } catch (e) {
        get().pushToast(`Couldn't reach the server — is it running on :3000?`);
        throw e;
      } finally {
        bootstrapPromise = null;
      }
    })();
    return bootstrapPromise;
  },

  refreshProjects: async () => {
    try {
      const data = await api.bootstrap();
      set({ projects: data.projects });
    } catch {
      /* non-fatal */
    }
  },

  loadTasks: async (query, opts) => {
    const append = opts?.append ?? false;
    set({ tasksLoading: true, tasksError: null, lastQuery: query });
    try {
      const res = await api.listTasks(query);
      set((s) => ({
        tasks: append ? [...s.tasks, ...res.items] : res.items,
        tasksTotal: res.total,
        tasksHasMore: res.hasMore,
        tasksLoading: false,
      }));
    } catch (e) {
      set({ tasksLoading: false, tasksError: (e as Error).message });
    }
  },

  loadMore: async () => {
    const { lastQuery, tasksHasMore, tasksLoading } = get();
    if (!tasksHasMore || tasksLoading) return;
    const nextPage = (lastQuery.page ?? 1) + 1;
    await get().loadTasks({ ...lastQuery, page: nextPage }, { append: true });
  },

  loadDashboard: async () => {
    set({ dashboardLoading: true });
    try {
      const [stats, mine, upcoming, activity] = await Promise.all([
        api.stats(),
        api.listTasks({ scope: "mine", pageSize: 6 }),
        api.listTasks({ pageSize: 4 }),
        api.listActivity(6),
      ]);
      set({
        stats,
        myTasks: mine.items,
        upcoming: upcoming.items,
        activity,
        dashboardLoading: false,
      });
    } catch {
      set({ dashboardLoading: false });
    }
  },

  loadActivity: async (limit = 30) => {
    try {
      set({ activity: await api.listActivity(limit) });
    } catch {
      /* ignore */
    }
  },

  selectTask: async (id) => {
    if (!id) {
      set({ selectedTask: null });
      return;
    }
    const local =
      get().tasks.find((t) => t.id === id) ||
      get().myTasks.find((t) => t.id === id) ||
      get().upcoming.find((t) => t.id === id);
    if (local) {
      set({ selectedTask: local });
      return;
    }
    try {
      set({ selectedTask: await api.getTask(id) });
    } catch {
      get().pushToast("Couldn't load that task");
    }
  },

  loadComments: async (taskId) => {
    set({ commentsLoading: true, comments: [] });
    try {
      const comments = await api.listComments(taskId);
      set({ comments, commentsLoading: false });
    } catch {
      set({ commentsLoading: false });
    }
  },

  postComment: async (taskId, text) => {
    const body = text.trim();
    if (!body) return;
    try {
      const comment = await api.addComment(taskId, body);
      set((s) => ({ comments: [...s.comments, comment] }));
      void get().loadActivity(6); // keep the feed fresh
    } catch (e) {
      get().pushToast((e as Error).message);
    }
  },

  // ---- mutations (optimistic where safe) ----
  addTask: async (input) => {
    try {
      const created = await api.createTask(input);
      get().pushToast(`Task ${created.id} created`);
      // Refresh the views that could show it.
      await Promise.all([
        get().loadTasks(get().lastQuery),
        get().refreshProjects(),
        get().loadDashboard(),
      ]);
    } catch (e) {
      get().pushToast((e as Error).message);
    }
  },

  updateTask: async (id, patch) => {
    // optimistic
    const prev = patchTaskEverywhere(set, get, id, patch);
    try {
      const server = await api.updateTask(id, patch);
      patchTaskEverywhere(set, get, id, server);
      void refreshDerived(get);
    } catch (e) {
      if (prev) patchTaskEverywhere(set, get, id, prev);
      get().pushToast((e as Error).message);
    }
  },

  setTaskStatus: async (id, status) => {
    await get().updateTask(id, { status });
    get().pushToast(`${id} moved to ${statusById(status).label}`);
  },

  deleteTask: async (id) => {
    const snapshot = get().tasks;
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      myTasks: s.myTasks.filter((t) => t.id !== id),
      upcoming: s.upcoming.filter((t) => t.id !== id),
      selectedTask: s.selectedTask?.id === id ? null : s.selectedTask,
      tasksTotal: Math.max(0, s.tasksTotal - 1),
    }));
    try {
      await api.deleteTask(id);
      get().pushToast(`${id} deleted`);
      void refreshDerived(get);
    } catch (e) {
      set({ tasks: snapshot });
      get().pushToast((e as Error).message);
    }
  },

  // ---- ui actions ----
  setTheme: (t) => { applyTheme(t); set({ theme: t }); },
  toggleTheme: () => { const t = get().theme === "dark" ? "light" : "dark"; applyTheme(t); set({ theme: t }); },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setTaskView: (v) => set({ taskView: v }),
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  clearFilters: () => set({ filters: emptyFilters }),
  openNewTask: () => set({ newTaskOpen: true }),
  closeNewTask: () => set({ newTaskOpen: false }),
  setPalette: (open) => set({ paletteOpen: open }),
  pushToast: (message) => {
    const id = `t${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => get().dismissToast(id), 2800);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Apply a patch to a task across every list it might appear in.
// Returns the previous values of the patched keys (for rollback).
function patchTaskEverywhere(
  set: (fn: (s: Store) => Partial<Store>) => void,
  get: () => Store,
  id: string,
  patch: Partial<Task>
): Partial<Task> | null {
  const current =
    get().tasks.find((t) => t.id === id) ||
    get().myTasks.find((t) => t.id === id) ||
    get().upcoming.find((t) => t.id === id) ||
    (get().selectedTask?.id === id ? get().selectedTask : null);
  if (!current) return null;
  const prev: Partial<Task> = {};
  for (const k of Object.keys(patch) as (keyof Task)[]) {
    (prev as Record<string, unknown>)[k] = current[k];
  }
  const apply = (t: Task) => (t.id === id ? { ...t, ...patch } : t);
  set((s) => ({
    tasks: s.tasks.map(apply),
    myTasks: s.myTasks.map(apply),
    upcoming: s.upcoming.map(apply),
    selectedTask: s.selectedTask?.id === id ? { ...s.selectedTask, ...patch } : s.selectedTask,
  }));
  return prev;
}

// Light background refresh of counts + activity after a mutation.
async function refreshDerived(get: () => Store) {
  try {
    const [stats, activity] = await Promise.all([api.stats(), api.listActivity(6)]);
    useStore.setState({ stats, activity });
  } catch {
    /* ignore */
  }
  void get; // keep signature stable
}

// ---- selectors / helpers (read from store, non-reactive) ----
export const userById = (id: string) => useStore.getState().users.find((u) => u.id === id) ?? FALLBACK_USER;
export const projectById = (id: string) => useStore.getState().projects.find((p) => p.id === id) ?? FALLBACK_PROJECT;

// A 401 from any data endpoint means the session expired — drop to login.
setUnauthorizedHandler(() => {
  if (useStore.getState().currentUser) {
    useStore.setState({ currentUser: null });
    useStore.getState().pushToast("Your session expired — please sign in again.");
  }
});
