# syntax=docker/dockerfile:1

# --- deps: install production + build deps ---
FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- builder: produce the standalone output ---
FROM node:26-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1
# NEXT_PUBLIC_* values are baked into the client bundle at build time, so
# prod builds must pass them as build args (see druthers-infra launch runbook).
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
RUN npm run build

# --- runner: minimal image running the standalone server as non-root ---
FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Harden the runtime image: patch OS crypto libs and drop npm/npx. The Next.js
# standalone server runs via `node server.js` and never invokes npm, so npm's
# bundled (and vulnerable) deps — tar, minimatch, sigstore, glob, cross-spawn —
# should not ship in the runtime image.
RUN apk -U upgrade --no-cache libcrypto3 libssl3 \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
