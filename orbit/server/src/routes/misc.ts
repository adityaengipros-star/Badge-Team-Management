import { FastifyInstance } from "fastify";
import { db } from "../db";
import { activityDTOs, projectDTOs } from "../repo";

// Parse a "MMM D" display string into a Date near today (best-effort).
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
function parseDue(due: string): Date | null {
  const m = /^([A-Za-z]{3})\s+(\d{1,2})$/.exec(due.trim());
  if (!m) return null;
  const month = MONTHS.indexOf(m[1].toLowerCase());
  if (month < 0) return null;
  const now = new Date();
  let d = new Date(now.getFullYear(), month, parseInt(m[2], 10));
  // handle year wrap (e.g. "Jan 3" seen in December)
  if (d.getTime() - now.getTime() < -180 * 86400_000) d = new Date(now.getFullYear() + 1, month, parseInt(m[2], 10));
  return d;
}

export async function miscRoutes(app: FastifyInstance) {
  app.get("/api/health", () => ({ ok: true, time: new Date().toISOString() }));

  // One call to hydrate the app shell.
  app.get("/api/bootstrap", (req) => ({
    users: db.prepare("SELECT id,name,init,color,presence FROM users").all(),
    projects: projectDTOs(),
    currentUserId: req.user!.id,
  }));

  app.get("/api/stats", (req) => {
    const total = (db.prepare("SELECT COUNT(*) AS n FROM tasks").get() as { n: number }).n;
    const inProgress = (db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE status='progress'").get() as { n: number }).n;
    const completed = (db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE status='done'").get() as { n: number }).n;
    const myOpen = (db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE assignee_id=? AND status!='done'").get(req.user!.id) as { n: number }).n;

    // Due soon = open tasks whose due date is within the next 7 days.
    const open = db.prepare("SELECT due FROM tasks WHERE status NOT IN ('done')").all() as { due: string }[];
    const soon = Date.now() + 7 * 86400_000;
    const dueSoon = open.filter((t) => {
      const d = parseDue(t.due);
      return d && d.getTime() >= Date.now() - 86400_000 && d.getTime() <= soon;
    }).length;

    return { total, inProgress, dueSoon, completed, myOpen };
  });

  app.get("/api/activity", (req) => {
    const q = req.query as { limit?: string };
    return activityDTOs(Math.min(100, parseInt(q.limit ?? "30", 10) || 30));
  });

  // Connectors are static placeholders in Phase 2 (framework lands in Phase 4).
  app.get("/api/connectors", () => [
    { name: "GitHub", status: "on", color: "#e9eaee", desc: "Connect repositories and associate pull requests with tasks." },
    { name: "Slack", status: "on", color: "#4A154B", desc: "Post task updates and status changes to team channels." },
    { name: "GitLab", status: "off", color: "#FC6D26", desc: "Sync merge requests and pipelines with your tasks." },
    { name: "Google Drive", status: "off", color: "#4285F4", desc: "Attach docs and specs from Drive directly to tasks." },
    { name: "Discord", status: "off", color: "#5865F2", desc: "Mirror activity to a Discord server for the community." },
    { name: "Jira", status: "off", color: "#2684FF", desc: "Import issues from Jira and keep statuses in sync." },
  ]);
}
