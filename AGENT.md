# Guia operacional do projeto

LoreForge é uma plataforma web de mesa virtual para RPG, com foco inicial em Ordem Paranormal RPG.

## Referências centrais

- [README.md](README.md): entrada rápida do repositório.
- [docs/produto.md](docs/produto.md): escopo, requisitos, roadmap e critérios de aceite.
- [docs/arquitetura.md](docs/arquitetura.md): monorepo, DDD, testes, setup e deploy.
- [docs/contratos.md](docs/contratos.md): REST/OpenAPI e eventos WebSocket.
- [docs/operacao.md](docs/operacao.md): monetização, métricas, variáveis de ambiente e operação.
- [docs/licenca-ordem-paranormal.md](docs/licenca-ordem-paranormal.md): conformidade legal.

## Arquitetura

O repositório tem dois apps autocontidos:

- `apps/web`: frontend Next.js.
- `apps/api`: backend NestJS.

Não há import de código entre os apps. A comunicação acontece apenas por REST/OpenAPI e WebSocket. A API é a fonte da verdade para regras de negócio, validação autoritativa, persistência, RBAC, rolagem de dados, storage e métricas.

## Backend

- Usar NestJS, Drizzle, PostgreSQL, Redis e storage S3 compatível.
- Organizar contextos com regra relevante usando DDD pragmático: `api`, `application`, `domain`, `infrastructure`.
- Controllers não contêm regra de negócio.
- Domain não importa infraestrutura.
- DTOs de saída não expõem hashes, tokens, segredos ou PII desnecessária.
- REST é documentado por Swagger em `/api/docs`.
- WebSocket é documentado em [docs/contratos.md](docs/contratos.md).

## Frontend

- Usar Next.js, TypeScript, Tailwind, Zustand e TanStack Query.
- Usar PixiJS no mapa, React Flow no quadro e TipTap nos documentos.
- Não calcular regra autoritativa de jogo no cliente.
- Espelhar contratos REST/WS apenas para tipagem, validação de UX e integração.
- Ads e analytics são client-side e nunca aparecem no modo apresentação.

## Testes

- API: Jest unit, integração e e2e, priorizando domínio, use cases, repositories e controllers/gateway.
- Web: Vitest, React Testing Library, MSW e Cypress nos fluxos críticos.
- Mudança de contrato exige teste cobrindo o fluxo e atualização de Swagger ou [docs/contratos.md](docs/contratos.md).

## Documentação

Não criar `.md` ao lado de módulo, domínio, componente ou pasta por padrão. Isso polui o repositório e tende a duplicar o que já está em testes, Swagger e código.

Atualize documentação somente quando a mudança alterar:

- escopo, requisito ou roadmap: [docs/produto.md](docs/produto.md);
- arquitetura, padrão técnico, setup ou deploy: [docs/arquitetura.md](docs/arquitetura.md);
- contrato REST/WS público: [docs/contratos.md](docs/contratos.md);
- métricas, ads, env ou operação: [docs/operacao.md](docs/operacao.md);
- conformidade legal: [docs/licenca-ordem-paranormal.md](docs/licenca-ordem-paranormal.md).

Comentários no código devem explicar decisões não óbvias, invariantes ou integrações frágeis. Não documentar mecanicamente todo método, classe ou componente.

## Regras de domínio

- Login via Google OAuth.
- Campanhas têm papéis `gm`, `player` e `spectator`.
- Plano `free` mostra anúncios; `premium` remove anúncios.
- No MVP, Premium não bloqueia funcionalidades de jogo.
- Modo apresentação nunca exibe anúncios.
- Rolagem de ficha é recalculada pela API.
- Sync de mapa deve suportar pelo menos 4 clientes simultâneos por campanha.

## Conformidade Ordem Paranormal

LoreForge opera sob a Licença da Comunidade de Ordem Paranormal v1.0 como plataforma VTT comercial.

- Usar apenas terminologia geral permitida.
- Não usar marca, logo, identidade visual, textos, imagens ou conteúdo de cânone.
- Não incluir templates pré-populados com material oficial.
- Não incluir material gerado por IA com monetização ativa, salvo mudança legal explícita.
- Exibir selo da licença e disclaimer de não oficialidade.
