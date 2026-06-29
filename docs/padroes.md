# Padrões — Documentação e Testes

Convenções obrigatórias para `apps/api` e `apps/web`. Todo módulo nasce documentado e testado.

---

## Princípios

| Princípio | API | Web |
|-----------|-----|-----|
| Documentação | Swagger (REST) + `.md` por módulo | `.md` por domínio de UI |
| Testes | **TDD** — teste antes da implementação | Testes junto com a feature |
| Contrato | Swagger é fonte da verdade REST | Tipos espelhados + testes de integração |

---

## apps/api — Backend

### TDD (obrigatório)

Ciclo **Red → Green → Refactor** em toda feature:

1. Escrever teste que falha (unit ou e2e)
2. Implementar o mínimo para passar
3. Refatorar mantendo testes verdes
4. Atualizar Swagger e `.md` do módulo

**Pirâmide de testes:**

```
        /  e2e  \          poucos — fluxos críticos (auth, CRUD, WS)
       / integr. \         módulos com banco (Testcontainers ou PG de teste)
      /   unit    \        serviços, rpg/dice, guards, pipes
```

| Tipo | Ferramenta | O quê testar |
|------|------------|--------------|
| Unit | Jest | `rpg/dice`, services, validators |
| Integração | Jest + Supertest | controllers + DB |
| E2E | Jest + Supertest | fluxos HTTP completos |
| WS | Jest + socket.io-client | gateway, rooms, broadcast |

### Swagger (desde a Fase 0)

Integrado na bootstrap da aplicação — **não adiar**.

- Pacote: `@nestjs/swagger`
- UI: `GET /api/docs` (dev e prod; proteger em prod se necessário)
- Export: `openapi.json` gerado no build (`pnpm --filter @loreforge/api openapi:export`)

**Todo endpoint REST deve ter:**

- `@ApiTags('nome-modulo')` no controller
- `@ApiOperation({ summary: '...' })` por rota
- `@ApiResponse` para 200, 400, 401, 403, 404
- DTOs com `@ApiProperty` / `@ApiPropertyOptional`
- `@ApiBearerAuth()` em rotas autenticadas

**WebSocket:** Swagger não cobre WS. Documentar em `apps/api/docs/ws-events.md` + validação Zod no gateway.

### Documentação `.md` por módulo

Cada módulo NestJS em `src/<modulo>/` inclui `<modulo>.md` na mesma pasta:

```
apps/api/src/campaigns/
├── campaigns.controller.ts
├── campaigns.service.ts
├── campaigns.module.ts
├── dto/
├── campaigns.spec.ts      # testes
└── campaigns.md           # doc do módulo
```

Conteúdo mínimo do `.md`:

- Objetivo do módulo
- Endpoints (link para Swagger tag correspondente)
- Regras de negócio e RBAC
- Entidades/tabelas tocadas
- Eventos WS emitidos/consumidos (se houver)

Índice central: [apps/api/docs/README.md](../apps/api/docs/README.md).

---

## apps/web — Frontend

### Testes

| Tipo | Ferramenta | O quê testar |
|------|------------|--------------|
| Unit | Vitest | hooks, utils, schemas Zod, formatters |
| Componente | Vitest + RTL | formulários, botões de rolagem, empty states |
| Integração | MSW + RTL | fluxos que chamam API mockada |
| E2E | Cypress | login, CRUD campanha, sync mapa (4 abas), apresentação |

Testes acompanham a feature — PR/commit sem teste para lógica nova não entra.

### Documentação `.md` por domínio

Estrutura E2E:

```
apps/web/
├── cypress/
│   ├── e2e/           # specs (.cy.ts)
│   ├── fixtures/
│   └── support/
└── cypress.config.ts
```

Exemplo componente:
```
apps/web/src/components/tabletop/
├── TabletopCanvas.tsx
├── ...
└── tabletop.md
```

Conteúdo mínimo:

- Responsabilidade da área
- Props/contratos principais
- Dependências (API endpoints, eventos WS)
- Estados de UI (loading, error, empty)
- Como testar manualmente

Índice central: [apps/web/docs/README.md](../apps/web/docs/README.md).

### Alinhamento com Swagger

- Cliente HTTP tipado manualmente ou gerado de `openapi.json` (Fase 1+)
- Ao adicionar endpoint na API, atualizar cliente web + teste MSW correspondente

---

## Checklist por feature (ambos os apps)

- [ ] Teste escrito (TDD na API; junto na web)
- [ ] Implementação passando em CI
- [ ] Swagger atualizado (API REST)
- [ ] `.md` do módulo/domínio atualizado
- [ ] Critério de aceite da fase verificado

---

## CI (previsto)

```yaml
# pipeline mínimo
- pnpm lint
- pnpm test          # unit + integração (api + web)
- pnpm test:e2e      # api e2e + cypress (Fase 7)
- pnpm build
- openapi:export     # valida spec gerada
```

---

## Conformidade — Licença Ordem Paranormal

Módulos que tocam regras ou UI do sistema OP devem referenciar [conformidade-loreforge.md](licenca-ordem-paranormal/conformidade-loreforge.md):

- `src/rpg/` — terminologia permitida; sem texto oficial dos livros
- componentes de ficha — sem templates de cânone
- `legal/` — selo e disclaimer obrigatórios desde a Fase 0

---

## Referências

- [NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Vitest](https://vitest.dev/)
- [Cypress](https://www.cypress.io/)
- [MSW](https://mswjs.io/)
