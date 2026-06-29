# apps/api — Backend

API REST e gateway WebSocket. Unidade deployável e **autocontida** — fonte da verdade para persistência, auth, regras de jogo e validação.

**Documentação:** Swagger em `/api/docs` + `.md` por módulo. **Testes:** TDD obrigatório.

Ver também: [docs/README.md](docs/README.md) · [docs/padroes.md](../../docs/padroes.md)

## Responsabilidade

HTTP, WebSocket, PostgreSQL (Drizzle), Redis pub/sub, storage MinIO/R2 e **todas as regras de negócio autoritativas**.

## Stack

- NestJS
- Drizzle ORM + PostgreSQL
- Redis
- WebSocket (`@nestjs/websockets`)
- S3 SDK (MinIO / R2)
- Zod
- **@nestjs/swagger** — OpenAPI desde a Fase 0
- **Jest** — TDD (unit, integração, e2e)
- **prom-client** — métricas Prometheus
- **pino** — logs JSON

Ver [metricas.md](../../docs/metricas.md)

## Swagger (Fase 0 — não adiar)

Configuração na bootstrap (`main.ts`):

```typescript
// DocumentBuilder + SwaggerModule.setup('api/docs', app, document)
```

- UI: `GET /api/docs`
- Export: `pnpm openapi:export` → `openapi.json`
- Todo controller: `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`
- Todo DTO: `@ApiProperty` / `@ApiPropertyOptional`

WebSocket documentado em [docs/ws-events.md](docs/ws-events.md) (fora do Swagger).

## TDD — fluxo por feature

1. Criar `<modulo>.spec.ts` ou `<modulo>.e2e-spec.ts` — **teste falha**
2. Implementar service/controller mínimo — **teste passa**
3. Refatorar
4. Adicionar decorators Swagger
5. Atualizar `<modulo>.md`

Prioridade de cobertura:

- `src/rpg/dice/` — 100% unit (regras críticas)
- Services de domínio — unit + mock de repositório
- Controllers — integração/e2e com Supertest
- Gateway WS — testes com socket.io-client

## O que fica dentro deste app

| Área | Conteúdo |
|------|----------|
| `src/**/dto/` | DTOs + decorators Swagger |
| `src/**/<modulo>.md` | Doc do módulo |
| `src/gateway/` | WS + [ws-events.md](docs/ws-events.md) |
| `src/rpg/` | Ordem Paranormal (autoritativo) |
| `src/database/` | Drizzle + migrations |
| `docs/` | Índice e contratos WS |
| `test/` | e2e globais |

## O que será implementado

### Módulos base (Fase 0)

- `health` — healthcheck (primeiro endpoint no Swagger)
- `auth` — Google OAuth, JWT (TDD)
- `users` — perfil + campo `plan` (`free` | `premium`, default `free`)
- `@nestjs/terminus`: `GET /health`, `GET /health/ready`
- Logs `pino` (JSON) + `requestId`
- Primeiro teste e2e: `GET /health`

### Campanhas e personagens (Fase 1)

- CRUD TDD completo
- RBAC (`gm`, `player`, `spectator`)
- `src/rpg/character.schema.ts`
- Tags Swagger: `campaigns`, `characters`

### Documentos (Fase 2)

- CRUD + presigned URLs
- Tag `documents`

### Tempo real (Fase 3)

- Gateway WS TDD, Redis pub/sub
- Métricas: `ws_connections_active`, `ws_messages_total`, `ws_broadcast_duration_seconds`
- Atualizar [ws-events.md](docs/ws-events.md)

### Mapa (Fase 4) · Dados (Fase 5) · Quadro (Fase 6)

- Módulos com testes + Swagger + `.md` cada

### Métricas (Fase 7) — `src/metrics/`

- `GET /metrics` — Prometheus
- Dashboards Grafana; alertas operacionais

### Deploy (Fase 7)

- Dockerfile, CI com `test` + `openapi:export`, e2e HTTP

## Estrutura prevista

```
apps/api/
├── docs/
│   ├── README.md
│   └── ws-events.md
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.spec.ts
│   │   └── auth.md
│   ├── campaigns/
│   ├── characters/
│   ├── documents/
│   ├── map/
│   ├── dice/
│   ├── investigation/
│   ├── gateway/
│   ├── metrics/
│   ├── storage/
│   ├── rpg/
│   └── database/
├── test/                       # e2e
├── openapi.json                # gerado no build
├── drizzle/
└── api.md
```

## Ordem Paranormal (`src/rpg/`)

- Schema Zod + testes unitários extensivos
- `rollAttributePool`, `rollSkillTest`, `rollFree`
- Anti-cheat: recálculo server-side
- **Licença:** apenas terminologia geral permitida (Parte 3); sem textos oficiais dos livros; ver [conformidade-loreforge.md](../../docs/licenca-ordem-paranormal/conformidade-loreforge.md)

## Critérios de aceite

- Swagger live desde Fase 0 (`/api/docs`)
- TDD: nenhum service/controller novo sem teste precedente
- Todo módulo com `<modulo>.md` atualizado
- `pnpm test` e `pnpm test:e2e` passando
- Zero imports de `apps/web`
- Auth, CRUD, WS (4 clientes), rolagens validadas server-side
- `GET /users/me` retorna `plan`; default `free` no MVP
- `/health`, `/health/ready`, `/metrics` operacionais
