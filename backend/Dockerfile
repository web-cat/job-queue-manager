FROM node:24-trixie-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN node ace build 

FROM node:24-trixie-slim
WORKDIR /app

COPY --from=build /app/build ./
RUN npm ci --omit=dev
EXPOSE 3333

CMD ["node", "bin/server.js"]