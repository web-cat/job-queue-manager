# ═══════════════════════════════════════════════════════════════════════════════

# CAS AUTHENTICATION

# ═══════════════════════════════════════════════════════════════════════════════

#

# OVERVIEW:

# CAS (Central Authentication Service) is VT's university-wide single sign-on

# system. Your app uses the VT CS CAS server (login.cs.vt.edu) which is

# pre-registered with the Discovery cluster.

#

# IMPORTANT: CAS only works on the Discovery cluster. It will NOT work on

# localhost because VT CAS validates the service URL against a whitelist.

# Always test CAS on the deployed cluster, not locally.

#

# VT CS CAS ENDPOINTS:

# Login: https://login.cs.vt.edu/cas/login

# Validate: https://login.cs.vt.edu/cas/serviceValidate

# Logout: https://login.cs.vt.edu/cas/logout

#

# FLOW:

# 1. User visits GET /api/auth/cas

# 2. Backend redirects to login.cs.vt.edu/cas/login?service=<callback_url>

# 3. User authenticates at VT

# 4. CAS redirects to /api/auth/cas/callback?ticket=ST-xxx

# 5. Backend validates ticket via serviceValidate endpoint

# 6. CAS returns user PID and attributes as XML

# 7. Backend finds or creates user via identity table (provider='cas')

# 8. Backend issues API token (24hr expiry)

# 9. Backend redirects to frontend: /auth/callback?token=xxx&pid=yyy

# 10. Frontend stores token and uses it for all subsequent API calls

#

# ATTRIBUTES RETURNED BY VT CS CAS:

# cas:user → VT PID (e.g. thomask88) — always present

# cas:givenName → First name — may be null

# cas:sn → Last name (surname) — may be null

# cas:mail → Email address — may be null (fallback: pid@vt.edu)

#

# VERIFIED WORKING: Tested on Discovery cluster April 2026.

# User thomask88 successfully authenticated and created in database.

FILE: backend/app/services/cas_service.ts
PURPOSE: Handles all direct communication with the VT CS CAS server.
Encapsulates the CAS protocol so the controller stays clean.
Builds redirect URLs, validates tickets, and parses XML responses.
DESIGN: Written as a pure service with no AdonisJS-specific dependencies
so it can be tested independently. Uses axios for HTTP and fast-xml-parser
for XML parsing — no passport or external CAS library needed. The XML
parsing handles the CAS 2.0 protocol response format directly.
CAS_SERVICE_URL defaults to empty string if not set — the app will still
start but CAS login will not work until the env var is configured.
DEPENDENCIES: axios, fast-xml-parser, start/env.ts
CONSUMERS: cas_controller.ts
NEXT TEAM NOTES: If VT changes their CAS server or attributes, this is the
only file that needs updating. The parseValidationResponse() method handles
the XML structure — if attribute names change, update the keys there.
To switch from VT CS CAS to university-wide CAS, change CAS_BASE_URL in
.env to https://login.vt.edu/profile/cas — no code changes needed.
ENV VARS REQUIRED:
CAS_BASE_URL=https://login.cs.vt.edu/cas
CAS_SERVICE_URL=https://webcatmaxxers.discovery.cs.vt.edu/api/auth/cas/callback
STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/controllers/cas_controller.ts
PURPOSE: Handles the three CAS SSO HTTP routes — redirect, callback, logout.
Orchestrates the full CAS flow by calling CasService and managing the
user creation/lookup in the identity table.
DESIGN: On callback, the controller first checks for an existing identity
record (provider='cas', uid=<PID>). If found, it loads the linked user.
If not, it uses User.firstOrCreate to find by email or create a new account.
A new identity record is always created when a new CAS user logs in for the
first time. The token is passed to the frontend via redirect query string
rather than a JSON response because the CAS callback is a browser redirect,
not an AJAX request.
globalRoleId is hardcoded to 2 (Student) for new CAS users — assumes the
global_role table has been seeded with Admin (id=1) and Student (id=2).
DEPENDENCIES: cas_service.ts, user.ts, identity.ts
CONSUMERS: routes.ts
NEXT TEAM NOTES: The frontend must handle the /auth/callback?token=xxx&pid=yyy
redirect by extracting the token from the query string and storing it
(localStorage or cookie) for use in subsequent API requests.
If firstName/lastName are null after CAS login (VT CS CAS doesn't always
return these), you can optionally query VT's LDAP directory for the user's
full name using their PID.
The TODO in this file: seed global_role before CAS users can log in.
Run in Adminer:
INSERT INTO global_role (name, can_manage_all_courses,
can_edit_system_configuration, builtin)
VALUES ('Admin', true, true, true), ('Student', false, false, true);
STATUS: complete [NEEDS INLINE DOCS — user creation flow]

# ─────────────────────────────────────────────────────────────────────────────

# REQUIRED PACKAGES (install in backend/):

# npm install axios fast-xml-parser

#

# REQUIRED ENV VARS (add to backend/.env and backend-env Kubernetes secret):

# CAS_BASE_URL=https://login.cs.vt.edu/cas

# CAS_SERVICE_URL=https://webcatmaxxers.discovery.cs.vt.edu/api/auth/cas/callback

# FRONTEND_URL=https://webcatmaxxers.discovery.cs.vt.edu

# ═══════════════════════════════════════════════════════════════════════════════

# KUBERNETES DEPLOYMENT

# ═══════════════════════════════════════════════════════════════════════════════

#

# CLUSTER: VT Discovery Kubernetes cluster

# NAMESPACE: 22012-job-queue-manager

# CLUSTER URL: https://cloud.cs.vt.edu

# KUBECONFIG: discovery.yaml (gitignored — each team member downloads their own

# from the Rancher UI at cloud.cs.vt.edu)

#

# RUNNING SERVICES:

# backend → AdonisJS API (ClusterIP:3333, exposed via backend-ingress)

# postgres → PostgreSQL database (ClusterIP:5432, internal only)

# adminer → Database UI (exposed via adminer-ingress at /db)

# minio → Object storage for submitted files (ClusterIP:9000/9001)

#

# IMAGE REGISTRY: container.cs.vt.edu/timwilson/job-queue-manager-images/

# backend:prod_latest → latest production build

# backend:vX.Y.Z → semantic version tags

#

# CI/CD: GitHub Actions (.github/workflows/build-images.yml)

# Triggers on push to main branch only.

# Builds backend Docker image and pushes to container.cs.vt.edu.

# Uses semantic versioning based on commit message patterns:

# "Major" or "!:" in commit → major version bump

# "Feature" in commit → minor version bump

# anything else → patch version bump

#

# DEPLOYMENT PROCESS:

# 1. Merge feature branch → dev → main (via PR)

# 2. GitHub Actions builds and pushes image automatically

# 3. Restart the backend deployment to pull new image:

# kubectl rollout restart deployment/backend -n 22012-job-queue-manager

# 4. Run migrations if schema changed:

# kubectl exec -it deployment/backend -n 22012-job-queue-manager \

# -- node ace migration:run

#

# INGRESS CONFIGURATION:

# adminer-ingress → webcatmaxxers.discovery.cs.vt.edu/db → adminer:8080

# backend-ingress → webcatmaxxers.discovery.cs.vt.edu/ → backend:3333

# → webcatmaxxers.discovery.cs.vt.edu/api → backend:3333

#

# SECRETS:

# backend-env → all backend environment variables (APP*KEY, DB*\*, etc.)

# postgres-credentials → postgres username/password

# minio-secret → minio access key and secret key

# registry-credential → VT container registry pull secret

#

# ENVIRONMENT VARIABLES (stored in backend-env secret):

# APP_KEY → AdonisJS encryption key (shared across all team members)

# DB_HOST → postgres (Kubernetes service name)

# DB_PORT → 5432

# DB_USER → user

# DB_PASSWORD → (see Kubernetes secret)

# DB_DATABASE → postgres

# HOST → 0.0.0.0 (listen on all interfaces in container)

# PORT → 3333

# NODE_ENV → production

# LOG_LEVEL → info

#

# DIRECT ENV VARS (set on deployment, not in secret):

# CAS_BASE_URL → https://login.cs.vt.edu/cas

# CAS_SERVICE_URL → https://webcatmaxxers.discovery.cs.vt.edu/api/auth/cas/callback

# FRONTEND_URL → https://webcatmaxxers.discovery.cs.vt.edu

#

# PERSISTENT VOLUMES:

# submissions → PersistentVolumeClaim mounted at /app/submissions

# Used for storing student submitted zip files.

# Managed by MinIO object storage service.

#

# USEFUL KUBECTL COMMANDS:

#

# # View running pods

# kubectl get pods -n 22012-job-queue-manager

#

# # View backend logs

# kubectl logs deployment/backend -n 22012-job-queue-manager --follow

#

# # Run migrations

# kubectl exec -it deployment/backend -n 22012-job-queue-manager \

# -- node ace migration:run

#

# # Open AdonisJS REPL inside container

# kubectl exec -it deployment/backend -n 22012-job-queue-manager \

# -- node ace repl

#

# # Update a secret value

# kubectl patch secret backend-env -n 22012-job-queue-manager \

# --type=json \

# -p='[{"op":"replace","path":"/data/KEY","value":"'$(echo -n 'value' | base64)'"}]'

#

# # Restart backend after image update

# kubectl rollout restart deployment/backend -n 22012-job-queue-manager

#

# # Check deployment env vars

# kubectl describe deployment/backend -n 22012-job-queue-manager | grep -A 20 "Environment:"

#

# # Port forward postgres for local development

# kubectl port-forward svc/postgres 5432:5432 -n 22012-job-queue-manager

#

# MINIO OBJECT STORAGE:

# MinIO is running in the cluster and provides S3-compatible object storage.

# It is the solution for storing student submitted zip files.

# Access the MinIO console at webcatmaxxers.discovery.cs.vt.edu (obj-storage service).

# Credentials are stored in the minio-secret Kubernetes secret.

# TODO: Integrate MinIO into the submission upload flow in submissions_controller.ts

#

# NEXT TEAM NOTES:

# The frontend deployment does not exist yet — Nuxt 4 needs to be built,

# containerized, and deployed as a separate pod with its own ingress rule.

# The frontend ingress should route / to the Nuxt service, while /api

# continues to route to the backend service.

# A frontend Dockerfile will need to be created in the frontend/ directory

# and a build step added to build-images.yml.

# ═══════════════════════════════════════════════════════════════════════════════

# INLINE DOCUMENTATION PASS — UPDATED FILES TO REVISIT

# ═══════════════════════════════════════════════════════════════════════════════

#

# Added since last pass:

#

# NEW — CRITICAL:

# backend/app/services/cas_service.ts

# — parseValidationResponse() needs comments explaining XML structure

# — validateTicket() needs error handling documentation

# backend/app/controllers/cas_controller.ts

# — callback() method flow needs step-by-step inline comments

# — globalRoleId hardcoding needs explanation and seed requirement noted

#

# NEW — HIGH PRIORITY:

# backend/start/env.ts

# — CAS vars marked optional — explain why and the implications
