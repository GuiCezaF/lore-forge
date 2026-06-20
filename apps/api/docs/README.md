# apps/api — Documentação

Índice da documentação do backend. Contrato REST interativo em **`/api/docs`** (Swagger UI).

## Índice de módulos

Documentação `.md` vive ao lado do código em `src/<modulo>/<modulo>.md`.

| Módulo        | Doc                                  | Swagger tag     | Fase |
| ------------- | ------------------------------------ | --------------- | ---- |
| health        | `src/health/health.md`               | `health`        | 0    |
| auth          | `src/auth/auth.md`                   | `auth`          | 0    |
| users         | `src/users/users.md`                 | `users`         | 0    |
| campaigns     | `src/campaigns/campaigns.md`         | `campaigns`     | 1    |
| characters    | `src/characters/characters.md`       | `characters`    | 1    |
| documents     | `src/documents/documents.md`         | `documents`     | 2    |
| gateway       | `src/gateway/gateway.md`             | —               | 3    |
| map           | `src/map/map.md`                     | `map`           | 4    |
| dice          | `src/dice/dice.md`                   | `dice`          | 5    |
| investigation | `src/investigation/investigation.md` | `investigation` | 6    |
| metrics       | `src/metrics/metrics.md`             | `metrics`       | 7    |
| rpg           | `src/rpg/rpg.md`                     | —               | 1+   |

## WebSocket

Eventos documentados em [ws-events.md](ws-events.md) — complementa o Swagger (só REST).

## OpenAPI

- **Dev:** http://localhost:3001/api/docs
- **Export:** `pnpm openapi:export` → `apps/api/openapi.json`
- Consumido por `apps/web` para tipagem do cliente HTTP

## Testes

Ver [docs/padroes.md](../../../docs/padroes.md). Backend segue **TDD**.

```bash
pnpm --filter @loreforge/api test          # unit + integração
pnpm --filter @loreforge/api test:e2e       # e2e HTTP
pnpm --filter @loreforge/api test:watch      # TDD
```

## Visão geral do app

[api.md](../api.md)
