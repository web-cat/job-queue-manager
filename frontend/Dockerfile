# ── Stage 1: Build ───────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace config first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy frontend package.json
COPY frontend/package.json ./frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter frontend

# Copy frontend source
COPY frontend/ ./frontend/

# Build the frontend
# NUXT_PUBLIC_API_BASE points to the cluster backend at build time
ARG NUXT_PUBLIC_API_BASE=https://webcatmaxxers.discovery.cs.vt.edu
ENV NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE}

RUN pnpm --filter frontend build

# ── Stage 2: Serve ────────────────────────────────────────────────────
FROM node:22-bookworm-slim

WORKDIR /app

# Copy built output from build stage
COPY --from=build /app/frontend/.output ./

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server/index.mjs"]