import type {
  ActivityEntry,
  Channel,
  Comment,
  Connector,
  DirectMessage,
  Message,
  Project,
  Task,
  User,
} from "@/types";

export const USERS: User[] = [
  { id: "u1", name: "Aditya Rao", init: "A", color: "#5b63d3", presence: "online" },
  { id: "u2", name: "Rahul Menon", init: "R", color: "#2f9e5f", presence: "online" },
  { id: "u3", name: "Priya Nair", init: "P", color: "#d64545", presence: "away" },
  { id: "u4", name: "Karan Shah", init: "K", color: "#c8880e", presence: "offline" },
  { id: "u5", name: "Sneha Iyer", init: "S", color: "#8b5cf6", presence: "online" },
  { id: "u6", name: "Meera Das", init: "M", color: "#0ea5a4", presence: "away" },
];

// The signed-in user for this prototype.
export const CURRENT_USER_ID = "u1";

export const PROJECTS: Project[] = [
  { id: "p1", name: "Badge Firmware", prefix: "BADGE", desc: "ESP32-C6 / STM32 / Zephyr", color: "#5b63d3", status: "active", progress: 72, members: ["u1", "u2", "u4"] },
  { id: "p2", name: "Web Dashboard", prefix: "WEB", desc: "Internal ops & telemetry UI", color: "#2f9e5f", status: "active", progress: 54, members: ["u1", "u5", "u3"] },
  { id: "p3", name: "Engineering Platform", prefix: "ENG", desc: "CI, tooling & build infra", color: "#c8880e", status: "active", progress: 38, members: ["u1", "u2", "u6", "u4"] },
  { id: "p4", name: "Mobile Companion", prefix: "MOB", desc: "React Native provisioning app", color: "#8b5cf6", status: "planning", progress: 12, members: ["u5", "u3"] },
  { id: "p5", name: "Hardware Bring-up", prefix: "HW", desc: "Rev C board validation", color: "#0ea5a4", status: "paused", progress: 88, members: ["u4", "u6"] },
];

// Per-project sequential counter -> BADGE-1, BADGE-2, WEB-1, ...
const seq: Record<string, number> = {};
type Seed = Omit<Task, "id">;
function withIds(seeds: Seed[]): Task[] {
  return seeds.map((s) => {
    const prefix = PROJECTS.find((p) => p.id === s.projectId)!.prefix;
    seq[prefix] = (seq[prefix] ?? 100) + 1;
    return { ...s, id: `${prefix}-${seq[prefix]}` };
  });
}

export const TASKS: Task[] = withIds([
  { title: "Fix ESP32-C6 deep sleep wake-up issue", desc: "Device fails to wake from deep sleep when RTC GPIO is used as the trigger source. Suspect a clock domain race.", projectId: "p1", assigneeId: "u1", status: "progress", priority: "high", type: "Bug", due: "Sep 14", labels: ["Firmware", "Power"] },
  { title: "Implement BLE OTA update flow", desc: "Chunked firmware transfer over BLE with resume + CRC validation.", projectId: "p1", assigneeId: "u2", status: "todo", priority: "high", type: "Feature", due: "Sep 18", labels: ["Firmware", "BLE"] },
  { title: "Reduce boot time under 400ms", desc: "Profiled boot is currently 720ms; investigate flash init and Zephyr subsys.", projectId: "p1", assigneeId: "u4", status: "review", priority: "medium", type: "Enhancement", due: "Sep 12", labels: ["Performance"] },
  { title: "USB Host printer integration", desc: "Add USB host stack support for thermal badge printer.", projectId: "p1", assigneeId: "u1", status: "backlog", priority: "low", type: "Development", due: "Sep 25", labels: ["Firmware", "USB"] },
  { title: "Battery gauge calibration drift", desc: "Fuel gauge reports 8% high after 40 cycles.", projectId: "p1", assigneeId: "u4", status: "blocked", priority: "urgent", type: "Bug", due: "Sep 11", labels: ["Power", "Hardware"], overdue: true },

  { title: "Debounce global search input", desc: "Search fires a request per keystroke; add 250ms debounce + cancel in-flight.", projectId: "p2", assigneeId: "u5", status: "done", priority: "medium", type: "Enhancement", due: "Sep 8", labels: ["Frontend"] },
  { title: "Virtualize task list for 1000+ rows", desc: "List view drops frames past ~300 tasks. Add windowing.", projectId: "p2", assigneeId: "u5", status: "progress", priority: "high", type: "Enhancement", due: "Sep 15", labels: ["Frontend", "Performance"] },
  { title: "Dark mode token audit", desc: "Several components still use hard-coded greys instead of tokens.", projectId: "p2", assigneeId: "u3", status: "todo", priority: "low", type: "Maintenance", due: "Sep 20", labels: ["Design", "Frontend"] },
  { title: "Server-side pagination for /api/tasks", desc: "Return 25 per page with cursor; cut payload from 480KB to ~24KB.", projectId: "p2", assigneeId: "u1", status: "progress", priority: "high", type: "Development", due: "Sep 13", labels: ["Backend", "API"] },
  { title: "Skeleton loaders for dashboard cards", desc: "Replace spinner with skeletons to reduce perceived load.", projectId: "p2", assigneeId: "u5", status: "review", priority: "medium", type: "Enhancement", due: "Sep 10", labels: ["Frontend", "UX"] },

  { title: "Cache task queries with 30s TTL", desc: "Add a lightweight in-memory cache layer to cut DB reads.", projectId: "p3", assigneeId: "u2", status: "todo", priority: "medium", type: "Development", due: "Sep 16", labels: ["Backend", "Performance"] },
  { title: "Add DB indexes on searchable fields", desc: "Index status, assignee_id, project_id, due_date.", projectId: "p3", assigneeId: "u2", status: "progress", priority: "high", type: "Maintenance", due: "Sep 12", labels: ["Backend", "Database"] },
  { title: "Split frontend bundle by route", desc: "Lazy-load Board and Chat; target <150KB initial JS.", projectId: "p3", assigneeId: "u1", status: "backlog", priority: "medium", type: "Enhancement", due: "Sep 22", labels: ["Frontend", "Performance"] },
  { title: "Investigate 2GB EC2 memory ceiling", desc: "Node process peaks at 1.6GB under load test.", projectId: "p3", assigneeId: "u6", status: "todo", priority: "urgent", type: "Research", due: "Sep 11", labels: ["Infra"], overdue: true },
  { title: "Compress API responses (gzip)", desc: "Enable gzip/br on the API gateway.", projectId: "p3", assigneeId: "u4", status: "done", priority: "low", type: "Maintenance", due: "Sep 6", labels: ["Infra", "API"] },
  { title: "Write API pagination docs", desc: "Document cursor params for /api/tasks and /api/activity.", projectId: "p3", assigneeId: "u6", status: "todo", priority: "low", type: "Documentation", due: "Sep 24", labels: ["Docs"] },

  { title: "Design provisioning onboarding flow", desc: "3-step BLE pairing wizard for first-time setup.", projectId: "p4", assigneeId: "u3", status: "backlog", priority: "medium", type: "Feature", due: "Sep 28", labels: ["Mobile", "UX"] },
  { title: "Evaluate RN vs Expo for OTA", desc: "Compare update pipelines and bundle size.", projectId: "p4", assigneeId: "u5", status: "todo", priority: "low", type: "Research", due: "Oct 2", labels: ["Mobile"] },
  { title: "Set up CI for mobile builds", desc: "Fastlane + signing for TestFlight.", projectId: "p4", assigneeId: "u3", status: "todo", priority: "medium", type: "Documentation", due: "Sep 30", labels: ["Mobile", "Infra"] },

  { title: "Rev C thermal validation", desc: "Run thermal soak at 60°C for 12h.", projectId: "p5", assigneeId: "u4", status: "review", priority: "high", type: "Testing", due: "Sep 13", labels: ["Hardware", "Testing"] },
  { title: "Antenna return loss measurement", desc: "Sweep 2.4GHz band, target <-10dB.", projectId: "p5", assigneeId: "u6", status: "done", priority: "medium", type: "Testing", due: "Sep 5", labels: ["Hardware", "RF"] },
  { title: "Update BOM for Rev C", desc: "Swap deprecated LDO, refresh costings.", projectId: "p5", assigneeId: "u4", status: "todo", priority: "low", type: "Documentation", due: "Sep 21", labels: ["Hardware", "Docs"] },
]);

export const ACTIVITY: ActivityEntry[] = [
  { id: "a1", userId: "u1", action: "moved", target: "ESP32 deep sleep investigation", from: "In Progress", to: "Review", time: "2 minutes ago" },
  { id: "a2", userId: "u2", action: "created", target: "USB Host printer integration", time: "18 minutes ago" },
  { id: "a3", userId: "u5", action: "completed", target: "Debounce global search input", time: "1 hour ago" },
  { id: "a4", userId: "u3", action: "commented on", target: "Dark mode token audit", time: "2 hours ago" },
  { id: "a5", userId: "u6", action: "assigned", target: "Investigate 2GB EC2 memory ceiling", extra: "to herself", time: "3 hours ago" },
  { id: "a6", userId: "u4", action: "flagged", target: "Battery gauge calibration drift", extra: "as blocked", time: "4 hours ago" },
  { id: "a7", userId: "u2", action: "merged PR #218 into", target: "Add DB indexes on searchable fields", time: "5 hours ago" },
  { id: "a8", userId: "u1", action: "changed priority of", target: "Server-side pagination", extra: "to High", time: "yesterday" },
];

export const CHANNELS: Channel[] = [
  { id: "c1", name: "firmware", desc: "Badge firmware & Zephyr", unread: 3 },
  { id: "c2", name: "badge", desc: "Badge project coordination" },
  { id: "c3", name: "hardware", desc: "Board bring-up & RF", unread: 1 },
  { id: "c4", name: "general", desc: "Team-wide announcements" },
];

export const DMS: DirectMessage[] = [
  { id: "d1", userId: "u2" },
  { id: "d2", userId: "u5" },
  { id: "d3", userId: "u3" },
];

export const MESSAGES: Message[] = [
  { id: "m1", userId: "u2", time: "10:02", text: "Pushed the BLE OTA chunking branch — resume works but CRC fails on the last block sometimes." },
  { id: "m2", userId: "u1", time: "10:04", text: "Probably an off-by-one on the final chunk length. I hit that last month." },
  { id: "m3", userId: "u2", time: "10:05", text: "Ah that would explain it. Will check the boundary condition." },
  { id: "m4", userId: "u4", time: "10:31", text: "Heads up: battery gauge drift is back on Rev C too. Marking it blocked until we get new samples." },
  { id: "m5", userId: "u1", time: "10:33", text: "Thanks for flagging. Let's sync at standup." },
];

export const CONNECTORS: Connector[] = [
  { name: "GitHub", status: "on", color: "#e9eaee", desc: "Connect repositories and associate pull requests with tasks." },
  { name: "Slack", status: "on", color: "#4A154B", desc: "Post task updates and status changes to team channels." },
  { name: "GitLab", status: "off", color: "#FC6D26", desc: "Sync merge requests and pipelines with your tasks." },
  { name: "Google Drive", status: "off", color: "#4285F4", desc: "Attach docs and specs from Drive directly to tasks." },
  { name: "Discord", status: "off", color: "#5865F2", desc: "Mirror activity to a Discord server for the community." },
  { name: "Jira", status: "off", color: "#2684FF", desc: "Import issues from Jira and keep statuses in sync." },
];

// Sample comments shown in the task drawer (Phase 3 makes these real).
export const SAMPLE_COMMENTS: Comment[] = [
  { id: "cm1", userId: "u2", time: "2 days ago", text: "I can pair on this if the clock domain theory pans out — I have a logic analyzer set up." },
  { id: "cm2", userId: "u1", time: "1 day ago", text: "Thanks — will ping you once I've isolated the wake source." },
];
