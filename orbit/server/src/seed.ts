import { db } from "./db";
import { migrate } from "./migrate";
import { nowISO } from "./types";
import { hashPassword } from "./auth";

// Everyone is seeded with this password — change it after first login
// (or use `npm run set-password -- <email> <newpass>`).
const DEFAULT_PASSWORD = "changeme123";

const USERS = [
  { id: "u1", name: "Aditya Rao", init: "A", color: "#5b63d3", presence: "online" },
  { id: "u2", name: "Rahul Menon", init: "R", color: "#2f9e5f", presence: "online" },
  { id: "u3", name: "Priya Nair", init: "P", color: "#d64545", presence: "away" },
  { id: "u4", name: "Karan Shah", init: "K", color: "#c8880e", presence: "offline" },
  { id: "u5", name: "Sneha Iyer", init: "S", color: "#8b5cf6", presence: "online" },
  { id: "u6", name: "Meera Das", init: "M", color: "#0ea5a4", presence: "away" },
];

const PROJECTS = [
  { id: "p1", name: "Badge Firmware", prefix: "BADGE", description: "ESP32-C6 / STM32 / Zephyr", color: "#5b63d3", status: "active", members: ["u1", "u2", "u4"] },
  { id: "p2", name: "Web Dashboard", prefix: "WEB", description: "Internal ops & telemetry UI", color: "#2f9e5f", status: "active", members: ["u1", "u5", "u3"] },
  { id: "p3", name: "Engineering Platform", prefix: "ENG", description: "CI, tooling & build infra", color: "#c8880e", status: "active", members: ["u1", "u2", "u6", "u4"] },
  { id: "p4", name: "Mobile Companion", prefix: "MOB", description: "React Native provisioning app", color: "#8b5cf6", status: "planning", members: ["u5", "u3"] },
  { id: "p5", name: "Hardware Bring-up", prefix: "HW", description: "Rev C board validation", color: "#0ea5a4", status: "paused", members: ["u4", "u6"] },
];

type TaskSeed = {
  pid: string; title: string; description: string; assignee: string;
  status: string; priority: string; type: string; due: string;
  labels: string[]; overdue?: boolean;
};

const TASKS: TaskSeed[] = [
  { pid: "p1", title: "Fix ESP32-C6 deep sleep wake-up issue", description: "Device fails to wake from deep sleep when RTC GPIO is used as the trigger source. Suspect a clock domain race.", assignee: "u1", status: "progress", priority: "high", type: "Bug", due: "Sep 14", labels: ["Firmware", "Power"] },
  { pid: "p1", title: "Implement BLE OTA update flow", description: "Chunked firmware transfer over BLE with resume + CRC validation.", assignee: "u2", status: "todo", priority: "high", type: "Feature", due: "Sep 18", labels: ["Firmware", "BLE"] },
  { pid: "p1", title: "Reduce boot time under 400ms", description: "Profiled boot is currently 720ms; investigate flash init and Zephyr subsys.", assignee: "u4", status: "review", priority: "medium", type: "Enhancement", due: "Sep 12", labels: ["Performance"] },
  { pid: "p1", title: "USB Host printer integration", description: "Add USB host stack support for thermal badge printer.", assignee: "u1", status: "backlog", priority: "low", type: "Development", due: "Sep 25", labels: ["Firmware", "USB"] },
  { pid: "p1", title: "Battery gauge calibration drift", description: "Fuel gauge reports 8% high after 40 cycles.", assignee: "u4", status: "blocked", priority: "urgent", type: "Bug", due: "Sep 11", labels: ["Power", "Hardware"], overdue: true },

  { pid: "p2", title: "Debounce global search input", description: "Search fires a request per keystroke; add 250ms debounce + cancel in-flight.", assignee: "u5", status: "done", priority: "medium", type: "Enhancement", due: "Sep 8", labels: ["Frontend"] },
  { pid: "p2", title: "Virtualize task list for 1000+ rows", description: "List view drops frames past ~300 tasks. Add windowing.", assignee: "u5", status: "progress", priority: "high", type: "Enhancement", due: "Sep 15", labels: ["Frontend", "Performance"] },
  { pid: "p2", title: "Dark mode token audit", description: "Several components still use hard-coded greys instead of tokens.", assignee: "u3", status: "todo", priority: "low", type: "Maintenance", due: "Sep 20", labels: ["Design", "Frontend"] },
  { pid: "p2", title: "Server-side pagination for /api/tasks", description: "Return 25 per page with cursor; cut payload from 480KB to ~24KB.", assignee: "u1", status: "progress", priority: "high", type: "Development", due: "Sep 13", labels: ["Backend", "API"] },
  { pid: "p2", title: "Skeleton loaders for dashboard cards", description: "Replace spinner with skeletons to reduce perceived load.", assignee: "u5", status: "review", priority: "medium", type: "Enhancement", due: "Sep 10", labels: ["Frontend", "UX"] },

  { pid: "p3", title: "Cache task queries with 30s TTL", description: "Add a lightweight in-memory cache layer to cut DB reads.", assignee: "u2", status: "todo", priority: "medium", type: "Development", due: "Sep 16", labels: ["Backend", "Performance"] },
  { pid: "p3", title: "Add DB indexes on searchable fields", description: "Index status, assignee_id, project_id, due_date.", assignee: "u2", status: "progress", priority: "high", type: "Maintenance", due: "Sep 12", labels: ["Backend", "Database"] },
  { pid: "p3", title: "Split frontend bundle by route", description: "Lazy-load Board and Chat; target <150KB initial JS.", assignee: "u1", status: "backlog", priority: "medium", type: "Enhancement", due: "Sep 22", labels: ["Frontend", "Performance"] },
  { pid: "p3", title: "Investigate 2GB EC2 memory ceiling", description: "Node process peaks at 1.6GB under load test.", assignee: "u6", status: "todo", priority: "urgent", type: "Research", due: "Sep 11", labels: ["Infra"], overdue: true },
  { pid: "p3", title: "Compress API responses (gzip)", description: "Enable gzip/br on the API gateway.", assignee: "u4", status: "done", priority: "low", type: "Maintenance", due: "Sep 6", labels: ["Infra", "API"] },
  { pid: "p3", title: "Write API pagination docs", description: "Document cursor params for /api/tasks and /api/activity.", assignee: "u6", status: "todo", priority: "low", type: "Documentation", due: "Sep 24", labels: ["Docs"] },

  { pid: "p4", title: "Design provisioning onboarding flow", description: "3-step BLE pairing wizard for first-time setup.", assignee: "u3", status: "backlog", priority: "medium", type: "Feature", due: "Sep 28", labels: ["Mobile", "UX"] },
  { pid: "p4", title: "Evaluate RN vs Expo for OTA", description: "Compare update pipelines and bundle size.", assignee: "u5", status: "todo", priority: "low", type: "Research", due: "Oct 2", labels: ["Mobile"] },
  { pid: "p4", title: "Set up CI for mobile builds", description: "Fastlane + signing for TestFlight.", assignee: "u3", status: "todo", priority: "medium", type: "Documentation", due: "Sep 30", labels: ["Mobile", "Infra"] },

  { pid: "p5", title: "Rev C thermal validation", description: "Run thermal soak at 60°C for 12h.", assignee: "u4", status: "review", priority: "high", type: "Testing", due: "Sep 13", labels: ["Hardware", "Testing"] },
  { pid: "p5", title: "Antenna return loss measurement", description: "Sweep 2.4GHz band, target <-10dB.", assignee: "u6", status: "done", priority: "medium", type: "Testing", due: "Sep 5", labels: ["Hardware", "RF"] },
  { pid: "p5", title: "Update BOM for Rev C", description: "Swap deprecated LDO, refresh costings.", assignee: "u4", status: "todo", priority: "low", type: "Documentation", due: "Sep 21", labels: ["Hardware", "Docs"] },
];

const ACTIVITY = [
  { userId: "u1", action: "moved", target: "ESP32 deep sleep investigation", from: "In Progress", to: "Review", minutesAgo: 2 },
  { userId: "u2", action: "created", target: "USB Host printer integration", minutesAgo: 18 },
  { userId: "u5", action: "completed", target: "Debounce global search input", minutesAgo: 60 },
  { userId: "u3", action: "commented on", target: "Dark mode token audit", minutesAgo: 120 },
  { userId: "u6", action: "assigned", target: "Investigate 2GB EC2 memory ceiling", extra: "to herself", minutesAgo: 180 },
  { userId: "u4", action: "flagged", target: "Battery gauge calibration drift", extra: "as blocked", minutesAgo: 240 },
  { userId: "u2", action: "merged PR #218 into", target: "Add DB indexes on searchable fields", minutesAgo: 300 },
  { userId: "u1", action: "changed priority of", target: "Server-side pagination", extra: "to High", minutesAgo: 1440 },
];

export function seed() {
  migrate();

  const count = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  if (count > 0) {
    console.log("• database already seeded, skipping");
    return;
  }

  const insUser = db.prepare("INSERT INTO users (id,name,init,color,presence,email,password_hash) VALUES (?,?,?,?,?,?,?)");
  const insProject = db.prepare("INSERT INTO projects (id,name,prefix,description,color,status,seq,created_at) VALUES (?,?,?,?,?,?,?,?)");
  const insMember = db.prepare("INSERT INTO project_members (project_id,user_id) VALUES (?,?)");
  const insTask = db.prepare("INSERT INTO tasks (id,project_id,title,description,assignee_id,status,priority,type,due,overdue,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
  const insLabel = db.prepare("INSERT INTO task_labels (task_id,label) VALUES (?,?)");
  const insActivity = db.prepare("INSERT INTO activity (id,user_id,action,target,extra,from_status,to_status,created_at) VALUES (?,?,?,?,?,?,?,?)");
  const insComment = db.prepare("INSERT INTO comments (id,task_id,user_id,body,created_at) VALUES (?,?,?,?,?)");

  const now = nowISO();

  const run = db.transaction(() => {
    for (const u of USERS) {
      const email = `${u.name.split(" ")[0].toLowerCase()}@orbit.dev`;
      insUser.run(u.id, u.name, u.init, u.color, u.presence, email, hashPassword(DEFAULT_PASSWORD));
    }

    // per-project counter
    const seq: Record<string, number> = {};
    for (const p of PROJECTS) {
      const n = TASKS.filter((t) => t.pid === p.id).length;
      seq[p.id] = 100 + n; // next id will be seq+1
      insProject.run(p.id, p.name, p.prefix, p.description, p.color, p.status, seq[p.id], now);
      for (const m of p.members) insMember.run(p.id, m);
    }

    const counter: Record<string, number> = {};
    for (const t of TASKS) {
      const prefix = PROJECTS.find((p) => p.id === t.pid)!.prefix;
      counter[prefix] = (counter[prefix] ?? 100) + 1;
      const id = `${prefix}-${counter[prefix]}`;
      insTask.run(id, t.pid, t.title, t.description, t.assignee, t.status, t.priority, t.type, t.due, t.overdue ? 1 : 0, now, now);
      for (const l of t.labels) insLabel.run(id, l);
    }

    let ai = 0;
    for (const a of ACTIVITY) {
      const created = new Date(Date.now() - a.minutesAgo * 60_000).toISOString();
      insActivity.run(`a${++ai}`, a.userId, a.action, a.target, a.extra ?? null, a.from ?? null, a.to ?? null, created);
    }

    // A couple of seed comments on the first task (BADGE-101).
    insComment.run("cm1", "BADGE-101", "u2", "I can pair on this if the clock domain theory pans out — I have a logic analyzer set up.", new Date(Date.now() - 2 * 86400_000).toISOString());
    insComment.run("cm2", "BADGE-101", "u1", "Thanks — will ping you once I've isolated the wake source.", new Date(Date.now() - 1 * 86400_000).toISOString());
  });

  run();
  console.log(`✓ seeded ${USERS.length} users, ${PROJECTS.length} projects, ${TASKS.length} tasks`);
  console.log(`  login: aditya@orbit.dev  ·  password: ${DEFAULT_PASSWORD}  (change this!)`);
}

if (require.main === module) {
  seed();
}
