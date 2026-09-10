import { Suspense, lazy, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { TaskQuery } from "@/lib/api";
import { TaskToolbar } from "@/components/tasks/TaskToolbar";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskList } from "@/components/tasks/TaskList";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCards } from "@/components/ui/Skeleton";

// Board view is only loaded when the user switches to it.
const TaskBoard = lazy(() => import("@/components/tasks/TaskBoard"));

export function Tasks({ scope }: { scope: "all" | "mine" }) {
  const tasks = useStore((s) => s.tasks);
  const total = useStore((s) => s.tasksTotal);
  const loading = useStore((s) => s.tasksLoading);
  const hasMore = useStore((s) => s.tasksHasMore);
  const filters = useStore((s) => s.filters);
  const taskView = useStore((s) => s.taskView);
  const projects = useStore((s) => s.projects);
  const openNewTask = useStore((s) => s.openNewTask);
  const loadTasks = useStore((s) => s.loadTasks);
  const loadMore = useStore((s) => s.loadMore);

  // Board needs the whole matching set to group columns; grid/list paginate.
  const pageSize = taskView === "board" ? 200 : 50;

  const query = useMemo<TaskQuery>(
    () => ({
      scope,
      q: filters.q || undefined,
      projectId: filters.projectId || undefined,
      assigneeId: filters.assigneeId || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      type: filters.type || undefined,
      page: 1,
      pageSize,
    }),
    [scope, filters, pageSize]
  );

  useEffect(() => {
    loadTasks(query);
  }, [query, loadTasks]);

  const title = scope === "mine" ? "My Tasks" : "All Tasks";
  const sub =
    scope === "mine"
      ? "Tasks assigned to you across all projects."
      : `${total} task${total === 1 ? "" : "s"} across ${projects.length} projects.`;

  const firstLoad = loading && tasks.length === 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">{title}</div>
          <div className="page-sub">{sub}</div>
        </div>
        <button className="btn btn-primary" onClick={openNewTask}>
          <Plus size={15} strokeWidth={2.4} /> New Task
        </button>
      </div>

      <TaskToolbar />

      {firstLoad ? (
        <SkeletonCards />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          body="Try clearing filters, or create a new task to get started."
          action={{ label: "New Task", onClick: openNewTask }}
        />
      ) : (
        <>
          {taskView === "tile" && (
            <div className="task-grid">
              {tasks.map((t) => <TaskCard task={t} key={t.id} />)}
            </div>
          )}
          {taskView === "list" && <TaskList tasks={tasks} />}
          {taskView === "board" && (
            <Suspense fallback={<SkeletonCards />}>
              <TaskBoard tasks={tasks} />
            </Suspense>
          )}

          {taskView !== "board" && hasMore && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={loadMore} disabled={loading}>
                {loading ? "Loading…" : `Load more (${tasks.length} of ${total})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
