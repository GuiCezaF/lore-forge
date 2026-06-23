# users

Responsável pelo perfil autenticado, plano do usuário e futura persistência via Drizzle.

Rotas:

- `GET /users/me`

Regras:

- fonte da verdade do usuário autenticado
- não expor refresh tokens ou hashes
- manter compatibilidade com o schema Drizzle quando a persistência for ligada

