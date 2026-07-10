# LoreForge

LoreForge is a virtual tabletop (VTT) web platform for tabletop RPGs. Its goal is to centralize every aspect of a game session in a single place: campaigns, character sheets, GM notes, a real-time battle map, dice rolling, and an investigation board.

The initial supported game system is **Ordem Paranormal RPG**, in compliance with the Ordem Paranormal Community License v1.0.

## Key Features

- Google OAuth authentication.
- Campaigns with Game Master, Player, and Spectator roles.
- Character sheets with authoritative server-side validation.
- Rich-text GM documents with visibility controls.
- Real-time tabletop map with tokens, grid, fog of war, zoom, and pan.
- Presentation mode in a separate, clean, ad-free browser tab.
- Server-synchronized dice rolling with authoritative calculations.
- Investigation board with nodes, connections, tags, and color coding.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | Next.js, TypeScript, Tailwind CSS, Zustand, TanStack Query |
| Specialized UI | PixiJS, React Flow, TipTap |
| Backend | NestJS, Drizzle ORM, PostgreSQL, Redis, WebSocket |
| Storage | MinIO for development, Cloudflare R2 for production |
| Quality Assurance | Jest, Vitest, React Testing Library, MSW, Cypress |
| Operations | Docker, Coolify, Cloudflare, Prometheus/Grafana |

## Project Structure

```text
LoreForge/
  apps/
    web/   # Next.js frontend
    api/   # NestJS backend
```

Each application is self-contained. No code is shared directly between the frontend and backend; integration is performed exclusively through REST/OpenAPI and WebSocket. The API is the authoritative source for business rules, validation, persistence, and permissions.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose

```bash
pnpm install
docker compose -f docker-compose.local.yml up -d
pnpm --filter @loreforge/api db:migrate
pnpm dev
```

### Available Services

| Service | URL |
|---------|-----|
| Web | http://localhost:3001 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| MinIO | http://localhost:9001 |

## Licenses

- Source code: [Apache License 2.0](LICENSE).
- Ordem Paranormal RPG compatibility: [Ordem Paranormal Community License v1.0](https://ordemparanormal.com.br/licenca).

LoreForge is an unofficial tool and is not affiliated with, partnered with, or endorsed by Rafael "Cellbit" Lange, Jambô Editora, or Ordem Paranormal.
```