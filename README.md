# Job Queue Manager

A full-stack job queue management system built for the VT CS department. Students submit code assignments through a Nuxt frontend; the system packages them into jobs sent to a Kubernetes grading backend via REST API. Results are returned and displayed to students.

## Tech Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Language       | TypeScript (full stack)           |
| Backend        | AdonisJS v6                       |
| Frontend       | Nuxt 4 + Nuxt UI                  |
| Database       | PostgreSQL                        |
| Auth           | VT CAS SSO + LTI 1.1              |
| Monorepo       | pnpm workspaces                   |
| Infrastructure | Kubernetes (VT Discovery cluster) |
| Object Storage | MinIO                             |

## Architecture

Your team owns the full application layer. A separate team owns the Kubernetes execution layer.

```
Student submits code
    ↓
Nuxt Frontend (port 3000)
    ↓
AdonisJS Backend (port 3333)
    ↓  POST to their REST API
Other Team's K8s Backend
    ↓
Worker pods execute code → results written back
```

The integration point is `backend/app/services/job_queue_service.ts` — currently stubbed pending the other team's API contract.

## Project Structure

```
job-queue-manager/
├── .devcontainer/
│   ├── devcontainer.json     # Dev container config
│   └── setup.sh              # First-time setup script
├── backend/                  # AdonisJS v6 API
│   ├── app/
│   │   ├── controllers/      # auth, cas, lti, submissions, assignments, courses
│   │   ├── middleware/        # auth, admin
│   │   ├── models/           # 57 Lucid models (full legacy schema)
│   │   └── services/         # cas_service, lti_service, job_queue_service
│   ├── database/
│   │   └── migrations/       # 7 migrations including seed data
│   ├── start/
│   │   ├── routes.ts         # all API routes
│   │   ├── kernel.ts         # middleware registration
│   │   └── env.ts            # environment variable validation
│   ├── .env.example
│   └── Dockerfile
├── frontend/                 # Nuxt 4 app
├── docs/                     # ER diagram, schema SQL reference
├── DOCUMENTATION.md          # Full file-level documentation
├── pnpm-workspace.yaml
├── package.json
└── compose.yaml
```

---

## Prerequisites

Install these on your host machine before opening the project:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — must be running in the background
- [VS Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

Node.js, pnpm, and kubectl are all handled inside the dev container automatically.

---

## First-Time Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd job-queue-manager
```

### 2. Download your kubeconfig

Go to [cloud.cs.vt.edu](https://cloud.cs.vt.edu), log in with your VT credentials, and download your kubeconfig file. Save it as `discovery.yaml` in the project root:

```
job-queue-manager/
└── discovery.yaml    ← place it here (gitignored — never commit this)
```

### 3. Open the dev container

Make sure Docker Desktop is running, then open in VS Code:

```
Ctrl+Shift+P → "Dev Containers: Reopen in Container"
```

The first build takes a few minutes. Once inside you'll see **`Dev Container: job-queue-manager`** in the bottom-left corner.

### 4. Run the setup script

Inside the VS Code terminal:

```bash
bash .devcontainer/setup.sh
```

This will:

- Verify pnpm and install all workspace dependencies
- Check your cluster connection
- Copy `.env.example` to `.env` if it doesn't exist
- Run a test build to catch any TypeScript errors

### 5. Set your DB password

The `DB_PASSWORD` is not in `.env.example` for security. Get it from a teammate or pull it from the Kubernetes secret:

```bash
kubectl get secret backend-env -n 22012-job-queue-manager \
  -o jsonpath='{.data.DB_PASSWORD}' | base64 --decode
```

Add it to `backend/.env`:

```dotenv
DB_PASSWORD=<value from above>
```

---

## Daily Development Workflow

You need multiple terminals open when developing locally.

**Terminal 1 — Postgres tunnel (keep this running the entire session):**

```bash
kubectl port-forward svc/postgres 5432:5432 -n 22012-job-queue-manager
```

**Terminal 2 — AdonisJS backend:**

```bash
cd backend && node ace serve --watch --poll
```

**Terminal 3 — Nuxt frontend:**

```bash
cd frontend && pnpm dev
```

| Service          | Local URL             | Cluster URL                                            |
| ---------------- | --------------------- | ------------------------------------------------------ |
| Nuxt frontend    | http://localhost:3000 | https://webcatmaxxers.discovery.cs.vt.edu              |
| AdonisJS backend | http://localhost:3333 | https://webcatmaxxers.discovery.cs.vt.edu/api          |
| Adminer (DB UI)  | —                     | https://webcatmaxxers.discovery.cs.vt.edu/db           |
| CAS login        | ❌ cluster only       | https://webcatmaxxers.discovery.cs.vt.edu/api/auth/cas |

> **CAS authentication only works on the Discovery cluster.** It will not redirect correctly on localhost. Test auth by deploying to the cluster.

---

## Database Migrations

Run pending migrations locally (requires Postgres tunnel running):

```bash
cd backend && node ace migration:run
```

Run on the cluster:

```bash
kubectl exec -it deployment/backend -n 22012-job-queue-manager -- node ace migration:run
```

Other useful commands:

```bash
node ace migration:status      # see what's been run
node ace migration:rollback    # undo last batch
node ace migration:fresh       # drop all + re-run (dev only, never on cluster)
```

### Seeded Reference Data

The seed migration (`1770829437466_seed_reference_data.ts`) inserts required reference rows:

| Table          | Seeded rows                                     |
| -------------- | ----------------------------------------------- |
| `global_role`  | Admin (id=1), Instructor (id=2), Student (id=3) |
| `course_role`  | Instructor, TA, Student, Observer               |
| `lms_type`     | Canvas, Blackboard, Moodle, Brightspace         |
| `organization` | Virginia Tech (id=1)                            |

> These IDs are referenced in `cas_controller.ts` and `lti_service.ts`. Do not change the seed order.

---

## Authentication

### VT CAS SSO

Students and instructors log in using their VT credentials. CAS is pre-registered with the Discovery cluster.

```
GET /api/auth/cas          → redirects to login.cs.vt.edu
GET /api/auth/cas/callback → validates ticket, issues token
GET /api/auth/cas/logout   → logs out of CAS session
```

New CAS users are automatically created with `globalRoleId: 3` (Student).

### Local Auth (for development/testing)

```
POST /api/auth/register    → create account with email/password
POST /api/auth/login       → get API token
DELETE /api/auth/logout    → revoke token
GET /api/auth/me           → get current user
```

### LTI 1.1

Scaffolded and ready — waiting on Canvas consumer key/secret from VT Middleware.
Launch URL: `https://webcatmaxxers.discovery.cs.vt.edu/api/lti/launch`

---

## API Routes

All protected routes require `Authorization: Bearer <token>` header.

| Method   | Route                         | Auth   | Description             |
| -------- | ----------------------------- | ------ | ----------------------- |
| GET      | `/api/auth/cas`               | Public | CAS login redirect      |
| POST     | `/api/auth/login`             | Public | Local login             |
| POST     | `/api/lti/launch`             | Public | LTI launch from Canvas  |
| POST     | `/api/submissions/webhook`    | Public | Results from other team |
| GET      | `/api/auth/me`                | Token  | Current user            |
| GET/POST | `/api/submissions`            | Token  | List/create submissions |
| GET      | `/api/submissions/:id/result` | Token  | Grading result          |
| GET/POST | `/api/assignments`            | Token  | List/create assignments |
| GET/POST | `/api/courses`                | Token  | List/create courses     |

---

## Deployment

The CI/CD pipeline deploys automatically on merge to `main`.

**Workflow:**

1. Merge feature branch → `dev` → `main` (via PR)
2. GitHub Actions builds and pushes Docker image to `container.cs.vt.edu`
3. Restart backend pod to pull new image:
   ```bash
   kubectl rollout restart deployment/backend -n 22012-job-queue-manager
   ```
4. Run migrations if schema changed:
   ```bash
   kubectl exec -it deployment/backend -n 22012-job-queue-manager -- node ace migration:run
   ```

**Cluster resources:**

| Resource      | Details                                                                      |
| ------------- | ---------------------------------------------------------------------------- |
| Namespace     | `22012-job-queue-manager`                                                    |
| Backend image | `container.cs.vt.edu/timwilson/job-queue-manager-images/backend:prod_latest` |
| Cluster UI    | https://cloud.cs.vt.edu                                                      |

---

## Useful Root Scripts

Run from the project root without `cd`:

```bash
pnpm dev:backend        # start AdonisJS in watch mode
pnpm dev:frontend       # start Nuxt dev server
pnpm build:backend      # build backend for production
pnpm migration:run      # run pending migrations
pnpm migration:rollback # rollback last migration batch
pnpm lint               # lint all workspaces
pnpm typecheck          # typecheck all workspaces
```

---

## Useful kubectl Commands

```bash
# View backend logs
kubectl logs deployment/backend -n 22012-job-queue-manager --follow

# Open Postgres tunnel
kubectl port-forward svc/postgres 5432:5432 -n 22012-job-queue-manager

# Run migrations on cluster
kubectl exec -it deployment/backend -n 22012-job-queue-manager -- node ace migration:run

# Open AdonisJS REPL on cluster
kubectl exec -it deployment/backend -n 22012-job-queue-manager -- node ace repl

# Restart backend after image update
kubectl rollout restart deployment/backend -n 22012-job-queue-manager

# Update a secret value
kubectl patch secret backend-env -n 22012-job-queue-manager \
  --type=json \
  -p='[{"op":"replace","path":"/data/KEY","value":"'$(echo -n 'value' | base64)'"}]'
```

---

## Database Access (Adminer)

**URL:** https://webcatmaxxers.discovery.cs.vt.edu/db

| Field    | Value              |
| -------- | ------------------ |
| System   | PostgreSQL         |
| Server   | postgres           |
| Username | user               |
| Password | _(ask a teammate)_ |
| Database | postgres           |

---

## Open Items / Blocked

| Item                         | Status     | Notes                                              |
| ---------------------------- | ---------- | -------------------------------------------------- |
| LTI consumer key/secret      | ⚠️ Blocked | Ask professor to register tool in Canvas           |
| Other team REST API contract | ⚠️ Blocked | Need endpoint URL, payload format, result callback |
| Frontend deployment          | 🔲 Pending | Dockerfile + CI step needed                        |
| MinIO file upload            | 🔲 Pending | Hook into submissions_controller.ts                |
| Grade passback OAuth signing | 🔲 Pending | Need oauth-signature package integration           |

---

## Troubleshooting

**"Dev Containers: Reopen in Container" doesn't appear**
→ Make sure the Dev Containers VS Code extension is installed.

**Container fails to build**
→ Make sure Docker Desktop is running.

**`kubectl` connection errors**
→ Make sure `discovery.yaml` is in the project root. VPN is not required for the VT Discovery cluster.

**Port 5432 already in use**
→ Stop any local Postgres instance, or change the port-forward:

```bash
kubectl port-forward svc/postgres 5433:5432 -n 22012-job-queue-manager
```

Then update `DB_PORT=5433` in `backend/.env`.

**CAS login not redirecting**
→ CAS only works on the cluster. Deploy first, then test at `webcatmaxxers.discovery.cs.vt.edu/api/auth/cas`.

**Migrations fail with `ENOTFOUND network`**
→ `DB_HOST` in the backend-env secret is wrong. Fix it:

```bash
kubectl patch secret backend-env -n 22012-job-queue-manager \
  --type=json \
  -p='[{"op":"replace","path":"/data/DB_HOST","value":"'$(echo -n 'postgres' | base64)'"}]'
kubectl rollout restart deployment/backend -n 22012-job-queue-manager
```

**Migrations fail with SASL password error**
→ `DB_PASSWORD` is missing from the backend-env secret. Add it:

```bash
kubectl patch secret backend-env -n 22012-job-queue-manager \
  --type=json \
  -p='[{"op":"add","path":"/data/DB_PASSWORD","value":"'$(echo -n 'your_password' | base64)'"}]'
```

---

## Documentation

Full file-level documentation is in `DOCUMENTATION.md` at the project root. It covers every file's purpose, design decisions, dependencies, and notes for future developers.
