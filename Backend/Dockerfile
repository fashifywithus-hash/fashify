# Build stage
FROM node:20-alpine AS build

# Install TypeScript globally (as per user's pattern)
RUN npm install typescript@5.8.3 -g

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm config set audit false && \
    npm install --no-audit

# Copy source code
COPY . .

# Run TypeScript compilation
RUN tsc

# Verify build output exists
RUN test -d dist && test -f dist/server.js || (echo "Build failed - dist/server.js not found" && exit 1)

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm config set audit false && \
    npm install --only=production --no-audit && \
    npm cache clean --force

# Copy built application from build stage
COPY --from=build /usr/src/app/dist ./dist

# Copy CSV file (needed for recommendations)
COPY --from=build /usr/src/app/Item-attributes.csv ./Item-attributes.csv

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD [ "node", "dist/server.js" ]
