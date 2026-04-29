FROM node:24-trixie-slim AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile --filter ./backend...

COPY backend ./backend
RUN pnpm --filter ./backend build

FROM node:24-trixie-slim
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile --prod --filter ./backend...

COPY --from=build /app/backend/build ./backend/build
EXPOSE 3333

CMD ["node", "backend/bin/server.js"]