FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production PORT=8080 DATABASE_URL=file:/data/patchline.db
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY skills ./skills
COPY package.json ./
# Runs as root until we confirm who owns Maritime's /data mount (then switch to USER node).
EXPOSE 8080
CMD ["node", "dist/server.js"]
