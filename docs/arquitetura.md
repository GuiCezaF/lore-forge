# Arquitetura

## Monorepo

O projeto tem dois apps deployáveis e autocontidos:

```
LoreForge/
  apps/
    web/   # Next.js
    api/   # NestJS
  docs/
  docker-compose.local.yml
  docker-compose.production.yml
```

Não há pacote compartilhado entre web e API. A fronteira é HTTP/OpenAPI e WebSocket. A API é a fonte da verdade para regras de negócio, validação autoritativa, persistência, RBAC, rolagem de dados, storage e métricas.

## Responsabilidades

| Área | Responsável | Regra |
|------|-------------|-------|
| UI, estado de tela, formulários, mapa, quadro e docs | `apps/web` | Nunca importa código da API |
| Persistência, auth, RBAC, regras de jogo, WS e storage | `apps/api` | Nunca importa código do web |
| REST | API expõe Swagger em `/api/docs` | Web consome OpenAPI exportado ou cliente alinhado |
| WebSocket | API define eventos | Web espelha tipos em `src/types` |

Duplicação de DTOs e tipos entre apps é intencional para preservar independência. Divergência deve ser detectada por build, testes ou OpenAPI.

## Backend

Stack principal:

- NestJS.
- Drizzle ORM e PostgreSQL.
- Redis para pub/sub de tempo real.
- S3 compatível: MinIO em dev, Cloudflare R2 em produção.
- `@nestjs/swagger` para REST.
- Jest para unit, integração e e2e.
- `pino` para logs JSON.
- `prom-client` para Prometheus.

Contextos com regra relevante devem seguir DDD de forma pragmática:

```
apps/api/src/<context>/
  api/                # controllers, DTOs HTTP, pipes, guards
  application/        # use cases, mappers, transações
  domain/             # entities, VOs, ports, services, events, errors
  infrastructure/     # ORM, repositories concretos, adapters
```

Use a estrutura completa quando houver regra de negócio real. Módulos simples podem ser menores, desde que preservem a separação entre controller, regra, persistência e contrato.

Regras:

- Controller traduz transporte para use case; sem regra de negócio.
- Domain não importa infraestrutura.
- Repositórios são portas no domínio ou aplicação e adapters na infraestrutura.
- Mappers explícitos entre ORM, domínio e DTO.
- Ownership e permissões verificados na aplicação e nas invariantes relevantes.
- DTO de saída nunca expõe hash, token, segredo ou PII desnecessária.

## Frontend

Stack principal:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Zustand para estado de UI.
- TanStack Query para dados remotos.
- PixiJS para mapa.
- React Flow para quadro.
- TipTap para documentos.
- Vitest, React Testing Library, MSW e Cypress.

Regras:

- Web não calcula regra autoritativa de jogo; apenas valida UX e exibe respostas da API.
- Tipos REST devem acompanhar OpenAPI.
- Tipos WS ficam espelhados em `apps/web/src/types`.
- Ads e analytics são client-side e nunca aparecem no modo apresentação.

## Testes

API:

1. Unit de domínio para invariantes e comportamento.
2. Unit de use cases com repositórios mockados.
3. Integração para repositórios/adapters.
4. E2E para controllers e gateway.

Web:

1. Unit para hooks, utils e schemas de formulário.
2. Componentes críticos com React Testing Library.
3. Integração com MSW para fluxos com API.
4. Cypress para login, campanha, mapa, apresentação e fluxos críticos.

Documentação não substitui teste. Mudança de contrato exige Swagger/OpenAPI, tipos espelhados e teste cobrindo o fluxo.

## Documentação

Não criar `.md` ao lado de cada módulo ou domínio. Atualize apenas:

- [produto.md](produto.md), quando mudar escopo, requisitos ou roadmap.
- [arquitetura.md](arquitetura.md), quando mudar organização, padrões ou decisões técnicas.
- [contratos.md](contratos.md), quando mudar REST/WS público.
- [operacao.md](operacao.md), quando mudar deploy, env, métricas, ads ou observabilidade.
- [licenca-ordem-paranormal.md](licenca-ordem-paranormal.md), quando mudar regra de conformidade.

## Setup local

Pré-requisitos:

- Node.js 20+.
- pnpm 9+.
- Docker e Docker Compose.

Comandos principais:

```bash
pnpm install
docker compose -f docker-compose.local.yml up -d
pnpm --filter @loreforge/api db:migrate
pnpm dev
```

Stack completa via Docker:

```bash
docker compose -f docker-compose.local.yml --profile app up --build
```

Serviços previstos:

| Serviço | URL |
|---------|-----|
| Web | http://localhost:3001 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| MinIO | http://localhost:9001 |

## Deploy

- Web: Coolify + Cloudflare.
- API: Coolify + Cloudflare.
- Storage: Cloudflare R2.
- Banco: PostgreSQL gerenciado.
- Redis: serviço gerenciado ou instância do ambiente.

CI mínimo:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
pnpm --filter @loreforge/api openapi:export
```
