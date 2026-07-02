# Padrões — Documentação, Testes e DDD

Este documento consolida convenções obrigatórias para `apps/api` e `apps/web`, agora alinhadas ao padrão Domain‑Driven Design (DDD) no backend. Todo módulo da API deve explicitar o bounded context e as camadas (api/application/domain/infrastructure).

---

## Princípios

| Princípio | API | Web |
|-----------|-----|-----|
| Documentação | Swagger (REST) + `.md` por módulo com seção DDD | `.md` por domínio de UI |
| Testes | **TDD** — testes de domínio primeiro, depois aplicação e infra | Testes junto com a feature |
| Contrato | Swagger é fonte da verdade REST | Tipos espelhados + testes de integração |

---

## apps/api — Backend (DDD)

### Ciclo TDD (com foco em Domain)

Fluxo recomendado por feature (DDD aware):

1. Escrever testes unitários do Domain (invariantes, behavior do aggregate) — falha
2. Escrever testes de Application (use‑case) com repositório mock — falha
3. Implementar Domain e UseCase mínimos para passar os testes
4. Implementar Infra (repositório real + mappers) e testes de integração
5. Expor Presentation (controller) e documentar no Swagger
6. Refatorar mantendo testes verdes

**Prioridades de testes:**
- Domain (behavior e invariantes) — unit
- Application (use‑cases) — unit com mocks
- Infrastructure (repos) — integration
- Presentation (controllers/gateway) — integration/e2e

### Estrutura por módulo (obrigatório)

Cada bounded context deve seguir este padrão de pastas dentro de `apps/api/src/modules/<context>`:

```
<module>/
  api/                # controllers, DTOs HTTP, pipes, guards
  application/        # use-cases, application DTOs, mappers, transaction boundaries
  domain/             # entities (aggregate roots), value objects, repository interfaces, domain services, events, errors
  infrastructure/     # ORM models, repository implementations, external adapters
  <module>.md         # documentação do módulo (inclui seção DDD)
```

### Regras e convenções DDD

- Domain não deve importar infra. Coloque interfaces de repositório no domain.
- Nomeie interfaces com `I` (ex.: `IUserRepository`) e implemente-as em infra (`UserRepository`).
- Use Value Objects para representar conceitos com validação (EmailVO, UUID, Money, etc.).
- Agregados devem preservar invariantes internamente; expose methods that mutate state.
- UseCases devem ser pequenos, com única responsabilidade e orquestrar repositórios/domain services.
- Mapear explicitamente entre ORM models e Domain entities com mappers.
- Domain Events são publicados pelo Domain ou pelo UseCase; usar Outbox para integridade entre DB e broker.

### Documentação `.md` por módulo (obrigatória)

Além do conteúdo anterior, cada `<module>.md` deve conter:
- Bounded Context: propósito e limites
- Camadas: breve diagrama de pastas e responsabilidades
- Aggregate Roots e principais VOs
- Principais UseCases (com links para DTOs/rotas)
- Repositórios (interfaces) e implementações
- Domain Events emitidos / Integration Events
- Regras de segurança e ownership (quem pode fazer o quê)

Índice central: [apps/api/docs/README.md](../apps/api/docs/README.md).

---

## apps/web — Frontend

Mantém-se a convenção de documentação por domínio e testes. O frontend não deve impor regras de negócio; espelha DTOs e schemas para uma melhor UX (validação client-side com Zod), mas a API é a autoridade.

### Testes

Mesmas categorias descritas anteriormente (Unit, Componente, Integração, E2E). As validações e schemas Zod no frontend servem para UX; toda validação crítica é revalidada no backend.

### Alinhamento com API DDD

- Ao consumir um endpoint cujo servidor implementa DDD, prefira gerar/espelhar tipos do OpenAPI e manter mappers locais se necessário.
- As mudanças nos contratos da API devem ser versionadas e documentadas no `<module>.md` correspondente.

---

## Checklist por feature (ambos os apps)

- [ ] Testes de Domain escritos e verdes (API)
- [ ] Testes de Application (UseCases) escritos e verdes (API)
- [ ] Repositório (infra) com testes de integração
- [ ] Controller/Presentation documentada e coberta por testes de integração/e2e
- [ ] `openapi.json` atualizado quando alterar contrato
- [ ] `<module>.md` atualizado com seção DDD

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

## Referências e boas práticas

- Defina claramente os Aggregates e seus limites. Evite aggregates gigantescos.
- Prefira composition sobre inheritance no Domain.
- Use UoW/transactions no nível do UseCase quando múltiplos repositórios são envolvidos.
- Considere CQRS para módulos com alta separação leitura/escrita.
- Use Outbox Pattern para garantir entrega de Integration Events.

---

## Conformidade — Licença Ordem Paranormal

Módulos que tocam regras ou UI do sistema OP devem referenciar [conformidade-loreforge.md](licenca-ordem-paranormal/conformidade-loreforge.md).

- `src/rpg/` — terminologia permitida; sem texto oficial dos livros
- componentes de ficha — sem templates de cânone
- `legal/` — selo e disclaimer obrigatórios desde a Fase 0

---

## Referências

- [Domain‑Driven Design — Eric Evans]
- [Implementing Domain‑Driven Design — Vaughn Vernon]
- [NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [MSW](https://mswjs.io/)
