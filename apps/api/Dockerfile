# syntax=docker/dockerfile:1

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm build

FROM deps AS development
ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "start:dev"]

FROM base AS production
ENV NODE_ENV=production

RUN apk add --no-cache wget \
  && addgroup --system --gid 1001 nestjs \
  && adduser --system --uid 1001 --ingroup nestjs nestjs

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build --chown=nestjs:nestjs /app/dist ./dist

USER nestjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "dist/main.js"]
