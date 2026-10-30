# Intentionally vulnerable lab target. Not for production use.
FROM node:20-bookworm-slim

# Build tools for native modules (better-sqlite3) in case no prebuilt binary
# matches the platform.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --omit=dev

COPY backend ./backend
COPY frontend ./frontend

ENV PORT=3000
EXPOSE 3000

CMD ["node", "backend/server.js"]
