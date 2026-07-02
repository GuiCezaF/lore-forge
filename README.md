# LoreForge

Plataforma web de mesa virtual para RPG — campanhas, fichas, mapa tabletop em tempo real, rolagem de dados e quadro de investigações em um só lugar.

**Status:** documentação e planejamento. Backend organizado segundo Domain‑Driven Design (DDD) para facilitar evolução e testes.
**Sistema inicial:** Ordem Paranormal RPG — compatível com a [Licença da Comunidade de Ordem Paranormal v1.0](docs/licenca-ordem-paranormal/LICENCA-COMUNIDADE-v1.0.md) ([oficial](https://ordemparanormal.com.br/licenca)).

---

## O que é

LoreForge permite que mestres e jogadores conduzam sessões online com:

- Login via Google OAuth
- CRUD de campanhas e personagens
- Documentos rich-text do mestre (TipTap)
- Mapa tabletop sincronizado (PixiJS) com tokens, fog of war e grid
- Modo apresentação — mapa limpo em nova aba para mesa física ou stream
- Rolagem de dados em tempo real com regras Ordem Paranormal (pool de d20)
- Quadro de investigações conectável (React Flow)

Diferenciais: arquitetura do backend orientada a domínio (DDD), teste desde o Domain até a API e capacidade de extração de módulos em microserviços no futuro.

---

## Modelo SaaS

| Plano | Features | Anúncios |
|-------|----------|----------|
| **Free** | Todas (MVP) | Google AdSense |
| **Premium** | Iguais ao Free | Sem anúncios |

No lançamento do MVP, todos os usuários estarão no plano **Free**. Pagamento Premium (remover ads) é pós-MVP. Detalhes: [docs/monetizacao.md](docs/monetizacao.md).

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | Next.js, TypeScript, Tailwind, Zustand, TanStack Query, PixiJS, React Flow, TipTap |
| Backend | NestJS (DDD), Drizzle, PostgreSQL, Redis, WebSocket |
| Storage | Cloudflare R2 (prod), MinIO (dev) |
| Infra | Docker, Coolify, Cloudflare |
| Testes | Jest (API, TDD — domain + application), Vitest + RTL + Cypress (web) |
| Docs API | Swagger (`/api/docs`) desde o dia 1 |
| Métricas | Prometheus, Grafana, Plausible/PostHog |

---

## Estrutura do monorepo

```
LoreForge/
├── apps/
│   ├── web/          # @loreforge/web — Next.js
│   └── api/          # @loreforge/api — NestJS (DDD by modules)
├── docs/             # Requisitos, padrões, métricas, diagramas
├── docker-compose.local.yml
├── docker-compose.production.yml
├── README.md
└── LICENSE
```

Dois apps **autocontidos** — sem pacotes compartilhados. Comunicação apenas via REST (Swagger) e WebSocket. Backend organizado por bounded contexts em `apps/api/src/modules/<context>` (camadas: api/application/domain/infrastructure). Visão completa: [monorepo.md](monorepo.md).

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [LoreForge.md](LoreForge.md) | Requisitos e stack (origem) |
| [plano-mvp.md](plano-mvp.md) | Fases de desenvolvimento e critérios de aceite |
| [docs/requisitos.md](docs/requisitos.md) | RF/RNF consolidados |
| [docs/padroes.md](docs/padroes.md) | Padrões de DDD, TDD, Swagger e `.md` por módulo |
| [docs/metricas.md](docs/metricas.md) | Observabilidade e analytics |
| [docs/monetizacao.md](docs/monetizacao.md) | AdSense e planos |
| [docs/assets/](docs/assets/) | Selos da licença OP (PNG) |
| [docs/licenca-ordem-paranormal/](docs/licenca-ordem-paranormal/) | Licença OP e conformidade do LoreForge |
| [docs/loreforge-arquitetura.drawio](docs/loreforge-arquitetura.drawio) | Diagramas (draw.io) |
| [apps/web/web.md](apps/web/web.md) | Escopo do frontend |
| [apps/api/api.md](apps/api/api.md) | Escopo do backend (DDD) |

---

## Pré-requisitos (quando o código existir)

- Node.js 20+
- pnpm 9+
- Docker e Docker Compose

---

## Setup local

```bash
# Clonar e instalar
git clone <repo-url> loreforge
cd loreforge
pnpm install

# Infra local apenas
docker compose -f docker-compose.local.yml up -d

# Stack local completa
docker compose -f docker-compose.local.yml --profile app up --build

# Migrations
pnpm --filter @loreforge/api db:migrate

# Desenvolvimento
pnpm dev
```

| Serviço | URL (prevista) |
|---------|----------------|
| Web | http://localhost:3001 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| MinIO | http://localhost:9001 |

---

## Scripts (previstos)

```bash
pnpm dev              # web + api em paralelo
pnpm build            # build de produção
pnpm test             # unit + integração
pnpm test:e2e         # e2e (Jest na API, Cypress no web)
pnpm lint             # lint nos apps
pnpm openapi:export   # exporta openapi.json da API
docker compose -f docker-compose.local.yml up -d                  # infra
docker compose -f docker-compose.local.yml --profile app up --build
```

---

## Testes

| App | Unit / integração | E2E |
|-----|-------------------|-----|
| **api** | Jest (TDD obrigatório — domain + application) | Supertest |
| **web** | Vitest + RTL + MSW | Cypress |

Padrões: [docs/padroes.md](docs/padroes.md).

---

## Requisitos de sessão (MVP)

- **4 clientes simultâneos** por campanha (ex.: 1 mestre + 3 jogadores, ou 3 jogadores + 1 aba de apresentação)
- Sync de mapa com latência alvo **< 200 ms** em rede local
- Modo apresentação sem anúncios e sem UI extra — rota `/campaign/[id]/present`

---

## Variáveis de ambiente

Copie e ajuste conforme [plano-mvp.md](plano-mvp.md#variáveis-de-ambiente-essenciais):

```env
# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/loreforge
REDIS_URL=redis://localhost:6379

# Storage (dev)
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=loreforge
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Apps
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Ads (prod)
NEXT_PUBLIC_GOOGLE_ADS_CLIENT=
NEXT_PUBLIC_ADS_ENABLED=false

# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=false
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
```

---

## Roadmap

Desenvolvimento incremental — ordem sugerida em [plano-mvp.md](plano-mvp.md):

1. Fundação — auth, Swagger, health, logs
2. Campanhas e fichas (Ordem Paranormal)
3. Documentos do mestre
4. WebSocket + tempo real
5. Mapa tabletop + modo apresentação
6. Rolagem de dados
7. Quadro de investigações
8. Deploy, AdSense, métricas, Cypress e2e

**Fora do MVP:** checkout Premium, balanceador de homebrew, outros sistemas de RPG, áudio/vídeo.

---

## Aviso legal — Ordem Paranormal

LoreForge é uma plataforma VTT **não oficial**, publicada sob a [Licença da Comunidade de Ordem Paranormal v1.0](https://ordemparanormal.com.br/licenca). Não possui afiliação, parceria ou endosso de Rafael "Cellbit" Lange, Jambô Editora ou Ordem Paranormal.

- Usa apenas **terminologia geral do sistema** permitida pela licença (atributos, PV, PE, Sanidade, origens, classes, etc.)
- **Não** reproduz textos nem imagens dos livros oficiais
- **Não** usa marca, logo ou identidade visual de Ordem Paranormal
- **Não** inclui conteúdo gerado por IA (requisito de conteúdo comercial)

Guia completo: [docs/licenca-ordem-paranormal/conformidade-loreforge.md](docs/licenca-ordem-paranormal/conformidade-loreforge.md)

---

## Licenças

| Escopo | Licença |
|--------|---------|
| Código-fonte do LoreForge | [Apache License 2.0](LICENSE) |
| Compatibilidade com Ordem Paranormal RPG | [Licença da Comunidade de Ordem Paranormal v1.0](docs/licenca-ordem-paranormal/LICENCA-COMUNIDADE-v1.0.md) |

A licença Apache cobre o código deste repositório. Direitos sobre o universo *Ordem Paranormal* permanecem com Rafael "Cellbit" Lange. O LoreForge opera dentro dos termos da Licença da Comunidade — não substitui nem amplia direitos sobre marcas ou obras oficiais.
