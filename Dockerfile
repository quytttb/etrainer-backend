# Use Node.js LTS Alpine image for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S etrainer -u 1001

# Change ownership of the app directory
RUN chown -R etrainer:nodejs /app
USER etrainer

# Expose port
EXPOSE 8080

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').request('http://localhost:8080/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).end()"

# Start the application
CMD ["node", "server.js"]
