# Orbit — Engineering Workspace

A fast, lightweight project-management app for a small engineering team.
Built to run comfortably on a ~2 GB EC2 instance.

> **Phase 3 — Authentication.** Team members sign in with email + password.
> Sessions are server-side (httpOnly cookie); every API route except `/auth/*`
> and `/health` requires a valid session, and the acting user comes from it.
> Collaboration (comments + persisted chat) is built and live.

## Layout

```
orbit/
├── src/            # React + TypeScript + Vite frontend
├── server/         # Fastify + better-sqlite3 REST API
└── README.md
```

## Running it (development)

You need two terminals. The frontend dev server proxies `/api` → `:3000`.

**Terminal 1 — backend**
```bash
cd server
npm install
npm run dev          # http://localhost:3000  (auto-migrates + seeds on first run)
```

**Terminal 2 — frontend**
```bash
npm install
npm run dev          # http://localhost:5173
```

Open http://localhost:5173. The database file is created at `server/data/orbit.db`.

### Useful backend scripts
```bash
npm run migrate   # create tables + indexes (idempotent)
npm run seed      # seed sample data (only if empty)
npm run reset     # wipe the db, migrate, and re-seed
npm run build     # compile to dist/, then `npm start` to run
```

## Authentication

Email + password login. Sessions are stored in SQLite and carried in an
httpOnly, SameSite=Lax cookie (Secure in production), so the token is never
exposed to JavaScript. Passwords are hashed with Node's built-in `scrypt`
(no native dependency).

Seeded accounts (change these!):

```
aditya@orbit.dev   rahul@orbit.dev   priya@orbit.dev
karan@orbit.dev    sneha@orbit.dev   meera@orbit.dev
password for all:  changeme123
```

Admin tasks:

```bash
cd server
npm run set-password -- aditya@orbit.dev 'a-strong-password'   # reset a password
```

Self-signup is disabled by default. To allow it, start the server with
`ALLOW_SIGNUP=true` (exposes `POST /api/auth/register`).

Auth endpoints: `POST /api/auth/login`, `POST /api/auth/logout`,
`GET /api/auth/me`.

## Stack

- **Frontend:** React 18, TypeScript, Vite, zustand, react-router, lucide-react
- **Backend:** Fastify, better-sqlite3, @fastify/cors, @fastify/compress
- **DB:** SQLite (WAL mode) — in-process, near-zero idle memory

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/bootstrap` | users + projects + current user (hydrates the shell) |
| GET | `/api/stats` | dashboard counts |
| GET | `/api/tasks` | list with `q, projectId, assigneeId, status, priority, type, scope, page, pageSize` |
| GET | `/api/tasks/:id` | single task |
| POST | `/api/tasks` | create (auto per-project id, e.g. `BADGE-106`) |
| PATCH | `/api/tasks/:id` | partial update (logs status changes to activity) |
| DELETE | `/api/tasks/:id` | delete |
| GET | `/api/projects` `/api/projects/:id` | projects with computed progress + task counts |
| GET | `/api/activity` | recent activity (relative timestamps) |
| GET | `/api/connectors` | connector placeholders |
| GET | `/api/health` | liveness |

Filtering, search, and pagination are all server-side. Responses are gzip-compressed
and shaped to match the frontend types exactly (no client-side mapping).

## Data model (SQLite)

`users`, `projects`, `project_members`, `tasks`, `task_labels`, `activity`,
`comments` (table ready for Phase 3). Indexes cover the fields we filter, sort,
and search by. Task IDs use a per-project counter stored on `projects.seq`.

## The API seam

`src/store/useStore.ts` is the single place the UI talks to data, via
`src/lib/api.ts`. Optimistic updates apply locally first, then reconcile with the
server response (and roll back on error).

## Memory notes (2 GB EC2)

- **Runtime:** SQLite is in-process; Fastify is light; the built frontend is
  static files. Comfortable well under 2 GB.
- **Build:** compile the frontend off-instance or with
  `NODE_OPTIONS=--max-old-space-size=1024 npm run build` (+ a 2 GB swap file).

## Onboarding & roles

New people **request access** from the login screen (name, email, password). Their
account is created as `pending` and **cannot log in** until an admin approves it.

- **Admin** (Aditya by default) sees pending requests under **Settings → Access
  requests** and can **Approve** or **Decline**.
- Approved users can sign in; declined users are blocked with a clear message.
- Roles are `admin` / `member`. Existing accounts are auto-set to active members
  on upgrade, and Aditya is promoted to admin automatically on first restart.

Admin API (admin session required): `GET /api/admin/pending`,
`GET /api/admin/users`, `POST /api/admin/users/:id/approve`,
`POST /api/admin/users/:id/decline`.

## Deploy (Linux / EC2)

Copy the project to the server, then from the project root:

```bash
sudo python3 deploy.py
```

It installs Node 20, nginx and build tools, adds swap on small boxes, builds
both apps, runs the backend as a systemd service (`orbit`), and points nginx at
the built frontend with `/api` proxied to the backend. Re-running is safe.

```bash
sudo python3 deploy.py --server-name orbit.example.com   # set a hostname
sudo systemctl status orbit                              # backend status
sudo journalctl -u orbit -f                              # backend logs
```

Open port 80 in your EC2 security group. Login works over plain HTTP; once you
add HTTPS, set `COOKIE_SECURE=true` in the service file and restart.

## Roadmap

- **Phase 3 — Authentication** ✅ (this build)
- **Phase 4 — Collaboration** ✅ Comments + persisted chat (channels, DMs, polling)
- **Phase 5** — Connector framework, GitHub + Slack
- **Phase 6 — Deploy to EC2** ✅ (`deploy.py`)
