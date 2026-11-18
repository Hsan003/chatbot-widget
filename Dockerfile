# syntax=docker/dockerfile:1

# ── deps ──
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── dev: rebuilds dist/ on every change (Vite dev server isn't usable, see GUIDE.md §3.2) ──
FROM deps AS dev
CMD ["npx", "vite", "build", "--watch", "--mode", "development"]

# ── build: production bundle, API URL is baked in at build time ──
FROM deps AS build
ARG VITE_API_BASE_URL
ARG VITE_WIDGET_VERSION
COPY . .
RUN test -n "$VITE_API_BASE_URL" || (echo "VITE_API_BASE_URL build arg is required" && exit 1)
RUN npx tsc -b && npx vite build --mode production

# ── export: only the bundle, for `docker build --output` ──
FROM scratch AS export
COPY --from=build /app/dist/chat-assistant.iife.js /

# ── prod: optional self-hosting with nginx (Cloudflare Pages is the current host) ──
FROM nginx:1.27-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/
