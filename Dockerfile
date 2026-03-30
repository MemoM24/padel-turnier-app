# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

# Copy dependency manifests first (layer cache)
COPY package.json pnpm-lock.yaml* ./

# Install ALL dependencies (including devDeps needed for build)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the server bundle
# Output: dist/index.js (ESM bundle, all server deps inlined except node_modules)
RUN pnpm build

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml* ./

# Install ALL dependencies (prod + dev needed for drizzle-kit migrations)
RUN pnpm install --frozen-lockfile

# Copy the built server bundle from builder stage
COPY --from=builder /app/dist ./dist

# Copy drizzle migration files and config (needed for db:push at runtime)
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Copy start script
COPY docker-start.sh ./docker-start.sh
RUN chmod +x ./docker-start.sh

# Expose the port Railway will assign via $PORT env var
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=5 \
  CMD wget -qO- http://localhost:${PORT:-3000}/api/health || exit 1

# Start via script that runs migrations first
CMD ["sh", "./docker-start.sh"]
