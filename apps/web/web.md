# apps/web — Frontend

Aplicação web do LoreForge. Unidade deployável e **autocontida** — consome REST (Swagger/OpenAPI) e WebSocket.

**Documentação:** `.md` por domínio de UI. **Testes:** Vitest + RTL + Cypress + MSW.

Ver também: [docs/README.md](docs/README.md) · [docs/padroes.md](../../docs/padroes.md)

## Responsabilidade

Tudo que roda no navegador: autenticação (UI), dashboard, campanhas, fichas, documentos, mapa, dados (UI) e quadro.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query
- PixiJS · React Flow · TipTap
- **Vitest** + React Testing Library
- **Cypress** (e2e)
- **MSW** (mock da API nos testes)

## Documentação

Cada domínio de UI mantém um `.md` junto ao código (ver [docs/README.md](docs/README.md)).

Conteúdo: responsabilidade, endpoints WS/REST usados, estados de UI, como testar.

Contrato REST: consultar Swagger da API (`/api/docs`) ou `apps/api/openapi.json`.

## Testes

| Camada | Quando |
|--------|--------|
| Unit (hooks, utils, schemas) | Junto com a feature |
| Componente (RTL) | Formulários, fluxos críticos |
| Integração (MSW) | Cliente API, fluxos com mock |
| E2E (Cypress) | Fase 7 — login, CRUD campanha, mapa 4 abas, apresentação |

Rolagens: testes verificam que UI **exibe** resposta da API (não calcula dado).

## O que fica dentro deste app

| Área | Conteúdo |
|------|----------|
| `src/types/` | Tipos espelhados (REST + WS) |
| `src/lib/api/` | Cliente HTTP — alinhado ao OpenAPI |
| `src/lib/ws/` | Cliente WebSocket |
| `src/schemas/` | Zod de formulário (UX) |
| `src/rpg/` | Labels/constantes OP (sem motor de dado) |
| `src/components/*/<dominio>.md` | Doc por área |
| `docs/` | Índice |

## O que será implementado

(Fases 0–6 — ver [plano-mvp.md](../../plano-mvp.md))

Cada entrega inclui: componentes + testes + atualização do `.md` do domínio.

### Fase 0

- Layout, auth UI, Vitest configurado
- `api-client.md` — como consumir Swagger/OpenAPI
- **Licença OP:** `LicenseBadge`, disclaimer no footer, rota `/legal`, `legal.md`

### Fase 7 — Google AdSense + Analytics (tier Free)

- `components/ads/`: `AdProvider`, `AdSlot`, `useShowAds`
- `lib/analytics/`: `AnalyticsProvider`, `track()` — Plausible/PostHog
- Core Web Vitals (`web-vitals`) — rotas mapa e quadro
- Eventos: campanha, mapa, dados, `ad_slot_*`
- Doc: [metricas.md](../../docs/metricas.md) · [monetizacao.md](../../docs/monetizacao.md)

## Estrutura prevista

```
apps/web/
├── docs/
│   └── README.md
├── app/
├── src/
│   ├── components/
│   │   ├── campaign/
│   │   │   └── campaign.md
│   │   ├── tabletop/
│   │   │   ├── tabletop.md
│   │   │   └── presentation.md
│   │   ├── ads/
│   │   │   └── ads.md
│   │   ├── legal/
│   │   │   └── legal.md          # selo + disclaimer licença OP
│   │   └── ...
│   ├── public/
│   │   └── licenca-op/           # cópia dos selos (origem: docs/assets/)
│   ├── hooks/
│   ├── stores/
│   ├── lib/
│   │   ├── api/
│   │   │   └── api-client.md
│   │   ├── analytics/
│   │   │   └── analytics.md
│   │   └── ws/
│   │       └── ws-client.md
│   ├── types/
│   └── schemas/
├── cypress/                    # E2E Cypress
│   ├── e2e/
│   ├── fixtures/
│   └── support/
├── cypress.config.ts
└── web.md
```

## Comunicação com apps/api

- **REST:** tipos alinhados ao `openapi.json` exportado pela API
- **WebSocket:** tipos em `src/types/ws-events.ts` espelhando [ws-events.md](../api/docs/ws-events.md)
- Ao mudar contrato: atualizar tipos + MSW + `.md` + testes

## Critérios de aceite

- Zero imports de `apps/api`
- Todo domínio principal com `.md` documentado
- Testes passando (`pnpm test`; e2e na Fase 7)
- Login, campanhas, ficha, mapa (4 clientes + apresentação), docs, dados e quadro funcionais
- Rolagens exibidas conforme resposta autoritativa da API
- AdSense no Free; ads ocultos em `/present` e quando `plan === 'premium'`
- Analytics de produto e Web Vitals configurados
- Selo e disclaimer da Licença da Comunidade de Ordem Paranormal visíveis
