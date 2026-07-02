# users — Bounded Context (DDD)

Responsabilidade: gerenciar identidade do usuário, perfil, plano (`free` | `premium`) e regras relacionadas à conta.

Estrutura (obrigatória para este módulo):

```
apps/api/src/modules/users/
  api/
    controllers/
    dtos/
    pipes/
  application/
    use-cases/
    dto/
    mappers/
  domain/
    entities/
    value-objects/
    repositories/   # interfaces (IUserRepository)
    services/       # domain services (ex.: PasswordService)
    events/
    errors/
  infrastructure/
    orm/
    repositories/   # implementações (adapters)
    services/       # adaptadores externos
  users.md
```

Rotas principais (Presentation/controller):

- `GET /users/me` — retorna UserResponseDto (não expõe hashes/refresh tokens)
- `POST /users` — (se aplicável) CreateUser via UseCase
- `PATCH /users/me` — UpdateProfile via UseCase

Regras e boas práticas:

- Domain contém as invariantes do usuário (email como VO, validações de senha, geração de IDs)
- Defina `IUserRepository` no domain; a infra implementa `UserRepository` mapeando ORM ↔ Domain
- UseCases devem verificar autorização/ownership quando necessário
- Nunca retornar dados sensíveis (passwordHash, refreshToken) em DTOs de saída
- Testes: unit para Domain, unit para UseCases (com mocks), integration para repositório

Segurança:

- Validar TODO input com DTOs e class-validator/Zod
- Implementar rate limiting nas rotas sensíveis (login, refresh)
- Logar eventos de segurança (login falho, mudanças de plano) sem expor segredos

Documentação:

- Atualizar `users.md` quando novos use-cases ou eventos forem adicionados
- Mapear DTOs no Swagger (ex.: `@ApiResponse({ type: UserResponseDto })`)

