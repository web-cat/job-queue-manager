#!/bin/bash
# .devcontainer/setup.sh
# Run this once after opening the dev container for the first time.
# Usage: bash .devcontainer/setup.sh

set -e

echo ""
echo "================================================="
echo "  job-queue-manager — dev environment setup"
echo "================================================="

# 1. Verify pnpm
echo ""
echo "[1/4] Checking pnpm..."
pnpm --version && echo "pnpm OK" || (echo "ERROR: pnpm not found. Run: npm install -g pnpm" && exit 1)

# 2. Install all workspace dependencies
echo ""
echo "[2/4] Installing workspace dependencies..."
pnpm install

# 3. Verify kubectl + cluster connection
echo ""
echo "[3/4] Checking cluster connection..."
if [ ! -f "/workspaces/job-queue-manager/discovery.yaml" ]; then
  echo "WARNING: discovery.yaml not found in project root."
  echo "  Download it from Rancher and place it at the project root before running migrations."
else
  kubectl get pods -n 22012-job-queue-manager > /dev/null 2>&1 \
    && echo "Cluster connection OK" \
    || echo "WARNING: Could not reach cluster. Check discovery.yaml or VPN."
fi

# 4. Copy .env if it doesn't exist
echo ""
echo "[4/4] Checking .env files..."
if [ ! -f "/workspaces/job-queue-manager/backend/.env" ]; then
  cp /workspaces/job-queue-manager/backend/.env.example /workspaces/job-queue-manager/backend/.env
  echo "Created backend/.env from .env.example — fill in any missing values."
else
  echo "backend/.env already exists, skipping."
fi

echo ""
echo "================================================="
echo "  Setup complete! Next steps:"
echo ""
echo "  Terminal 1 — start Postgres tunnel:"
echo "    kubectl port-forward svc/postgres 5432:5432 -n 22012-job-queue-manager"
echo ""
echo "  Terminal 2 — run migrations:"
echo "    cd backend && node ace migration:run"
echo ""
echo "  Terminal 3 — start backend:"
echo "    cd backend && node ace serve --watch"
echo ""
echo "  Terminal 4 — start frontend:"
echo "    cd frontend && pnpm dev"
echo "================================================="