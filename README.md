# LoreForge

LoreForge é uma plataforma web de mesa virtual para RPG. O objetivo é concentrar a operação de uma sessão em um só lugar: campanhas, fichas, documentos do mestre, mapa em tempo real, rolagem de dados e quadro de investigações.

O sistema inicial é **Ordem Paranormal RPG**, respeitando a Licença da Comunidade de Ordem Paranormal v1.0.

## Principais recursos

- Login via Google OAuth.
- Campanhas com papéis de mestre, jogador e espectador.
- Fichas de personagem com validação autoritativa na API.
- Documentos rich-text do mestre, com controle de visibilidade.
- Mapa tabletop em tempo real com tokens, grid, fog of war, zoom e pan.
- Modo apresentação em nova aba, limpo e sem anúncios.
- Rolagem de dados sincronizada e recalculada no servidor.
- Quadro de investigações com nós, conexões, tags e cores.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | Next.js, TypeScript, Tailwind CSS, Zustand, TanStack Query |
| UI especializada | PixiJS, React Flow, TipTap |
| Backend | NestJS, Drizzle ORM, PostgreSQL, Redis, WebSocket |
| Storage | MinIO em dev, Cloudflare R2 em produção |
| Qualidade | Jest, Vitest, React Testing Library, MSW, Cypress |
| Operação | Docker, Coolify, Cloudflare, Prometheus/Grafana |

## Estrutura

```text
LoreForge/
  apps/
    web/   # frontend Next.js
    api/   # backend NestJS
  docs/    # documentação central do projeto
```

Os apps são autocontidos. Não há import de código entre frontend e backend; a integração acontece por REST/OpenAPI e WebSocket. A API é a fonte autoritativa para regras de negócio, validação, persistência e permissões.

## Setup rápido

Pré-requisitos:

- Node.js 20+.
- pnpm 9+.
- Docker e Docker Compose.

```bash
pnpm install
docker compose -f docker-compose.local.yml up -d
pnpm --filter @loreforge/api db:migrate
pnpm dev
```

Serviços previstos:

| Serviço | URL |
|---------|-----|
| Web | http://localhost:3001 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| MinIO | http://localhost:9001 |

## Documentação

A documentação foi concentrada em poucos arquivos para evitar duplicação e poluição no código:

- [docs/README.md](docs/README.md): índice.
- [docs/produto.md](docs/produto.md): escopo, requisitos e roadmap do MVP.
- [docs/arquitetura.md](docs/arquitetura.md): monorepo, padrões técnicos, testes e setup.
- [docs/contratos.md](docs/contratos.md): REST/OpenAPI e eventos WebSocket.
- [docs/operacao.md](docs/operacao.md): monetização, métricas, deploy e variáveis de ambiente.
- [docs/licenca-ordem-paranormal.md](docs/licenca-ordem-paranormal.md): conformidade com a Licença da Comunidade.

Regra prática: preferir Swagger/OpenAPI, testes e estes documentos centrais. Não criar `.md` por módulo ou domínio sem uma necessidade real de arquitetura, contrato ou operação.

## Licenças

- Código-fonte: [Apache License 2.0](LICENSE).
- Compatibilidade Ordem Paranormal RPG: [Licença da Comunidade de Ordem Paranormal v1.0](docs/licenca-ordem-paranormal/LICENCA-COMUNIDADE-v1.0.md).

LoreForge é uma ferramenta não oficial e não possui afiliação, parceria ou endosso de Rafael "Cellbit" Lange, Jambô Editora ou Ordem Paranormal.
