# LoreForge — Monorepo

Visão geral da organização do código. Dois apps deployáveis, **sem pacotes compartilhados** — front e back são unidades independentes, comunicadas apenas por contrato HTTP/WebSocket.

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [README.md](README.md) | Visão geral, setup e links |
| [LICENSE](LICENSE) | Licença Apache 2.0 do código LoreForge |
| [docs/licenca-ordem-paranormal/](docs/licenca-ordem-paranormal/) | Licença da Comunidade OP e conformidade |
| [LoreForge.md](LoreForge.md) | Requisitos funcionais e stack |
| [plano-mvp.md](plano-mvp.md) | Plano de desenvolvimento, fases e critérios de aceite |
| [apps/web/web.md](apps/web/web.md) | Frontend Next.js |
| [apps/api/api.md](apps/api/api.md) | Backend NestJS (organizado por DDD) |
| [docs/padroes.md](docs/padroes.md) | Padrões de documentação, testes e DDD |
| [docs/requisitos.md](docs/requisitos.md) | Requisitos funcionais e não funcionais |
| [docs/metricas.md](docs/metricas.md) | Métricas técnicas, produto, SaaS e observabilidade |
| [docs/monetizacao.md](docs/monetizacao.md) | SaaS Free/Premium e setup Google AdSense |
| [docs/licenca-ordem-paranormal/](docs/licenca-ordem-paranormal/) | Licença OP v1.0 e conformidade LoreForge |
| [docs/assets/](docs/assets/) | Selos oficiais da licença OP |
| [docs/loreforge-arquitetura.drawio](docs/loreforge-arquitetura.drawio) | Diagramas draw.io (arquitetura, fluxo, deploy) |

---

## Estrutura

```
LoreForge/
├── apps/
│   ├── web/                 # @loreforge/web — Next.js
│   └── api/                 # @loreforge/api — NestJS (DDD by modules)
├── docker-compose.yml       # PostgreSQL, Redis, MinIO (dev)
├── README.md
├── LICENSE
├── NOTICE
├── docs/
│   ├── assets/              # selos licença OP (PNG)
│   └── licenca-ordem-paranormal/
├── LoreForge.md
├── plano-mvp.md
└── monorepo.md
```

Cada app contém **tudo** do seu lado: tipos, schemas, regras de domínio, testes e documentação (`.md` + Swagger na API). A diferença importante: o backend agora está organizado por bounded contexts e por camadas (api/application/domain/infrastructure) para favorecer DDD.

---

## Documentação e testes

Padrão completo: [docs/padroes.md](docs/padroes.md).

| App | Documentação | Testes |
|-----|--------------|--------|
| **api** | Swagger (`@nestjs/swagger`) desde o dia 1 + `<modulo>.md` por bounded context (cada `.md` deve explicar a camada `domain` e `application`) | **TDD** — Jest unit (domain), unit application (use-cases), integração (infra), e2e |
| **web** | `<dominio>.md` por área de UI | Vitest + RTL + Cypress + MSW |

Nenhuma feature REST entra sem decorator Swagger. Nenhuma lógica de negócio na API entra sem teste escrito antes (TDD). Métricas: [docs/metricas.md](docs/metricas.md).

## Fronteira entre apps

```mermaid
flowchart LR
  web["apps/web"]
  api["apps/api"]

  web -->|"REST + JWT"| api
  web -->|"WebSocket"| api
```

| Camada | Onde vive | Regra |
|--------|-----------|-------|
| UI, estado de tela, PixiJS, React Flow | `apps/web` | Nunca importa código de `apps/api` |
| Persistência, auth, validação autoritativa, WS gateway | `apps/api` | Nunca importa código de `apps/web` |
| Contrato REST | `apps/api` expõe Swagger (`/api/docs`); `apps/web` consome | OpenAPI desde a Fase 0 |
| Contrato WebSocket | `apps/api/docs/ws-events.md`; web espelha em `src/types/ws-events.ts` | Markdown + Zod |

**Duplicação intencional:** tipos de request/response e eventos WS existem nos dois apps. A API é fonte da verdade; o web espelha para TypeScript. Se divergir, o build/test da integração quebra — preferível a um pacote compartilhado que impede extração.

---

## Responsabilidades

### [apps/web](apps/web/web.md)

Interface: login, campanhas, fichas, docs (TipTap), mapa (PixiJS), dados (UI), quadro (React Flow), modo apresentação.

Inclui internamente:
- Tipos e schemas Zod **de formulário** (validação UX antes do submit)
- Cliente HTTP e hook WebSocket
- Formatação visual de rolagens (a rolagem real vem da API)

### [apps/api](apps/api/api.md)

REST, WebSocket, Drizzle/PostgreSQL, Redis, storage S3/R2. Organizado por bounded contexts e camadas DDD.

Inclui internamente:
- DTOs, schemas Zod **autoritativos** (REST + WS)
- Regras Ordem Paranormal: ficha, pool de d20, anti-cheat de rolagem — modeladas no Domain layer
- RBAC e persistência, com ownership checks no Application/Domain

---

## Caminho para micro-serviços

A organização por módulos e camadas facilita a extração futura. Quando um domínio crescer o suficiente:

```mermaid
flowchart LR
  web["web"]
  api["api-core"]
  mapSvc["map-service"]
  diceSvc["dice-service"]

  web --> api
  web --> mapSvc
  web --> diceSvc
  api --> mapSvc
```

Passos de extração (sem refatoração massiva):

1. Copiar bounded context NestJS (ex.: `map/`) para novo app `apps/map-service`
2. Garantir que o novo serviço implemente os mesmos contratos HTTP/WS ou que exista um adapter
3. `apps/web` passa a apontar para URL nova via env
4. Usar Integration Events/outbox para comunicar entre serviços quando necessário

Domínios candidatos a separação futura: **mapa**, **tempo real/WS**, **dados/RPG**, **documentos/storage**.

---

## Fluxo de dados

```mermaid
flowchart LR
  Browser["Browser\napps/web"]
  API["NestJS\napps/api"]
  PG[(PostgreSQL)]
  Redis[(Redis)]
  S3[(MinIO / R2)]

  Browser -->|"REST + JWT"| API
  Browser -->|"WebSocket"| API
  API --> PG
  API --> Redis
  API --> S3
```

CRUD → REST (TanStack Query). Sessão ao vivo → WebSocket. Rolagem de ficha → **sempre calculada na API**; web só exibe.

---

## Tooling previsto

| Ferramenta               | Uso                              |
| ------------------------ | -------------------------------- |
| **pnpm workspaces**      | Monorepo com os dois apps        |
| **Turborepo** (opcional) | Build/lint/test paralelo         |
| **TypeScript**           | Strict mode em cada app          |
| **@nestjs/swagger**      | REST documentado desde a Fase 0  |
| **Jest**                 | TDD no backend                   |
| **prom-client**          | Métricas Prometheus (`/metrics`) |
| **pino**                 | Logs JSON estruturados           |
| **Vitest + Cypress**     | Testes no frontend               |
| **Docker Compose**       | PostgreSQL, Redis, MinIO         |

### Scripts raiz (previstos)

```json
{
  "dev": "turbo dev",
  "build": "turbo build",
  "lint": "turbo lint",
  "test": "turbo test",
  "test:e2e": "turbo test:e2e",
  "db:migrate": "pnpm --filter @loreforge/api db:migrate",
  "openapi:export": "pnpm --filter @loreforge/api openapi:export",
  "docker:up": "docker compose up -d"
}
```

---

## Convenções

### Onde colocar código novo

| Se é... | Vai para... |
|---------|-------------|
| Componente, página, hook, store de UI | `apps/web` |
| Endpoint, módulo NestJS, migration, regra de negócio | `apps/api` |
| Tipo usado só no frontend | `apps/web/src/types` |
| DTO/schema autoritativo | `apps/api/src/...` |
| Regra de jogo (Ordem Paranormal) | `apps/api/src/rpg/` (validação) + espelho leve em `apps/web` (formulário) |

### Ordem ao implementar feature que cruza front e back

1. **API (TDD):** teste → endpoint/evento → Swagger + `<modulo>.md`
2. **Web:** tipos/cliente alinhados ao OpenAPI → UI → testes + `<dominio>.md`
3. Verificar checklist em [docs/padroes.md](docs/padroes.md)

---

## Infraestrutura local

```yaml
# docker-compose.yml (previsto)
services:
  postgres:   # DATABASE_URL
  redis:      # REDIS_URL
  minio:      # S3_ENDPOINT (dev)
```

Variáveis de ambiente: [plano-mvp.md](plano-mvp.md#variáveis-de-ambiente-essenciais).

---

## Deploy

| App | Destino |
|-----|---------|
| `@loreforge/web` | Coolify (Next.js) + Cloudflare |
| `@loreforge/api` | Coolify (NestJS) + Cloudflare |
| Storage prod | Cloudflare R2 |
| Banco prod | PostgreSQL gerenciado |

---

## Ordem de implementação

| Fase | web | api |
|------|-----|-----|
| 0 — Fundação | layout, auth UI, Vitest | auth, health, Swagger, **pino** |
| 1 — Campanhas | dashboard, ficha, testes RTL | CRUD TDD, schema OP |
| 2 — Docs | TipTap, MSW mocks | CRUD docs, storage |
| 3 — Realtime | hook WS, ws-client.md | gateway, **métricas WS** |
| 4 — Mapa | PixiJS, testes componente | map module TDD |
| 5 — Dados | log UI, testes | motor d20 TDD |
| 6 — Quadro | React Flow | investigation TDD |
| 7 — Deploy | Cypress, AdSense, **analytics**, Web Vitals | e2e, **`/metrics`**, Grafana |

Detalhes: [plano-mvp.md](plano-mvp.md#checklist-de-fases).

---

## Critérios de aceite do monorepo

- [ ] `pnpm install` resolve apenas `apps/web` e `apps/api`
- [ ] Nenhum import cruzado entre apps (só HTTP/WS)
- [ ] `pnpm dev` sobe web + api com hot reload
- [ ] `docker compose up` sobe PG, Redis e MinIO
- [ ] Regras Ordem Paranormal autoritativas só em `apps/api`
- [ ] Swagger acessível em `/api/docs` desde a Fase 0
- [ ] `/metrics` Prometheus + analytics de produto configurados
- [ ] Conformidade Licença da Comunidade OP documentada e verificada
- [ ] Todo módulo API com `.md` + testes; web com `.md` + testes por domínio
- [ ] `pnpm test` passa na raiz (api + web)
- [ ] Build de produção gera imagens Docker independentes para web e api
