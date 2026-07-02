# auth — Bounded Context (DDD)

Responsabilidade: autenticação e sessão. Implementado como bounded context com camadas api/application/domain/infrastructure.

Estrutura (sugerida):

```
apps/api/src/modules/auth/
  api/
    controllers/
    dtos/
  application/
    use-cases/
    dto/
    services/    # aplicação (ex.: RotateRefreshTokenUseCase)
  domain/
    entities/    # Auth-related entities if needed
    value-objects/
    repositories/ # interfaces (ex.: ISessionRepository)
    services/     # domain services (ex.: TokenService)
    events/
  infrastructure/
    oauth/        # Google OAuth adapter
    repositories/ # session persistence
    jwt/          # implementation details
  auth.md
```

Rotas principais (Presentation/controller):

- `GET /auth/google` — inicia OAuth flow
- `GET /auth/google/callback` — finaliza OAuth, cria usuário via UseCase se necessário
- `POST /auth/refresh` — troca refresh token por novo access token
- `POST /auth/logout` — revoga sessão
- `GET /auth/me` — retorna dados do usuário autenticado via UserProjection/UseCase

Regras e boas práticas:

- Tokens e rotação: valida expiração, issuer e audience no backend (TokenService no Domain/Application)
- Persistir apenas o necessário (ex.: sessions table com refresh token hashes) — não armazenar tokens em plaintext
- UseCases orquestram verificação de sessão e emissão de tokens; Domain model encapsula regras sensíveis
- Implementar testes unitários para a lógica de rotação e verificação de tokens

Segurança:

- Cookies de sessão (quando usados) devem ser `httpOnly`, `secure` e `sameSite=strict`
- Rate limit em `POST /auth/refresh` e endpoints de login
- Não expor mensagens de erro internas
- Logar tentativas de login suspeitas sem incluir segredos

Documentação:

- Atualizar `auth.md` quando mudar contracts (rotas, DTOs, comportamento)
- Documentar no Swagger detalhes de autorização (`@ApiBearerAuth()`)

