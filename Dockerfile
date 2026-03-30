FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/astro.config.mjs ./

# Use node package manager bin
COPY --from=deps /app/node_modules ./node_modules

# Create data directory for SQLite and set ownership
RUN mkdir -p /app/data && chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

EXPOSE 3000
CMD ["node", "dist/server/entry.mjs"]
