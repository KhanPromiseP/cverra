# ARG NX_CLOUD_ACCESS_TOKEN

# # --- Base Image ---
# FROM node:lts-bullseye-slim AS base
# ARG NX_CLOUD_ACCESS_TOKEN

# ENV PNPM_HOME="/pnpm"
# ENV PATH="$PNPM_HOME:$PATH"

# RUN corepack enable

# WORKDIR /app

# # --- Build Image ---
# FROM base AS build
# ARG NX_CLOUD_ACCESS_TOKEN

# COPY .npmrc package.json pnpm-lock.yaml ./
# COPY ./tools/prisma /app/tools/prisma
# RUN pnpm install --frozen-lockfile

# COPY . .

# ENV NX_CLOUD_ACCESS_TOKEN=$NX_CLOUD_ACCESS_TOKEN

# RUN pnpm run build

# # --- Release Image ---
# FROM base AS release
# ARG NX_CLOUD_ACCESS_TOKEN

# RUN apt update && apt install -y dumb-init --no-install-recommends && rm -rf /var/lib/apt/lists/*

# COPY --chown=node:node --from=build /app/.npmrc /app/package.json /app/pnpm-lock.yaml ./
# RUN pnpm install --prod --frozen-lockfile

# COPY --chown=node:node --from=build /app/dist ./dist
# COPY --chown=node:node --from=build /app/tools/prisma ./tools/prisma
# RUN pnpm run prisma:generate

# ENV TZ=UTC
# ENV PORT=3000
# ENV NODE_ENV=production

# EXPOSE 3000

# CMD [ "dumb-init", "pnpm", "run", "start" ]


ARG NX_CLOUD_ACCESS_TOKEN

# --- Base Image ---
FROM node:lts-bullseye-slim AS base
ARG NX_CLOUD_ACCESS_TOKEN

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install Redis client tools (required for assistant health checks)
RUN apt update && apt install -y \
    dumb-init \
    redis-tools \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable

WORKDIR /app

# --- Build Image ---
FROM base AS build
ARG NX_CLOUD_ACCESS_TOKEN

COPY .npmrc package.json pnpm-lock.yaml ./
COPY ./tools/prisma /app/tools/prisma
RUN pnpm install --frozen-lockfile

COPY . .

ENV NX_CLOUD_ACCESS_TOKEN=$NX_CLOUD_ACCESS_TOKEN

RUN pnpm run build

# --- Release Image ---
FROM base AS release
ARG NX_CLOUD_ACCESS_TOKEN

COPY --chown=node:node --from=build /app/.npmrc /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/tools/prisma ./tools/prisma
RUN pnpm run prisma:generate

# Copy node_modules with native binaries (important for Prisma)
COPY --chown=node:node --from=build /app/node_modules/.prisma /app/node_modules/.prisma
COPY --chown=node:node --from=build /app/node_modules/@prisma /app/node_modules/@prisma

# Create health check script for Redis
RUN echo '#!/bin/sh\n\
if [ -n "$REDIS_HOST" ]; then\n\
  if [ -n "$REDIS_PASSWORD" ]; then\n\
    redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" -a "$REDIS_PASSWORD" ping | grep -q "PONG"\n\
  else\n\
    redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" ping | grep -q "PONG"\n\
  fi\n\
  exit $?\n\
else\n\
  exit 0\n\
fi' > /app/healthcheck-redis.sh && chmod +x /app/healthcheck-redis.sh

ENV TZ=UTC
ENV PORT=3000
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

EXPOSE 3000

# Health check for both app and Redis
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD sh -c "\
    /app/healthcheck-redis.sh && \
    node -e \"require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))\""

CMD [ "dumb-init", "pnpm", "run", "start" ]