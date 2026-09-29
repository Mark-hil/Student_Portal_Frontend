# Stage 1: Build the React SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure SPA fallback so client-side routes resolve to index.html
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
