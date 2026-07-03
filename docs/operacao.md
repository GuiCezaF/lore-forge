# Operação

## Modelo SaaS

| Plano | Features MVP | Anúncios | Disponibilidade |
|-------|--------------|----------|-----------------|
| Free | Todas | Sim, Google AdSense | Lançamento |
| Premium | Iguais ao Free | Não | Pós-MVP |

Nenhuma feature de jogo fica bloqueada no Free durante o MVP. Premium remove anúncios.

Modo apresentação nunca exibe anúncios. Em desenvolvimento, `NEXT_PUBLIC_ADS_ENABLED=false` evita cliques inválidos.

## AdSense

Pré-requisitos:

- Domínio publicado com HTTPS.
- Política de privacidade e termos de uso.
- Conta AdSense aprovada para o domínio.
- Conformidade com a Licença da Comunidade.

Implementação prevista no web:

```
apps/web/src/components/ads/
  AdProvider.tsx
  AdSlot.tsx
  useShowAds.ts
```

Regras:

- Componentes de ad são client-side.
- Lazy load em slots fora da viewport.
- Ads não sobrepõem controles críticos.
- Ads ausentes em `/present`, `premium` e `ADS_ENABLED=false`.

## Observabilidade

Objetivos:

- Monitorar uptime, latência REST e erros.
- Validar sync WebSocket com 4 clientes.
- Medir uso de campanhas, mapa, rolagens, quadro e apresentação.
- Correlacionar eventos de anúncios com analytics.

Stack prevista:

| Camada | Ferramenta |
|--------|------------|
| Health | `@nestjs/terminus` |
| Métricas API | `prom-client` e `GET /metrics` |
| Logs | `pino` JSON |
| Dashboards | Grafana ou equivalente |
| Analytics | Plausible ou PostHog |
| Ads | Google AdSense + eventos client |

### Métricas API

| Métrica | Tipo | Uso |
|---------|------|-----|
| `http_requests_total` | Counter | volume REST por rota/status |
| `http_request_duration_seconds` | Histogram | latência REST |
| `http_errors_total` | Counter | erros 4xx/5xx |
| `ws_connections_active` | Gauge | conexões WS abertas |
| `ws_messages_total` | Counter | mensagens por tipo/direção |
| `ws_broadcast_duration_seconds` | Histogram | tempo publish -> broadcast |
| `redis_pubsub_messages_total` | Counter | tráfego pub/sub |

Evite label de alta cardinalidade em scrape público, como `campaign_id` bruto.

### Analytics web

Eventos principais:

- `signup_complete`.
- `campaign_created`.
- `campaign_joined`.
- `character_saved`.
- `document_saved`.
- `map_opened`.
- `map_token_moved`.
- `presentation_opened`.
- `dice_rolled`.
- `board_node_added`.
- `ad_slot_rendered`.
- `ad_slot_skipped`.

Core Web Vitals: LCP, INP e CLS, com atenção especial para mapa e quadro.

### Logs

Logs estruturados JSON com `requestId`. Nunca logar JWT, refresh token, conteúdo completo de ficha, segredos ou PII desnecessária.

## Alertas

| Alerta | Condição |
|--------|----------|
| API down | `/health` falha por 2 min |
| Erros 5xx altos | mais de 5% por 5 min |
| Latência REST | p95 acima de 1 s por 10 min |
| WS lento | p95 de broadcast acima de 200 ms |
| DB pool esgotado | pool ativo no limite |

## Variáveis de ambiente

```env
# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=
API_BASE_URL=http://localhost:3000
FRONTEND_BASE_URL=http://localhost:3001
POST_LOGIN_REDIRECT_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/loreforge
REDIS_URL=redis://localhost:6379

# Storage
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=loreforge
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Apps
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Ads
NEXT_PUBLIC_GOOGLE_ADS_CLIENT=
NEXT_PUBLIC_ADS_ENABLED=false

# Metrics and logs
LOG_LEVEL=info
METRICS_ENABLED=true
METRICS_PATH=/metrics

# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=false
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
NEXT_PUBLIC_POSTHOG_KEY=

# Recap IA pós-MVP
SESSION_RECAP_AI_ENABLED=false
SESSION_RECAP_AI_ALLOW_COMMERCIAL=false
```

### Google OAuth local

Para testar login em desenvolvimento:

1. Crie um OAuth client do tipo Web application no Google Cloud Console.
2. Configure a tela de consentimento OAuth e adicione seu e-mail como usuário de teste.
3. Cadastre o redirect URI `http://localhost:3000/auth/google/callback`, ou o valor configurado em `GOOGLE_OAUTH_REDIRECT_URI`.
4. Copie `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` para `apps/api/.env`.

`.env` mínimo da API:

```env
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
JWT_SECRET=uma-string-aleatoria-longa
API_BASE_URL=http://localhost:3000
FRONTEND_BASE_URL=http://localhost:3001
POST_LOGIN_REDIRECT_URL=http://localhost:3001
```

Complemento no web:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Fases operacionais

| Fase | Entregável |
|------|------------|
| 0 | `/health`, `/health/ready`, logs e requestId |
| 3 | métricas WS e logs de presença |
| 5 | métricas de rolagem |
| 7 | `/metrics`, dashboards, analytics, Web Vitals, AdSense e alertas |
