#!/bin/bash
# .devcontainer/setup.sh
#
# PURPOSE: One-time setup script that runs after the dev container is first opened.
#   Verifies cluster connectivity, installs workspace dependencies, and copies
#   .env.example to .env if not already present.
#
# DESIGN: Intentionally simple bash script rather than a complex tool. Designed
#   to be idempotent — safe to run multiple times without side effects.
#
# DEPENDENCIES: kubectl (installed in container), pnpm (installed in postCreateCommand),
#   discovery.yaml in project root
#
# CONSUMERS: Team members on first container setup
#
# NEXT TEAM NOTES: If onboarding steps change (new env vars, new services, etc.)
#   update this script so new team members get correct setup automatically.
#
# STATUS: complete

set -e

echo ""
echo "================================================="
echo "  job-queue-manager — dev environment setup"
echo "================================================="

# 1. Verify pnpm
echo ""
echo "[1/5] Checking pnpm..."
pnpm --version && echo "pnpm OK" || (echo "ERROR: pnpm not found. Run: npm install -g pnpm" && exit 1)

# 2. Install all workspace dependencies
echo ""
echo "[2/5] Installing workspace dependencies..."
pnpm install

# 3. Verify kubectl + cluster connection
echo ""
echo "[3/5] Checking cluster connection..."
if [ ! -f "/workspaces/job-queue-manager/discovery.yaml" ]; then
  echo "WARNING: discovery.yaml not found in project root."
  echo "  Download it from Rancher at cloud.cs.vt.edu and place it at the project root."
  echo "  You will not be able to run migrations or test CAS auth without it."
else
  kubectl get pods -n 22012-job-queue-manager > /dev/null 2>&1 \
    && echo "Cluster connection OK" \
    || echo "WARNING: Could not reach cluster. Check discovery.yaml or your internet connection."
fi

# 4. Copy .env if it doesn't exist
echo ""
echo "[4/5] Checking backend .env..."
if [ ! -f "/workspaces/job-queue-manager/backend/.env" ]; then
  cp /workspaces/job-queue-manager/backend/.env.example /workspaces/job-queue-manager/backend/.env
  echo "Created backend/.env from .env.example"
  echo "  NOTE: DB_PASSWORD is not in .env.example for security reasons."
  echo "  Get it from a teammate or from the Kubernetes secret:"
  echo "    kubectl get secret backend-env -n 22012-job-queue-manager -o jsonpath='{.data.DB_PASSWORD}' | base64 --decode"
else
  echo "backend/.env already exists, skipping."
fi

# 5. Verify backend builds cleanly
echo ""
echo "[5/5] Checking backend TypeScript build..."
cd /workspaces/job-queue-manager/backend
node ace build > /dev/null 2>&1 \
  && echo "Backend build OK" \
  || echo "WARNING: Backend build has errors. Run 'cd backend && node ace build' to see details."
cd /workspaces/job-queue-manager

echo ""
echo "================================================="
echo "  Setup complete! Next steps:"
echo ""
echo "  Terminal 1 — open Postgres tunnel (keep running):"
echo "    kubectl port-forward svc/postgres 5432:5432 -n 22012-job-queue-manager"
echo ""
echo "  Terminal 2 — run migrations (only if schema changed):"
echo "    cd backend && node ace migration:run"
echo ""
echo "  Terminal 3 — start backend:"
echo "    cd backend && node ace serve --watch"
echo ""
echo "  Terminal 4 — start frontend:"
echo "    cd frontend && pnpm dev"
echo ""
echo "  Cluster URLs:"
echo "    API:        https://webcatmaxxers.discovery.cs.vt.edu/api"
echo "    CAS Login:  https://webcatmaxxers.discovery.cs.vt.edu/api/auth/cas"
echo "    Adminer DB: https://webcatmaxxers.discovery.cs.vt.edu/db"
echo ""
echo "  NOTE: CAS authentication only works on the Discovery cluster."
echo "        It will not work on localhost."
echo ""
echo "  See DOCUMENTATION.md in the project root for full project docs."
echo "================================================="