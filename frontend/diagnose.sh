#!/bin/bash
echo "=== Node version ==="
node --version

echo "=== Port 3000 status ==="
lsof -i :3000 2>/dev/null || echo "Port 3000 is free"

echo "=== Nuxt version ==="
cd /workspaces/job-queue-manager/frontend && npx nuxt --version

echo "=== Package check ==="
cat package.json | grep -E '"nuxt"|"@nuxt|"pinia|"vue"'

echo "=== .nuxt exists ==="
ls .nuxt/ 2>/dev/null && echo ".nuxt OK" || echo ".nuxt MISSING — run pnpm nuxt prepare"

echo "=== Env check ==="
cat .env 2>/dev/null || echo "No .env file — copy from .env.example"

echo "=== Try starting nuxt with verbose ==="
pnpm nuxt dev --port 3000 2>&1 &
NUXT_PID=$!
sleep 8
echo "Nuxt PID: $NUXT_PID"
kill $NUXT_PID 2>/dev/null