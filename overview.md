# Project Overview

Welcome to the **Job Queue Manager** project! This orientation guide is designed to help you quickly understand what the system does, how its layers interact, how the repository is structured, and how to navigate day-to-day development.

---

### 1. System Overview & Core Purpose

The **Job Queue Manager (JQM)** is a modern automated grading and submission platform built for the Virginia Tech Computer Science department (a modernization and evolution of Web-CAT).

Students submit assignment archives (e.g. zip files) via a web interface or CLI. The system:
1. Validates submissions and course enrollments.
2. Persists metadata in a PostgreSQL database.
3. Saves submission files to S3-compatible object storage ([MinIO](file:///Users/edwards/git/job-queue-manager/backend/app/services/object_storage_service.ts)).
4. Enqueues grading tasks to a separate Kubernetes-based execution cluster via a REST API ([JobQueueService](file:///Users/edwards/git/job-queue-manager/backend/app/services/job_queue_service.ts)).
5. Receives grading results back asynchronously via webhook or polling, records feedback/scores, and can pass grades back to LMS platforms (Canvas) via LTI 1.3.

```
                   ┌───────────────────────┐
                   │  Nuxt 4 Web Frontend  │ (Port 3000)
                   │  or Interactive CLI   │
                   └───────────┬───────────┘
                               │ HTTP / JSON (Bearer token or HMAC-SHA256)
                               ▼
                   ┌───────────────────────┐
                   │ AdonisJS v6 Backend   │ (Port 3333)
                   └───┬───────────────┬───┘
                       │               │
      Upload Zip /     │               │ Queries / Mutations
      Presigned URLs   ▼               ▼
           ┌───────────────┐     ┌───────────────┐
           │ MinIO (S3)    │     │  PostgreSQL   │
           │ Bucket (9000) │     │ (Lucid ORM)   │
           └───────────────┘     └───────────────┘
                       │
                       │ POST /api/v1/jobs (multipart + metadata)
                       ▼
           ┌───────────────────────────────┐
           │ Partner Team Execution API    │
           │ (Kubernetes Grading Cluster)  │
           └───────────────┬───────────────┘
                           │ POST /api/v1/submissions/webhook
                           ▼
           ┌───────────────────────────────┐
           │ Results / Scores Persisted    │
           └───────────────────────────────┘
```

---

### 2. Repository Organization (pnpm Monorepo)

The project is structured as a monorepo governed by [pnpm-workspace.yaml](file:///Users/edwards/git/job-queue-manager/pnpm-workspace.yaml) and the root [package.json](file:///Users/edwards/git/job-queue-manager/package.json):

```
job-queue-manager/
├── .devcontainer/              # Standardized VS Code Dev Container setup
│   ├── devcontainer.json       # Node 22 + kubectl + pnpm environment
│   └── setup.sh                # Container first-time bootstrap script
├── backend/                    # AdonisJS v6 REST API
│   ├── app/
│   │   ├── controllers/        # HTTP route handlers
│   │   ├── middleware/         # Auth, Admin, HMAC signing, Bouncer initialization
│   │   ├── models/             # 57 Lucid models (legacy Web-CAT schema)
│   │   ├── policies/           # Bouncer authorization policies
│   │   └── services/           # External integrations (CAS, LTI, MinIO, Job Queue)
│   ├── database/migrations/    # Knex-based PostgreSQL migrations & seed data
│   ├── start/
│   │   ├── routes.ts           # Central route declarations (/api and /api/v1)
│   │   ├── kernel.ts           # Middleware pipeline
│   │   └── env.ts              # Env variable validation via VineJS
│   └── tests/functional/       # Japa test suite
├── frontend/                   # Nuxt 4 SPA (Single Page Application)
│   ├── app/
│   │   ├── pages/              # Vue router page tree (dashboard, assignments, etc.)
│   │   ├── composables/        # useApi ($fetch wrapper with auth injection)
│   │   ├── stores/             # Pinia auth store with persisted state
│   │   ├── middleware/         # Client route guards (auth, guest, admin)
│   │   └── layouts/            # Default layout and navigation shell
│   └── nuxt.config.ts          # Nuxt configuration (@nuxt/ui, Tailwind CSS)
├── packages/
│   └── cli/                    # Interactive terminal CLI tool (jqm)
├── docs/                       # Architecture diagrams, API specs, file-level docs
├── .github/workflows/          # CI testing & CD image building / K8s rollout
└── compose.yaml                # Local container orchestration
```

---

### 3. Backend Architecture ([backend/](file:///Users/edwards/git/job-queue-manager/backend))

The backend is built with **AdonisJS v6** (ESM native, strict TypeScript):

#### Dual API Design ([backend/start/routes.ts](file:///Users/edwards/git/job-queue-manager/backend/start/routes.ts))
The API is cleanly segregated into two entry strategies sharing the same business endpoints through `registerApiRoutes()`:
1. **Session API (`/api`)**: Authenticated via AdonisJS access tokens (`Authorization: Bearer <token>`). Used by the Nuxt web application.
2. **Programmatic API (`/api/v1`)**: Authenticated using HMAC-SHA256 request signatures via [oauth_signature_middleware.ts](file:///Users/edwards/git/job-queue-manager/backend/app/middleware/oauth_signature_middleware.ts). Intended for IDE extensions, automated scripts, the interactive CLI, and partner service webhooks.

#### Domain Services ([backend/app/services/](file:///Users/edwards/git/job-queue-manager/backend/app/services))
Business logic is decoupled from controllers into specialized services:
- [JobQueueService](file:///Users/edwards/git/job-queue-manager/backend/app/services/job_queue_service.ts): Integrates with the remote Kubernetes execution cluster (`POST /jobs`, queue status, worker health, and Docker image configuration).
- [ObjectStorageService](file:///Users/edwards/git/job-queue-manager/backend/app/services/object_storage_service.ts): Wraps `@aws-sdk/client-s3` for uploading and retrieving submission artifacts from MinIO (`submissions/{submissionId}/input/{filename}`).
- [CasService](file:///Users/edwards/git/job-queue-manager/backend/app/services/cas_service.ts): Handles Virginia Tech Central Authentication Service (CAS) SSO redirects and ticket validation.
- [LtiService](file:///Users/edwards/git/job-queue-manager/backend/app/services/lti_service.ts): Manages LTI 1.3 Canvas launch flows and score passback.

#### Data Model & Migrations ([backend/app/models/](file:///Users/edwards/git/job-queue-manager/backend/app/models))
The system uses Lucid ORM with 57 models mapping to the educational domain:
- **Core Entities**: [User](file:///Users/edwards/git/job-queue-manager/backend/app/models/user.ts), [Course](file:///Users/edwards/git/job-queue-manager/backend/app/models/course.ts), [Section](file:///Users/edwards/git/job-queue-manager/backend/app/models/section.ts), [Term](file:///Users/edwards/git/job-queue-manager/backend/app/models/term.ts).
- **Work & Submissions**: [Assignment](file:///Users/edwards/git/job-queue-manager/backend/app/models/assignment.ts), [AssignmentOffering](file:///Users/edwards/git/job-queue-manager/backend/app/models/assignment_offering.ts), [Submission](file:///Users/edwards/git/job-queue-manager/backend/app/models/submission.ts), [SubmissionResult](file:///Users/edwards/git/job-queue-manager/backend/app/models/submission_result.ts).
- **Role Hierarchy**: Governed by `GlobalRole` (Admin: `1`, Instructor: `2`, Student: `3`) and course-level `CourseRole` (Instructor, TA, Student).

---

### 4. Frontend Architecture ([frontend/](file:///Users/edwards/git/job-queue-manager/frontend))

The frontend is a modern **Nuxt 4** application configured as an SPA (`ssr: false` in [nuxt.config.ts](file:///Users/edwards/git/job-queue-manager/frontend/nuxt.config.ts)):

- **UI & Design**: Built on `@nuxt/ui` with Tailwind CSS and `@nuxt/icon` (Heroicons / Lucide collections).
- **HTTP Client**: [useApi](file:///Users/edwards/git/job-queue-manager/frontend/app/composables/useApi.ts) is a custom composable wrapping Nuxt's `$fetch`. It automatically attaches the persisted Bearer token, targets `config.public.apiBase`, handles multipart `FormData` boundary configurations, and handles error toast notifications / 403 authorization refreshes.
- **State Management**: [useAuthStore](file:///Users/edwards/git/job-queue-manager/frontend/app/stores/auth.ts) using Pinia with `pinia-plugin-persistedstate` to preserve user credentials and active tokens across page reloads.
- **Route Navigation & Pages**:
  - `login.vue`: Offers both VT CAS SSO login (cluster environment) and email/password login (local dev).
  - `dashboard.vue`: Landing dashboard summarizing active assignments, terms, and courses.
  - `assignments/` & `submissions/`: Assignment exploration, zip file upload interface, and test case result reporting.
  - `admin/`: Role assignments, system terms, image configurations, and queue monitoring.

---

### 5. CLI Package ([packages/cli/](file:///Users/edwards/git/job-queue-manager/packages/cli))

An interactive terminal interface (`jqm`) designed for students and staff:
- Authenticates using **HMAC-SHA256 request signing** against `/api/v1` using credentials generated in the web UI.
- Allows submitting code archives, viewing queue health, checking submission grading status, and managing course enrollments directly from the terminal without opening the browser.

---

### 6. Development Workflow & Environment

Because the project relies on cluster-hosted Postgres and MinIO, local development is coordinated through port-forward tunnels:

| Service | Port | Dev Requirement | Note |
|---|---|---|---|
| **Nuxt Frontend** | `3000` | Run locally via `pnpm dev:frontend` | Access at `http://localhost:3000` |
| **AdonisJS Backend** | `3333` | Run locally via `pnpm dev:backend` | Access at `http://localhost:3333` |
| **PostgreSQL** | `5432` | `kubectl port-forward svc/postgres 5432:5432` | Tunnel to VT Discovery cluster |
| **MinIO Storage** | `9000` | `kubectl port-forward svc/minio 9000:9000` | Required for zip upload & download |

#### Essential Root Scripts
Run these from the project root:
- `pnpm dev:backend` — Starts the AdonisJS backend with code watching.
- `pnpm dev:frontend` — Starts the Nuxt development server.
- `pnpm migration:run` — Runs pending database migrations.
- `pnpm lint` / `pnpm typecheck` — Validates TypeScript across all monorepo packages.
- `cd backend && node ace test` — Runs backend functional tests using Japa.

---

### 7. Helpful Files to Explore First

1. [README.md](file:///Users/edwards/git/job-queue-manager/README.md) — Step-by-step onboarding, cluster setup, and troubleshooting guide.
2. [docs/documentation.md](file:///Users/edwards/git/job-queue-manager/docs/documentation.md) — Comprehensive file-by-file reference covering design decisions, dependencies, and future notes.
3. [backend/start/routes.ts](file:///Users/edwards/git/job-queue-manager/backend/start/routes.ts) — The blueprint of all API capabilities and authentication rules.
4. [backend/app/services/job_queue_service.ts](file:///Users/edwards/git/job-queue-manager/backend/app/services/job_queue_service.ts) — The integration boundary with the execution backend.
5. [frontend/app/composables/useApi.ts](file:///Users/edwards/git/job-queue-manager/frontend/app/composables/useApi.ts) — The client-side HTTP bridge to the backend.
