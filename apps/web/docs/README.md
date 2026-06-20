# apps/web — Documentação

Índice da documentação do frontend. Contrato REST: Swagger da API em `/api/docs` + `openapi.json` exportado.

## Índice de domínios

Documentação `.md` vive junto aos componentes ou em `src/<dominio>/`.

| Domínio | Doc | Fase |
|---------|-----|------|
| auth / shell | `src/components/auth/auth.md` | 0 |
| campaign | `src/components/campaign/campaign.md` | 1 |
| character | `src/components/character/character.md` | 1 |
| documents | `src/components/documents/documents.md` | 2 |
| tabletop | `src/components/tabletop/tabletop.md` | 4 |
| presentation | `src/components/tabletop/presentation.md` | 4 |
| dice | `src/components/dice/dice.md` | 5 |
| investigation | `src/components/investigation/investigation.md` | 6 |
| ads | `src/components/ads/ads.md` | 7 |
| analytics | `src/lib/analytics/analytics.md` | 7 |
| api client | `src/lib/api/api-client.md` | 0 |
| websocket | `src/lib/ws/ws-client.md` | 3 |

## Testes

Ver [docs/padroes.md](../../../docs/padroes.md).

```bash
pnpm --filter @loreforge/web test           # vitest unit + component
pnpm --filter @loreforge/web test:e2e        # cypress run
pnpm --filter @loreforge/web test:watch
```

## Alinhamento com API

1. Consultar Swagger ou `openapi.json`
2. Atualizar `src/types/` e cliente em `src/lib/api/`
3. Atualizar handlers MSW nos testes
4. Atualizar `.md` do domínio

## Visão geral do app

[web.md](../web.md)
