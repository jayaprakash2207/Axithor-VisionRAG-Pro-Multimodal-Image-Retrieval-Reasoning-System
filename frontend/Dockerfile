# ── Build stage ────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build-time API URL
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline 2>/dev/null || npm install

COPY . .

# Build the production bundle
RUN npm run build


# ── Runtime stage — serve with lightweight server ──
FROM node:20-alpine AS runtime

LABEL maintainer="Image RAG Team"
LABEL description="Multimodal Image RAG Frontend — React + Tailwind"

WORKDIR /app

# Install a lightweight static server
RUN npm install -g serve@14

# Copy the built assets
COPY --from=builder /app/dist /app/dist

ENV NODE_ENV=production

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:5173/ || exit 1

CMD ["serve", "-s", "dist", "-l", "5173"]
