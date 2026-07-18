# LoreForge

LoreForge is a private web-based virtual tabletop for Ordem Paranormal RPG. It supports one Campaign GM, invitation-only Campaign Players, authoritative character sheets, Campaign State, NPC Sheets, and anonymous spectator links.

The API is authoritative for rules, permissions, persistence, and game calculations. The web application communicates with it only through REST/OpenAPI and WebSocket contracts.

## Delivered features

- Google OAuth authentication and secure JWT sessions.
- Guided player-character creation with server-side rules validation.
- Staged Permanent Sheet Data edits and separate Campaign State.
- A single-GM campaign model, player invitations, and campaign-character lifecycle.
- Independently created NPC Sheets that a GM attaches once to a campaign.
- Revocable anonymous spectator links exposing only published campaign details.
- Private image storage served through authenticated API routes.

Planned maps, dice rolling, and other future tabletop features are intentionally not described as delivered functionality.

## Local setup

The applications are independent and have separate lockfiles. Start local infrastructure first:

```bash
docker compose -f docker-compose.local.yml up -d
```

Then install and run each application in a separate terminal:

```bash
cd apps/api
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm start:dev
```

```bash
cd apps/web
pnpm install --frozen-lockfile
pnpm dev
```

| Service | URL |
| --- | --- |
| Web | http://localhost:3001 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| MinIO console | http://localhost:9001 |

## Verification

API integration tests require a dedicated, migrated PostgreSQL database whose name ends in `_test`; never point `DATABASE_URL` at a development or production database.

```bash
cd apps/api
pnpm format:check
pnpm typecheck
pnpm build
pnpm test --runInBand
pnpm db:migrate
pnpm test:e2e --runInBand
```

```bash
cd apps/web
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

See [the workflow guide](docs/workflows.md) for the supported user flows.

## License and disclaimer

LoreForge follows the [Ordem Paranormal Community License v1.0](https://ordemparanormal.com.br/licenca). It is an unofficial tool and is not affiliated with, partnered with, or endorsed by Rafael "Cellbit" Lange or Jambô Editora.
