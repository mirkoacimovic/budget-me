# 1. Base Image
FROM node:20-alpine AS builder

# 2. Workspace
WORKDIR /app

# 3. Dependencies
# We copy the specific package.json for the gateway
COPY apps/api-gateway/package*.json ./

# Install dependencies including devDependencies (needed for 'nest build')
RUN npm install

# 4. Copy Source
# We copy the gateway source code into the builder
COPY apps/api-gateway/ .

# 5. Build
# This now correctly finds the "build": "nest build" script
RUN npm run build

# 6. Production Run
FROM node:20-alpine
WORKDIR /app

# Copy built assets and only the necessary node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Ensure we are in production mode
ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "dist/main"]