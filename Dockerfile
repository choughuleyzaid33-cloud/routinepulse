# RoutinePulse 24/7 Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm --prefix client install
RUN npm --prefix server install

# Copy source code
COPY client/ ./client/
COPY server/ ./server/

# Build client production bundle
RUN npm --prefix client run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY server/package*.json ./server/
RUN npm --prefix server install --production

# Copy built frontend and server code
COPY --from=builder /app/client/dist ./client/dist
COPY server/ ./server/

# Create persistent data directory
RUN mkdir -p /app/server/data /app/server/data/baileys_auth

EXPOSE 5000

CMD ["node", "server/src/index.js"]
