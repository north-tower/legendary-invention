# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package and lock files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy the built application and necessary source files for seeding/migrations
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/tsconfig*.json ./

# Ensure the environment is set to production
ENV NODE_ENV=production

# Expose the application port
EXPOSE 6900

# Start the application
CMD ["npm", "run", "start:prod"]
