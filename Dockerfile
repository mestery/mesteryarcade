# Build stage: build static assets (if needed in the future)
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
# Build step placeholder (current static files don't need build)
RUN echo "No build required for static arcade"

# Production stage: serve with nginx
FROM nginx:alpine
LABEL maintainer="Mestery Arcade"
LABEL description="Mestery Arcade - Web-based arcade game collection"

# Copy static files to nginx HTML directory
COPY --from=builder /app/ /usr/share/nginx/html/

# Copy nginx configuration if it exists (optional)
COPY nginx.conf* /etc/nginx/conf.d/

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://localhost:80/ || exit 1

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
