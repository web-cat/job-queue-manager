#!/bin/bash
# Quick script to test Docker builds locally before committing

set -e

echo "🔨 Testing Frontend Docker build..."
docker build -f frontend/Dockerfile -t job-queue-manager-frontend:test . > /dev/null
echo "✅ Frontend build successful"

echo "🔨 Testing Backend Docker build..."
docker build -f backend/Dockerfile -t job-queue-manager-backend:test . > /dev/null
echo "✅ Backend build successful"

echo ""
echo "✨ All builds passed! Safe to commit/push."
