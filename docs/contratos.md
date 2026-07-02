# Contratos

## REST

REST é documentado por Swagger/OpenAPI na API.

- UI: `GET /api/docs`.
- Export: `pnpm --filter @loreforge/api openapi:export`.
- Todo endpoint público deve ter tags, operação, responses e auth quando aplicável.
- Todo DTO público deve ter schema OpenAPI suficiente para o frontend consumir.
- O frontend deve alinhar cliente e tipos ao OpenAPI exportado.

Swagger é a fonte de verdade para REST. Não duplique documentação de endpoint em arquivos separados, exceto quando houver decisão de arquitetura ou contrato não representável no OpenAPI.

## WebSocket

Swagger cobre apenas REST. Eventos WebSocket vivem neste documento e devem ser espelhados no frontend em `apps/web/src/types/ws-events.ts`.

Payload inbound deve ser validado com Zod. Erros retornam evento `error` com:

```json
{ "code": "string", "message": "string" }
```

### Conexão

| Ação | Payload | Descrição |
|------|---------|-----------|
| `join_campaign` | `{ campaignId, role? }` | Entra na room e recebe snapshot de estado |
| `leave_campaign` | `{ campaignId }` | Sai da room |

### Presença

| Evento | Direção | Payload |
|--------|---------|---------|
| `presence:join` | server -> all | `{ userId, displayName, role }` |
| `presence:leave` | server -> all | `{ userId }` |

### Dados

| Evento | Direção | Payload |
|--------|---------|---------|
| `dice:roll` | client -> server -> all | `{ characterId?, formula?, skillId?, dt? }` |
| `dice:roll_result` | server -> all | `{ rollId, userId, result, breakdown, isCritical, isDisaster }` |

Rolagem de ficha é recalculada no servidor.

### Mapa

| Evento | Direção | Payload |
|--------|---------|---------|
| `map:token_move` | client -> server -> all | `{ tokenId, x, y }` |
| `map:fog_update` | client -> server -> all | `{ zones }` |
| `map:camera_sync` | client -> server -> all | `{ zoom, panX, panY }` |
| `map:presentation_mode` | client -> server -> all | `{ view: "gm" \| "revealed" }` |

### Quadro de investigações

| Evento | Direção | Payload |
|--------|---------|---------|
| `board:node_update` | client -> server -> all | `{ nodeId, data, version }` |
| `board:edge_update` | client -> server -> all | `{ edgeId, data, version }` |

## Mudança de contrato

Ao alterar REST ou WS:

1. Atualize Swagger ou esta página.
2. Atualize tipos do frontend.
3. Atualize mocks MSW quando aplicável.
4. Cubra o fluxo com teste.
