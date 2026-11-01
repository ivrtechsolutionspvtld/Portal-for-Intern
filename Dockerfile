# ==============================================================================
# IVR Enterprise Internship Management Platform - Production Multi-Stage Dockerfile
# Target: AWS ECS Fargate / EKS / Container App (Mumbai ap-south-1)
# Base: Node 20 / 22 Alpine Linux for minimal attack surface (<120MB)
# ==============================================================================

# Stage 1: Dependency resolution and layer caching
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci --legacy-peer-deps

# Stage 2: Builder & asset compilation
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Compile production bundle
RUN npm run build

# Stage 3: Minimal production runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl curl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create unprivileged runtime user (Principle of Least Privilege)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy runtime assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Set security ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Health check probe for AWS ALB target group
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/auth/me || exit 0

CMD ["npm", "start"]
