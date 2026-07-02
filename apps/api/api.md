# apps/api — Backend

API REST e gateway WebSocket. Unidade deployável e **autocontida** — fonte da verdade para persistência, auth, regras de jogo e validação.

Este documento foi atualizado para refletir a adoção de Domain‑Driven Design (DDD) no backend. Isso implica organizar cada bounded context em camadas claras: API (presentation), Application (use‑cases), Domain (entities, value objects, repository interfaces) and Infrastructure (ORM/adapters).

**Documentação:** Swagger em `/api/docs` + `.md` por módulo. **Testes:** TDD obrigatório — com atenção especial a testes de domínio isolados.

Ver também: [docs/padroes.md](../../docs/padroes.md) · [AGENT.md](../../AGENT.md)

## Responsabilidade

HTTP, WebSocket, PostgreSQL (Drizzle), Redis pub/sub, storage MinIO/R2 e **todas as regras de negócio autoritativas** (modeladas no Domain).

## Stack

- NestJS
- Drizzle ORM + PostgreSQL
- Redis
- WebSocket (`@nestjs/websockets`)
- S3 SDK (MinIO / R2)
- Zod + class-validator
- **@nestjs/swagger** — OpenAPI desde a Fase 0
- **Jest** — TDD (unit, integração, e2e)
- **prom-client** — métricas Prometheus
- **pino** — logs JSON

Ver [docs/metricas.md](../../docs/metricas.md)

## DDD — regras práticas

- Domain é o dono das regras de negócio. Evitar dependências de infra no Domain.
- Repositórios: interfaces no Domain (ports); implementations em Infrastructure (adapters).
- UseCases (Application Services): coordenam transações, orquestram repositórios e publicam Domain Events.
- Controllers (Presentation): convertem HTTP → Application DTOs e chamam UseCases.
- Mapear explicitamente entre ORM models ↔ Domain entities e Domain entities ↔ DTOs (mappers).
- Publicar Domain Events e, quando necessário, usar Outbox Pattern para garantir entrega de Integration Events.

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

## TDD — fluxo por feature (DDD aware)

1. Escrever testes de domínio (unit) para invariantes e behavior do aggregate root — **falha**
2. Escrever testes de aplicação (use‑case) com repositório mock — **falha**
3. Implementar domain + use‑case mínimo para passar os testes
4. Implementar repositório infra e mapping, ajustar testes de integração
5. Expor controller e documentar no Swagger
6. Refatorar mantendo testes verdes

Prioridade de cobertura:

- Domain logic (`src/**/domain/`) — unit
- Application use‑cases (`src/**/application/`) — unit com mocks
- Infrastructure (repositories) — integration
- Controllers e Gateway — integration/e2e

## O que fica dentro deste app

| Camada | Conteúdo | Observações |
|--------|----------|-------------|
| `presentation` / `api` | controllers, request/response DTOs, pipes, guards | Converte para Application DTOs; sem regras de negócio |
| `application` | use‑cases, application DTOs, mappers, transaction boundaries | Orquestra repositórios e domain services |
| `domain` | entities (aggregate roots), value objects, repository interfaces, domain services, domain events, domain errors | Regras de negócio puras, testáveis sem infra |
| `infrastructure` | ORM models, repository implementations, external adapters, event publishers | Implementações concretas das portas do domain |

Ex.: `apps/api/src/modules/users/{api,application,domain,infrastructure}`

## O que será implementado

### Módulos base (Fase 0)

- `health` — healthcheck (primeiro endpoint no Swagger)
- `auth` — Google OAuth, JWT (TDD); `auth` implementado como bounded context com domain/application/infra
- `users` — perfil + campo `plan` (`free` | `premium`, default `free`) implementado com DDD (Domain entities, IUserRepository interface, infra adapter)
- `@nestjs/terminus`: `GET /health`, `GET /health/ready`
- Logs `pino` (JSON) + `requestId`
- Primeiro teste e2e: `GET /health`

### Campanhas e personagens (Fase 1)

- CRUD TDD completo com Domain entities e UseCases
- RBAC (`gm`, `player`, `spectator`) implementado via guards + domain ownership checks
- Zod schemas/VOs em `src/<module>/domain/value-objects`

### Documentos (Fase 2)

- CRUD + presigned URLs
- Domain events para atualização de snapshots do WS

### Tempo real (Fase 3)

- Gateway WS TDD, Redis pub/sub
- Métricas: `ws_connections_active`, `ws_messages_total`, `ws_broadcast_duration_seconds`
- Atualizar [ws-events.md](docs/ws-events.md)

### Mapa (Fase 4) · Dados (Fase 5) · Quadro (Fase 6)

- Módulos com domínio bem definido, tests e Swagger

### Métricas (Fase 7) — `src/metrics/`

- `GET /metrics` — Prometheus
- Dashboards Grafana; alertas operacionais

### Deploy (Fase 7)

- Dockerfile, CI com `test` + `openapi:export`, e2e HTTP

### Recap de sessão (Fase 8) — `src/session-recap/`

- Agregação determinística (itens, log de dados, docs, quadro)
- LLM opcional: `SESSION_RECAP_AI_ENABLED`, guard `canUseAi()`
- Tabelas: `game_sessions`, `session_recaps`
- Endpoints: finalize, recap (rascunho), send
- Ver [plano-mvp.md § Fase 8](../../plano-mvp.md#fase-8--recap-de-sessão-pós-mvp)

## Estrutura prevista (exemplo DDD)

```
apps/api/
├── docs/
│   ├── README.md
│   └── ws-events.md
├── src/
│   └── modules/
│       ├── users/
│       │   ├── api/
│       │   ├── application/
│       │   ├── domain/
│       │   └── infrastructure/
│       ├── auth/
│       ├── campaigns/
│       └── ...
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
- Todo módulo com `<modulo>.md` atualizado e com seção explicando o bounded context e as camadas
- `pnpm test` e `pnpm test:e2e` passando
- Zero imports de `apps/web`
- Auth, CRUD, WS (4 clientes), rolagens validadas server-side
- `GET /users/me` retorna `plan`; default `free` no MVP
- `/health`, `/health/ready`, `/metrics` operacionais
