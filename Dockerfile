# =================== Builder ===================
FROM node:18-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
RUN pnpm install
RUN pnpm -r build

# =================== Backend ===================
FROM node:18-alpine AS backend
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
RUN pnpm install --prod --filter=@url-shortener/backend...
WORKDIR /app/packages/backend
EXPOSE 3001

# =================== Frontend ===================
FROM node:18-alpine AS frontend
WORKDIR /app
COPY --from=builder /app/packages/frontend/dist .
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", ".", "-l", "3000"]
