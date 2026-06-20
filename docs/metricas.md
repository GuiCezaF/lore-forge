# Métricas e Observabilidade

Plano de métricas do LoreForge — técnicas, de produto, SaaS e anúncios. Essencial para operar o SaaS, validar performance (4 clientes WS) e medir conversão Free → Premium no futuro.

**Relacionado:** [monetizacao.md](monetizacao.md) · [padroes.md](padroes.md) · [requisitos.md](requisitos.md)

---

## Objetivos

| Objetivo | Métrica-chave |
|----------|---------------|
| SLA e deploy | Uptime, latência REST, erros 5xx |
| Tempo real | Conexões WS, latência de sync, desconexões |
| Produto | Usuários, campanhas, sessões, rolagens |
| SaaS | Distribuição free/premium, retenção |
| Monetização | Impressões de ad (AdSense + eventos) |
| UX | Core Web Vitals no frontend |

---

## Stack de observabilidade

| Camada | Ferramenta | Onde |
|--------|------------|------|
| Health | `@nestjs/terminus` | `GET /health`, `GET /health/ready` |
| Métricas API | `prom-client` + endpoint `GET /metrics` | `apps/api` |
| Logs | `pino` (JSON estruturado) | `apps/api` |
| Dashboards | Grafana (Coolify) ou equivalente | Infra |
| Analytics produto | Plausible ou PostHog | `apps/web` + opcional server-side |
| Erros (opcional MVP) | Sentry | web + api |
| Edge | Cloudflare Analytics | DNS/CDN |
| Ads | Painel Google AdSense | Externo + eventos client |

---

## Métricas técnicas (API — Prometheus)

Expostas em `GET /metrics` (proteger em prod — IP interno ou auth básica).

### HTTP

| Métrica | Tipo | Labels | Descrição |
|---------|------|--------|-----------|
| `http_requests_total` | Counter | `method`, `route`, `status` | Total de requests REST |
| `http_request_duration_seconds` | Histogram | `method`, `route` | Latência por rota |
| `http_errors_total` | Counter | `route`, `status` | 4xx/5xx |

### WebSocket

| Métrica | Tipo | Labels | Descrição |
|---------|------|--------|-----------|
| `ws_connections_active` | Gauge | — | Conexões WS abertas |
| `ws_connections_per_campaign` | Gauge | `campaign_id` | Conexões por campanha (cardinalidade: limitar agregação) |
| `ws_messages_total` | Counter | `event_type`, `direction` | Mensagens in/out |
| `ws_broadcast_duration_seconds` | Histogram | `event_type` | Tempo publish → broadcast |
| `ws_reconnections_total` | Counter | — | Reconexões de clientes |

### Infra / app

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `db_pool_active_connections` | Gauge | Pool Drizzle/PostgreSQL |
| `redis_pubsub_messages_total` | Counter | Mensagens Redis pub/sub |
| `process_uptime_seconds` | Gauge | Uptime do processo Node |

### Implementação prevista

```
apps/api/src/
├── metrics/
│   ├── metrics.module.ts
│   ├── metrics.controller.ts   # GET /metrics
│   ├── metrics.service.ts      # prom-client registry
│   ├── ws-metrics.interceptor.ts
│   └── metrics.md
```

Middleware/interceptor registra latência HTTP automaticamente; gateway WS incrementa counters por evento.

---

## Métricas de produto (analytics)

Eventos enviados do **web** para Plausible/PostHog (respeitando LGPD — sem PII desnecessário; consentimento se exigido).

### Aquisição e retenção

| Evento | Propriedades | Quando |
|--------|--------------|--------|
| `signup_complete` | `provider: google` | Primeiro login |
| `session_start` | `plan` | Abertura do app autenticado |
| `return_visit` | `days_since_last` | Visita recorrente |

### Engajamento por feature

| Evento | Propriedades | Quando |
|--------|--------------|--------|
| `campaign_created` | — | Nova campanha |
| `campaign_joined` | `role` | Aceite de convite |
| `character_saved` | — | Save ficha OP |
| `document_saved` | `visibility` | Autosave doc |
| `map_opened` | — | Aba mapa |
| `map_token_moved` | — | Drag token (amostragem opcional) |
| `presentation_opened` | — | Nova aba /present |
| `dice_rolled` | `type: skill \| free` | Rolagem concluída |
| `board_node_added` | `tag` | Novo nó no quadro |

### SaaS

| Evento | Propriedades | Quando |
|--------|--------------|--------|
| `plan_viewed` | `plan: free \| premium` | Carregamento perfil |
| `upgrade_cta_clicked` | — | Clique em “Remover anúnsios” (pós-MVP) |

### Anúncios (complementar ao AdSense)

| Evento | Propriedades | Quando |
|--------|--------------|--------|
| `ad_slot_rendered` | `placement` | Slot exibido (free only) |
| `ad_slot_skipped` | `reason: premium \| present \| disabled` | Ad não exibido |

```
apps/web/src/
├── lib/analytics/
│   ├── AnalyticsProvider.tsx
│   ├── track.ts
│   └── analytics.md
```

---

## Métricas de negócio (API — agregados)

Consultas periódicas ou counters Prometheus derivados do banco (não expor dados sensíveis no `/metrics` público).

| KPI | Fonte | Uso |
|-----|-------|-----|
| Usuários totais | `users` count | Dashboard interno |
| Campanhas ativas | `campaigns` + atividade 30d | Produto |
| Sessões WS pico | `ws_connections_active` max | Capacidade |
| Rolagens/dia | `dice_rolls` count | Engajamento |
| Ratio free/premium | `users.plan` | SaaS |
| Média clientes/campanha | WS gauge | Meta 4+ |

Endpoint interno futuro: `GET /admin/stats` (auth admin, pós-MVP) ou painel Grafana com queries SQL.

---

## Core Web Vitals (web)

Reportar via `web-vitals` para analytics ou Sentry:

| Métrica | Meta (referência) |
|---------|-------------------|
| LCP | < 2,5 s |
| INP | < 200 ms |
| CLS | < 0,1 |

Prioridade em rotas pesadas: mapa (PixiJS), quadro (React Flow).

---

## Logs estruturados

Formato JSON (`pino`) com campos consistentes:

```json
{
  "level": "info",
  "msg": "ws.broadcast",
  "campaignId": "uuid",
  "event": "map:token_move",
  "durationMs": 12,
  "requestId": "..."
}
```

| Nível | Exemplos |
|-------|----------|
| `error` | Falha DB, WS auth rejeitado, rolagem inválida |
| `warn` | Reconexão, rate limit camera_sync |
| `info` | Login, join campaign, deploy health |
| `debug` | Dev only — payload WS |

Nunca logar: tokens JWT, conteúdo completo de ficha, PII além de `userId` hashado se necessário.

---

## Alertas sugeridos (produção)

| Alerta | Condição | Severidade |
|--------|----------|------------|
| API down | `/health` falha 2 min | Crítico |
| Erro 5xx alto | > 5% requests 5 min | Crítico |
| Latência REST | p95 > 1 s 10 min | Warning |
| WS desconectando | `ws_reconnections_total` spike | Warning |
| DB pool esgotado | `db_pool_active` = max | Crítico |
| Sync lento | `ws_broadcast_duration` p95 > 200 ms | Warning |

---

## Fases de implementação

| Fase | Entregável métricas |
|------|---------------------|
| **0** | `/health`, `/health/ready`, logs `pino`, requestId |
| **3** | Counters WS, gauge conexões, log join/leave |
| **5** | Counter `dice_rolls` (Prometheus + persistência) |
| **7** | `GET /metrics`, Grafana, Plausible/PostHog, Web Vitals, alertas básicos |

---

## Variáveis de ambiente

```env
# apps/api
LOG_LEVEL=info
METRICS_ENABLED=true
METRICS_PATH=/metrics

# apps/web
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=loreforge.example.com
# ou NEXT_PUBLIC_POSTHOG_KEY=...

# opcional
SENTRY_DSN=
```

---

## Checklist

- [ ] `/health` e `/health/ready` documentados no Swagger
- [ ] Logs JSON estruturados na API
- [ ] `GET /metrics` com counters HTTP e WS
- [ ] Analytics produto no web (eventos principais)
- [ ] Web Vitals nas rotas críticas
- [ ] Eventos `ad_slot_*` integrados com [monetizacao.md](monetizacao.md)
- [ ] Dashboard Grafana ou equivalente em produção
- [ ] Alertas mínimos configurados
- [ ] Política de privacidade menciona analytics (LGPD)

---

## Referências

- [Prometheus client (Node)](https://github.com/siimon/prom-client)
- [NestJS Terminus](https://docs.nestjs.com/recipes/terminus)
- [Plausible](https://plausible.io/)
- [web-vitals](https://github.com/GoogleChrome/web-vitals)
