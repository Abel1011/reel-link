# ============================================================
# Animated Story Creator — Multi-stage Docker build
# Single container: Hono API + React SPA
# ============================================================

# --- Stage 1: Install all dependencies ---
FROM node:22-slim AS deps
WORKDIR /app

# better-sqlite3 requires native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy workspace root + both package.json files for npm workspaces
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN npm ci

# --- Stage 2: Build the React client ---
FROM deps AS client-build
WORKDIR /app

COPY client/ ./client/
RUN npm run build --workspace=client

# --- Stage 3: Production runtime ---
FROM node:22-slim AS runtime
WORKDIR /app

# better-sqlite3 needs libstdc++ at runtime
RUN apt-get update && apt-get install -y libstdc++6 && rm -rf /var/lib/apt/lists/*

# Copy server source + node_modules (includes workspace hoisted deps)
COPY server/ ./server/
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules 

# Copy client build output
COPY --from=client-build /app/client/dist ./client/dist

# Copy HyperFrames public assets (used by video composition)
COPY client/public/hyperframes ./client/public/hyperframes

# Copy root package.json (needed for workspace resolution)
COPY package.json ./

# Create directories for runtime data
RUN mkdir -p server/data server/assets server/logs

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/server
CMD ["npx", "tsx", "src/index.ts"]
