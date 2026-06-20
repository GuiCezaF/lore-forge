# WebSocket — Eventos

Documentação dos eventos do gateway (`apps/api/src/gateway/`). Swagger cobre apenas REST; este arquivo é a referência do contrato WS.

Validação: Zod em todo payload **inbound**. Respostas de erro: evento `error` com `{ code, message }`.

---

## Conexão

| Ação | Payload | Descrição |
|------|---------|-----------|
| `join_campaign` | `{ campaignId, role? }` | Entra na room; recebe snapshot de estado |
| `leave_campaign` | `{ campaignId }` | Sai da room |

## Presença

| Evento | Direção | Payload |
|--------|---------|---------|
| `presence:join` | S → all | `{ userId, displayName, role }` |
| `presence:leave` | S → all | `{ userId }` |

## Dados

| Evento | Direção | Payload |
|--------|---------|---------|
| `dice:roll` | C → S → all | `{ characterId?, formula?, skillId?, dt? }` |
| `dice:roll_result` | S → all | `{ rollId, userId, result, breakdown, isCritical, isDisaster }` |

Rolagem recalculada no servidor — ver `src/rpg/dice/`.

## Mapa

| Evento | Direção | Payload |
|--------|---------|---------|
| `map:token_move` | C → S → all | `{ tokenId, x, y }` |
| `map:fog_update` | C → S → all | `{ zones }` |
| `map:camera_sync` | C → S → all | `{ zoom, panX, panY }` |
| `map:presentation_mode` | C → S → all | `{ view: 'gm' \| 'revealed' }` |

## Quadro de investigações

| Evento | Direção | Payload |
|--------|---------|---------|
| `board:node_update` | C → S → all | `{ nodeId, data, version }` |
| `board:edge_update` | C → S → all | `{ edgeId, data, version }` |

---

Espelho de tipos no frontend: `apps/web/src/types/ws-events.ts`

Atualizar este arquivo e o espelho web **junto** com qualquer mudança no gateway.
