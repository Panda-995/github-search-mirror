# syntax=docker/dockerfile:1
# Multi-stage build for Next.js application
# Supports linux/amd64 and linux/arm64 architectures

# ---- Base stage ----
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Dependencies stage ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# ---- Builder stage ----
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Production stage ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]
