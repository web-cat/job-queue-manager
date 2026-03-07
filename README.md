# Job Queue Manager

A full-stack job queue management system built with AdonisJS, Nuxt 4, and PostgreSQL, structured as a pnpm monorepo.

## Tech Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Language       | TypeScript (full stack)           |
| Backend        | AdonisJS v6                       |
| Frontend       | Nuxt 4                            |
| Database       | PostgreSQL                        |
| Monorepo       | pnpm workspaces                   |
| Infrastructure | Kubernetes (VT Discovery cluster) |

## Project Structure

```
job-queue-manager/
├── .devcontainer/          # Dev container config (VS Code)
│   ├── devcontainer.json
│   └── setup.sh
├── backend/                # AdonisJS v6 API
│   ├── app/
│   ├── database/
│   │   └── migrations/
│   ├── .env.example
│   └── Dockerfile          # For K8s deployment only
├── frontend/               # Nuxt 4 app
├── packages/               # Shared TypeScript models & utilities
├── pnpm-workspace.yaml
├── package.json
└── compose.yaml
```

---

## Prerequisites

Before setting up the project, install the following on your machine:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — must be running in the background
- [VS Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VS Code

That's it — Node.js, pnpm, and kubectl are all handled inside the dev container automatically.

---

## First-Time Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd job-queue-manager
```

### 2. Download your kubeconfig

Go to the Rancher UI at [launch.cs.vt.edu](https://launch.cs.vt.edu), log in, and download your kubeconfig file. Save it as `discovery.yaml` in the project root:

```
job-queue-manager/
└── discovery.yaml    ← place it here
```

> **Important:** `discovery.yaml` is gitignored. Every team member downloads their own — never commit it to the repo.

### 3. Set up your `.env`

```bash
cp backend/.env.example backend/.env
```

The `.env.example` already has the correct values for the cluster database. You should not need to change anything.

### 4. Open the dev container

Make sure Docker Desktop is running (whale icon in system tray), then open the project in VS Code:

```
Ctrl+Shift+P → "Dev Containers: Reopen in Container"
```

VS Code will build the container — this takes a few minutes the first time. Once inside, you'll see **`Dev Container: job-queue-manager`** in the bottom-left corner of VS Code.

### 5. Run the setup script

In the VS Code terminal (which is now inside the container):

```bash
bash .devcontainer/setup.sh
```

This verifies your cluster connection, installs dependencies, and prints next steps.

---

## Daily Development Workflow

You need two terminals open whenever you're working locally.

**Terminal 1 — open the Postgres tunnel (keep this running):**

```bash
kubectl port-forward svc/postgres 5432:5432 -n 22012-job-queue-manager
```

**Terminal 2 — start the backend:**

```bash
cd backend && node ace serve --watch
```

**Terminal 3 — start the frontend:**

```bash
cd frontend && pnpm dev
```

| Service          | URL                   |
| ---------------- | --------------------- |
| Nuxt frontend    | http://localhost:3000 |
| AdonisJS backend | http://localhost:3333 |

---

## Database Migrations

Run pending migrations:

```bash
# From project root
pnpm migration:run

# Or directly
cd backend && node ace migration:run
```

Other useful migration commands:

```bash
node ace migration:status      # see what's been run
node ace migration:rollback    # undo last batch
node ace migration:fresh       # drop all tables and re-run everything (dev only)
```

> Make sure the Postgres tunnel (Terminal 1 above) is running before executing any migration commands.

---

## Useful Root Scripts

These can be run from the project root without `cd`-ing into subfolders:

```bash
pnpm dev:backend        # start AdonisJS in watch mode
pnpm dev:frontend       # start Nuxt dev server
pnpm build:backend      # build backend for production
pnpm build:frontend     # build frontend for production
pnpm migration:run      # run pending migrations
pnpm migration:rollback # rollback last migration batch
pnpm lint               # lint all workspaces
pnpm typecheck          # typecheck all workspaces
```

---

## Database Access

You can inspect the database directly via the Adminer UI:

**URL:** https://webcatmaxxers.discovery.cs.vt.edu/db

| Field    | Value              |
| -------- | ------------------ |
| System   | PostgreSQL         |
| Server   | postgres           |
| Username | user               |
| Password | _(ask a teammate)_ |
| Database | postgres           |

---

## Shared Packages

The `packages/` directory is for TypeScript models and utilities shared between the backend and frontend. To add a new shared package:

```
packages/
└── shared/
    ├── package.json    # name: "@job-queue-manager/shared"
    └── src/
```

Then reference it in `backend/package.json` or `frontend/package.json`:

```json
{
  "dependencies": {
    "@job-queue-manager/shared": "workspace:*"
  }
}
```

---

## Troubleshooting

**"Dev Containers: Reopen in Container" doesn't appear**
→ Make sure the Dev Containers VS Code extension is installed.

**Container fails to build**
→ Make sure Docker Desktop is running (whale icon in system tray).

**`kubectl` connection errors**
→ Make sure `discovery.yaml` is in the project root and you're connected to the internet. VPN is not required for the VT Discovery cluster.

**Port 5432 already in use**
→ You may have a local Postgres instance running. Stop it or change the port-forward: `kubectl port-forward svc/postgres 5433:5432 -n 22012-job-queue-manager` and update `DB_PORT=5433` in `backend/.env`.

**`node ace` command not found**
→ Make sure you're inside the dev container (check bottom-left of VS Code) and run `pnpm install` from the project root.
