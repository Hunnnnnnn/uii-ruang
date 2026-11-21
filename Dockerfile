# Multi-stage Dockerfile for UIIRuang Frontend (Vite + React)

# ---------------------------------------------
# Stage 1: Build Application
# ---------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Optional build arg for API Base URL
ARG VITE_API_BASE_URL=http://100.73.128.8:8085/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build production bundle
RUN npm run build

# ---------------------------------------------
# Stage 2: Serve with Production Nginx
# ---------------------------------------------
FROM nginx:alpine

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA fallback routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
