# ═══════════════════════════════════════════════════════════════════════════════

# FRONTEND — NUXT 4 APPLICATION

# ═══════════════════════════════════════════════════════════════════════════════

#

# OVERVIEW:

# Full Nuxt 4 SPA frontend built with Nuxt UI, Tailwind CSS v4, and Pinia.

# Deployed as a separate Kubernetes pod at webcatmaxxers.discovery.cs.vt.edu.

# All API calls go to the backend at /api/\* via the cluster ingress.

#

# TECH STACK:

# Framework: Nuxt 4.4.2

# UI Components: Nuxt UI 4.6.1

# CSS: Tailwind CSS v4 via @tailwindcss/vite plugin

# State: Pinia with pinia-plugin-persistedstate

# Fonts: DM Sans (body) + DM Mono (code/data) via Google Fonts

# Accent color: VT Maroon (#861F41)

# Color mode: System default (light/dark)

#

# ROUTING STRUCTURE:

# / → index-redirect middleware → /dashboard or /login

# /login → guest middleware → login page (layout: false)

# /auth/callback → receives CAS token (layout: false)

# /lti/launch → receives LTI token (layout: false)

# /dashboard → auth middleware → student home

# /assignments → auth middleware → assignment list

# /assignments/:id → auth middleware → assignment detail + submit

# /submissions → auth middleware → submission history

# /submissions/:id → auth middleware → submission detail + polling

# /courses → auth middleware → course list

# /courses/:id → auth middleware → course detail + sections

#

# AUTH FLOW:

# CAS: / → /login → /api/auth/cas → VT CAS → /api/auth/cas/callback

# → backend issues token → /auth/callback?token=xxx → /dashboard

# Local: /login form → POST /api/auth/login → token → /dashboard

# LTI: Canvas → POST /api/lti/launch → token → /lti/launch?token=xxx → /dashboard

#

# SESSION PERSISTENCE:

# Token and user stored in localStorage via pinia-plugin-persistedstate.

# Plugin key: 'jqm-auth'. Restored automatically on every page load.

# No manual init() calls needed anywhere.

#

# DEPLOYMENT:

# Image: container.cs.vt.edu/timwilson/job-queue-manager-images/frontend:prod_latest

# Built by GitHub Actions on merge to main (build-frontend job)

# Build context: repo root (.) so Dockerfile can access workspace files

# Served by: Node.js server on port 3000

# Env var: NUXT_PUBLIC_API_BASE=https://webcatmaxxers.discovery.cs.vt.edu

# ─────────────────────────────────────────────────────────────────────────────

# ROOT FILES

# ─────────────────────────────────────────────────────────────────────────────

FILE: frontend/nuxt.config.ts
PURPOSE: Nuxt application configuration. Registers modules, sets runtime config,
configures Vite plugins, and defines color mode preferences.
DESIGN: SSR is disabled via routeRules so the app runs as a pure client-side SPA.
This avoids Nitro/vite-node IPC issues in the dev container and is appropriate
since all pages are behind authentication with no SEO requirements.
Tailwind CSS v4 is loaded via @tailwindcss/vite plugin — do NOT add a
tailwind.config.js, v4 uses CSS-first configuration.
pinia-plugin-persistedstate is included in optimizeDeps.include so Vite
pre-bundles it and avoids runtime discovery warnings.
KEY CONFIG:
runtimeConfig.public.apiBase — backend URL, overridden by NUXT_PUBLIC_API_BASE env var
colorMode.preference: 'system' — respects OS dark/light preference
vite.server.watch.usePolling: true — required for file watching in dev containers
DEPENDENCIES: @pinia/nuxt, @nuxt/ui, @tailwindcss/vite, tailwindcss
STATUS: complete

FILE: frontend/Dockerfile
PURPOSE: Multi-stage Docker build for the Nuxt 4 frontend.
DESIGN: Stage 1 (build) installs pnpm, copies workspace root files and frontend/,
runs pnpm install --filter frontend, then nuxt build. The NUXT_PUBLIC_API_BASE
build arg bakes the cluster API URL into the static build.
Stage 2 (serve) copies only the .output directory and runs node server/index.mjs.
Build context MUST be repo root (.) not ./frontend — the Dockerfile copies
workspace-level files (package.json, pnpm-workspace.yaml, pnpm-lock.yaml)
that don't exist inside the frontend directory alone.
NEXT TEAM NOTES: If the API URL changes, update NUXT_PUBLIC_API_BASE in both
the Dockerfile ARG default and the frontend Kubernetes deployment env var.
The build arg bakes the URL at build time — runtime env vars do NOT work
for Nuxt public config in static SPA mode.
STATUS: complete

FILE: frontend/app/assets/css/main.css
PURPOSE: Global CSS entry point imported by Nuxt via css: ['~/assets/css/main.css'].
DESIGN: Contains only two @import statements — tailwindcss and @nuxt/ui.
Nuxt UI v4 requires both to be imported together for component styles to work.
Do not add component-specific styles here — use scoped styles in .vue files.
STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

# APP ROOT

# ─────────────────────────────────────────────────────────────────────────────

FILE: frontend/app/app.vue
PURPOSE: Root Vue component wrapping all pages.
DESIGN: Wraps content in <UApp> (required by Nuxt UI for toast/modal providers),
<NuxtLayout> (renders the active layout), and <NuxtPage> with :key="$route.fullPath"
to force component remount on every route change. The key is critical — without it
Vue reuses page components across navigations and content doesn't update.
No auth logic here — session restoration is handled by pinia-plugin-persistedstate.
STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

# STORES

# ─────────────────────────────────────────────────────────────────────────────

FILE: frontend/app/stores/auth.ts
PURPOSE: Central auth state store. Holds the API token and authenticated user
profile. Provides login, logout, token set, and user fetch actions.
DESIGN: Uses Pinia setup store syntax (not options syntax) for better TypeScript
inference. State is persisted automatically to localStorage via pinia-plugin-
persistedstate with key 'jqm-auth' — token and user are saved on every change
and restored on page load before any middleware runs.
IMPORTANT: passwordColumnName in User model must be 'encryptedPassword' (camelCase)
not 'encrypted*password' — Lucid's $getAttribute uses camelCase keys internally.
The backend login response shape is { token: { token: 'oat*...' } } — access
via data.token.token (not data.token.value).
KEY ACTIONS:
login(email, password) — POST /api/auth/login, sets token
setToken(token) — stores token, calls fetchUser()
fetchUser() — GET /api/auth/me, populates user
logout() — DELETE /api/auth/logout, clears state, navigates to /login
clearAuth() — clears token and user without API call (used on 401)
PERSIST: key='jqm-auth', picks=['token','user']
DEPENDENCIES: pinia, vue, #app (navigateTo, useRuntimeConfig)
CONSUMERS: auth middleware, guest middleware, default layout, login page,
auth/callback page, lti/launch page
STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

# PLUGINS

# ─────────────────────────────────────────────────────────────────────────────

FILE: frontend/app/plugins/pinia-persistedstate.client.ts
PURPOSE: Registers pinia-plugin-persistedstate with the Pinia instance.
DESIGN: The .client.ts filename convention tells Nuxt to only load this plugin
on the client side — localStorage is not available server-side. The plugin
intercepts Pinia store state changes and writes them to localStorage, and
reads from localStorage on store initialization. Stores opt in by adding
a persist option to their defineStore() call.
DEPENDENCIES: pinia-plugin-persistedstate
CONSUMERS: auth.ts store (persist option)
STATUS: complete

FILE: frontend/app/plugins/pinia.ts
PURPOSE: Additional Pinia plugin registration if needed.
NEXT TEAM NOTES: If this file is empty or redundant with @pinia/nuxt module
auto-registration, it can be removed.
STATUS: review — may be redundant with @pinia/nuxt module

# ─────────────────────────────────────────────────────────────────────────────

# COMPOSABLES

# ─────────────────────────────────────────────────────────────────────────────

FILE: frontend/app/composables/useApi.ts
PURPOSE: Wraps $fetch with automatic auth header injection and base URL resolution.
Provides get, post, patch, del helpers for all API calls from pages and components.
DESIGN: Reads apiBase from useRuntimeConfig() and token from useAuthStore() on
every call — no stale closures. All requests include Authorization: Bearer <token>
header automatically. Errors propagate to callers — pages handle error display.
USAGE:
const { get, post, patch, del } = useApi()
const submissions = await get('/submissions')
const result = await post('/submissions', { workoutId: 1 })
NOTE: Path argument should NOT include /api prefix — the composable adds it.
Example: get('/submissions') → GET {apiBase}/api/submissions
CONSUMERS: all page components
STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

# MIDDLEWARE

# ─────────────────────────────────────────────────────────────────────────────

FILE: frontend/app/middleware/auth.ts
PURPOSE: Protects authenticated routes. Redirects unauthenticated users to /login.
DESIGN: Skips on server (import.meta.server check) since localStorage is client-only.
Checks authStore.token (restored by pinia-plugin-persistedstate before middleware runs).
If token exists but user is not loaded, calls fetchUser() to populate user profile.
fetchUser() internally calls clearAuth() if the token is invalid, which will cause
the next navigation to redirect to /login.
USAGE: definePageMeta({ middleware: 'auth' }) on protected pages
CONSUMERS: dashboard, assignments/_, submissions/_, courses/\*
STATUS: complete

FILE: frontend/app/middleware/guest.ts
PURPOSE: Prevents authenticated users from accessing public pages like /login.
Redirects to /dashboard if a valid token exists.
DESIGN: Skips on server. Checks authStore.token only — does not fetch user profile
since this is a lightweight redirect check.
USAGE: definePageMeta({ middleware: 'guest' }) on login page
CONSUMERS: login.vue
STATUS: complete

FILE: frontend/app/middleware/index-redirect.ts
PURPOSE: Handles root path (/) redirect. Routes to /dashboard if authenticated,
/login if not. Uses replace: true so / never appears in browser history.
DESIGN: Skips on server. Pinia persistence has already restored the token by the
time this middleware runs on the client.
USAGE: definePageMeta({ middleware: 'index-redirect' }) on index.vue
CONSUMERS: index.vue
STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

# LAYOUTS

# ─────────────────────────────────────────────────────────────────────────────

FILE: frontend/app/layouts/default.vue
PURPOSE: Main application shell with top navigation bar.
DESIGN: Nav is only shown when BOTH conditions are true: the current route is not
an auth page AND authStore.isAuthenticated is true. This prevents the nav from
flashing on login/callback/lti pages and prevents showing nav to logged-out users.
Auth pages (/, /login, /auth/_, /lti/_) use layout: false in their definePageMeta
so they render full-screen without this layout wrapper entirely.
Sign out button is always visible in the nav when shown — not hidden in a dropdown
to ensure accessibility and discoverability.
NAV LINKS: Dashboard, Assignments, Submissions, Courses
ACTIVE STATE: route.path.startsWith(link.to) — highlights current section
CONSUMERS: all non-auth pages (dashboard, assignments, submissions, courses)
STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

# PAGES

# ─────────────────────────────────────────────────────────────────────────────

FILE: frontend/app/pages/index.vue
PURPOSE: Root redirect page. Blank template — immediately redirects via middleware.
DESIGN: layout: false so no nav flash occurs during redirect. The index-redirect
middleware handles the actual navigation decision.
STATUS: complete

FILE: frontend/app/pages/login.vue
PURPOSE: Login page with CAS SSO primary action and local auth fallback.
DESIGN: layout: false — renders its own full-screen two-panel layout (dark branding
left, form right) without the default nav wrapper. Guest middleware redirects
authenticated users away before the page renders.
CAS login button links to /api/auth/cas (external: true so Nuxt doesn't intercept).
Local login calls authStore.login() — error handling in try/catch/finally ensures
loading spinner always stops even on failure.
Error messages from CAS/LTI redirect are shown via route.query.error param.
NEXT TEAM NOTES: The local login form is intentionally de-emphasized — it exists
for development only. CAS is the production auth method.
STATUS: complete

FILE: frontend/app/pages/auth/callback.vue
PURPOSE: Receives the token after CAS authentication completes.
DESIGN: layout: false. The backend redirects here with ?token=xxx after successful
CAS ticket validation. The page calls authStore.setToken() which stores the token
and fetches the user profile, then navigates to /dashboard after a brief success
state display. Error states redirect back to /login with an error query param.
NEXT TEAM NOTES: The backend CAS callback URL is hardcoded as
webcatmaxxers.discovery.cs.vt.edu/auth/callback in CAS_SERVICE_URL env var.
If the frontend URL changes this env var must be updated on the cluster.
STATUS: complete

FILE: frontend/app/pages/lti/launch.vue
PURPOSE: Receives the token after a Canvas LTI launch completes.
DESIGN: layout: false. Backend redirects here with ?token=xxx after successful
LTI OAuth validation and user provisioning. If a resourceLinkId is present,
redirects to /assignments; otherwise to /dashboard.
NEXT TEAM NOTES: LTI is currently blocked on Canvas consumer credentials. Once
credentials are obtained and the tool is registered in Canvas, test the full
launch flow ending here.
STATUS: stub — LTI launch works but grade passback and resource_link_id mapping pending

FILE: frontend/app/pages/dashboard.vue
PURPOSE: Student home page showing recent submissions, stats, quick actions, system status.
DESIGN: auth middleware. Uses useAsyncData to fetch recent submissions on load.
Stats computed from submission list (total, graded, pending).
System status indicators are currently hardcoded — Job Queue shows 'Connecting'
since partner team API is not yet integrated.
Greeting changes based on time of day.
NEXT TEAM NOTES: System status should be wired to actual health check endpoints
once partner team API is available.
STATUS: complete [system status indicators hardcoded]

FILE: frontend/app/pages/assignments/index.vue
PURPOSE: List of available assignments with search.
DESIGN: auth middleware. Fetches GET /api/assignments on load. Client-side search
filters by name and description. Empty state shows when no assignments exist.
Each card links to /assignments/:id.
STATUS: complete

FILE: frontend/app/pages/assignments/[id].vue
PURPOSE: Assignment detail page with submission form.
DESIGN: auth middleware. Fetches GET /api/assignments/:id on load.
File upload area is a visual placeholder — actual file upload requires MinIO
integration in submissions_controller.ts (in progress by teammate).
Submit button calls POST /api/submissions with workoutId.
On success shows submission ID and link to /submissions/:id.
NEXT TEAM NOTES: Wire the file upload input to send multipart form data once
storage_service.ts is complete. The backend submissions_controller.ts
needs to accept a file field and store it in MinIO before enqueuing the job.
STATUS: partial [file upload UI present but not wired to storage]

FILE: frontend/app/pages/submissions/index.vue
PURPOSE: Submission history list with status badges and scores.
DESIGN: auth middleware. Fetches GET /api/submissions with pagination.
Status shown as colored badge (green=graded, amber=pending).
Score shown as percentage when available.
timeAgo() helper formats relative timestamps.
STATUS: complete

FILE: frontend/app/pages/submissions/[id].vue
PURPOSE: Individual submission detail with grading result and job queue info.
DESIGN: auth middleware. Fetches submission and result on load.
Polls GET /api/submissions/:id every 5 seconds while feedbackReady is false.
Polling stops automatically when grading completes (clearInterval on feedbackReady).
Score displayed as large percentage with color coding (green ≥90%, amber ≥70%, red <70%).
Job queue info section shows enqueuedJob details if present.
NEXT TEAM NOTES: The result display currently shows a placeholder for test case
results — wire to actual submission_result data once partner team confirms
the result payload format.
STATUS: complete [test case details pending partner team result format]

FILE: frontend/app/pages/courses/index.vue
PURPOSE: Course list with search.
DESIGN: auth middleware. Fetches GET /api/courses on load. Client-side search
by name and course number.
STATUS: complete

FILE: frontend/app/pages/courses/[id].vue
PURPOSE: Course detail showing sections and enrollment status.
DESIGN: auth middleware. Fetches GET /api/courses/:id on load.
Sections list shows term and self-enrollment status.
STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

# BACKEND CHANGES SINCE LAST DOCUMENTATION PASS

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/controllers/auth_controller.ts
PURPOSE: (previously documented — updated fields only)
CHANGES SINCE LAST DOC:
register() — fixed to include all required NOT NULL fields:
slug: email.split('@')[0]
globalRoleId: 3 (Student)
signInCount: 0
encryptedPassword: await hash.use('scrypt').make(data.password)
(previously was passing raw password — now correctly hashed before storage)
login() — wrapped verifyCredentials in try/catch returning generic 401.
Debug logging removed after root cause identified.
CRITICAL FIX: passwordColumnName in withAuthFinder mixin must be 'encryptedPassword'
(camelCase property name) not 'encrypted_password' (snake_case DB column).
Lucid's $getAttribute resolves by camelCase key internally. Using snake_case
causes verifyCredentials to receive undefined and throw on every login attempt.
STATUS: complete

FILE: backend/app/models/user.ts
PURPOSE: (previously documented — updated fields only)
CHANGES SINCE LAST DOC:
passwordColumnName changed from 'encrypted_password' to 'encryptedPassword'.
This was the root cause of the login failure. See auth_controller.ts note above.
STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

# DEPLOYMENT FILES

# ─────────────────────────────────────────────────────────────────────────────

FILE: frontend/Dockerfile
PURPOSE: (documented above under ROOT FILES)

FILE: docs/frontend-deployment.yaml
PURPOSE: Kubernetes Deployment and Service manifest for the frontend pod.
DESIGN: Single replica running the frontend Node server on port 3000.
NUXT_PUBLIC_API_BASE set to cluster URL so API calls route correctly.
imagePullSecrets references registry-credential for VT container registry auth.
NEXT TEAM NOTES: Increase replicas if load increases. The frontend is stateless
so horizontal scaling is straightforward.
STATUS: complete

FILE: docs/frontend-ingress.yaml
PURPOSE: Kubernetes Ingress routing / (all paths) to the frontend service.
DESIGN: Prefix match on / so all non-API, non-adminer routes hit the frontend.
Works in conjunction with backend-ingress (handles /api) and adminer-ingress (/db).
Ingress precedence: more specific paths (/api, /db) take priority over / prefix.
STATUS: complete

FILE: docs/ingress-backup.yaml
PURPOSE: Backup of original ingress configuration before frontend deployment.
Use kubectl apply -f docs/ingress-backup.yaml to restore if ingress changes
cause issues.
STATUS: reference only

FILE: .github/workflows/build-images.yml
PURPOSE: (previously documented — updated fields only)
CHANGES SINCE LAST DOC:
build-frontend job uncommented and activated.
context changed from ./frontend to . (repo root) — required because the
Dockerfile copies workspace-level files that only exist at repo root.
file: ./frontend/Dockerfile — points to correct Dockerfile location.
STATUS: complete — both backend and frontend build on every merge to main

# ─────────────────────────────────────────────────────────────────────────────

# KNOWN ISSUES AND NEXT TEAM NOTES

# ─────────────────────────────────────────────────────────────────────────────

#

# 1. FILE UPLOAD (IN PROGRESS)

# assignments/[id].vue has a file upload UI placeholder. MinIO integration

# is being implemented by teammate via @aws-sdk/client-s3 directly (not

# @adonisjs/drive which requires v7). Once storage_service.ts is complete,

# wire the frontend file input to send multipart form data to POST /api/submissions.

#

# 2. SUBMISSION RESULT DISPLAY

# submissions/[id].vue polls for results but only shows score percentage.

# Full test case breakdown is pending partner team confirming submission_result

# payload format. Wire to actual data once format is confirmed.

#

# 3. LTI GRADE PASSBACK

# lti_service.ts sendGrade() sends unsigned XML — Canvas will reject this.

# Install oauth-signature and sign the request before POSTing. See the TODO

# comment in sendGrade() for the exact implementation pattern.

#

# 4. RESOURCE_LINK_ID MAPPING

# lti_controller.ts launch() does not yet map Canvas resource_link_id to

# assignment_offering_id. This mapping is needed to associate an LTI launch

# with the correct assignment in the system.

#

# 5. PARTNER TEAM API

# job_queue_service.ts enqueue() is stubbed. The partner team's REST API

# endpoint URL and payload format must be confirmed before this can be

# implemented. The service is designed to be filled in with minimal changes.

#

# 6. ADMIN PAGE

# No admin UI page exists yet. The backend admin_middleware.ts and all

# necessary API routes exist. A /admin page needs to be built with user

# management (list/search users, change roles) and course management UI.

#

# 7. SYSTEM STATUS INDICATORS

# dashboard.vue shows hardcoded status indicators. Wire to actual health

# check endpoints: GET /api/health for backend, partner team endpoint for

# job queue status.
