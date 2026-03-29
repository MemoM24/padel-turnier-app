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

# Install production dependencies only (mysql2, drizzle-orm, express, etc.)
RUN pnpm install --frozen-lockfile --prod

# Copy the built server bundle from builder stage
COPY --from=builder /app/dist ./dist

# Copy drizzle migration files (needed at runtime for db:push)
COPY --from=builder /app/drizzle ./drizzle

# Expose the port Railway will assign via $PORT env var
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/api/health || exit 1

# Start the production server
CMD ["node", "dist/index.js"]
