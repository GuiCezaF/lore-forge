# Produto

LoreForge é uma plataforma web de mesa virtual para RPG, com foco inicial em Ordem Paranormal RPG. O objetivo do MVP é permitir que mestres e jogadores conduzam uma sessão completa sem alternar entre várias ferramentas.

## Escopo do MVP

- Login via Google OAuth.
- CRUD de campanhas e personagens.
- Fichas compatíveis com terminologia geral permitida pela Licença da Comunidade.
- Documentos rich-text do mestre, com visibilidade privada ou pública.
- Mapa tabletop em tempo real com grid, tokens, fog of war, zoom e pan.
- Modo apresentação em nova aba, sem anúncios e sem controles de edição.
- Rolagem de dados em tempo real, recalculada pela API.
- Quadro de investigações com nós, conexões, tags, cores e sincronização.
- Observabilidade básica, AdSense no plano Free e conformidade legal.

Fora do MVP: checkout Premium, balanceador de homebrew, outros sistemas de RPG, áudio/vídeo, app nativo e offline first.

## Papéis

| Papel | Descrição |
|-------|-----------|
| Mestre (`gm`) | Dono da campanha; controla mapa, documentos, fog, modo apresentação e quadro |
| Jogador (`player`) | Participa da campanha, edita ficha e interage conforme permissões |
| Espectador (`spectator`) | Acesso somente leitura, usado principalmente no modo apresentação |

## Requisitos funcionais

### Autenticação e conta

- Login exclusivamente via Google OAuth.
- API emite access token e refresh token.
- Rotas protegidas exigem autenticação.
- Usuário possui plano `free` ou `premium`; no MVP todos começam em `free`.

### Campanhas e personagens

- Usuário autenticado cria, lista, edita e exclui campanhas das quais é mestre.
- Mestre convida jogadores via link ou código.
- Campanha possui membros com papel `gm`, `player` ou `spectator`.
- Personagem pertence a uma campanha e a ficha inicial cobre identidade, atributos, recursos, perícias, combate, inventário e notas.
- API valida a estrutura da ficha e mantém as regras autoritativas.

### Documentos do mestre

- Mestre cria documentos rich-text.
- Visibilidade: somente mestre ou jogadores.
- Suporte a imagens via upload com URL assinada.
- Autosave e controle de acesso por campanha.

### Mapa e apresentação

- Mestre envia mapa, configura grid, fog of war e tokens.
- Movimento de tokens sincroniza via WebSocket.
- Jogador move apenas o próprio token quando permitido.
- Modo apresentação abre em `/campaign/[id]/present`, exibe canvas limpo, usa papel `spectator` e nunca mostra anúncios.

### Rolagem de dados

- Jogadores rolam perícias, atributos e fórmulas livres.
- A API recalcula rolagens de ficha para evitar fraude.
- Resultados são compartilhados com todos os participantes.
- Mestre pode informar DT opcional.

### Quadro de investigações

- Nós editáveis de texto com tags, cores, redimensionamento, arraste e conexões.
- Riscado para descartar pistas.
- Alterações sincronizadas em tempo real.
- Mestre edita tudo; jogador edita conforme permissão.

### Sessão e tempo real

- Cada campanha corresponde a uma room WebSocket.
- Ao entrar, cliente recebe snapshot do estado atual.
- Reconexão automática.
- Meta mínima: 4 clientes simultâneos por campanha com sync estável.

### Recap de sessão pós-MVP

- Mestre finaliza uma sessão e gera recap estruturado a partir de itens, rolagens, documentos e quadro.
- Recap narrativo por IA fica atrás de feature flag e só pode ser habilitado quando a conformidade legal permitir.

## Requisitos não funcionais

- Monorepo com `apps/web` e `apps/api`, sem import cruzado.
- Comunicação apenas por HTTP/OpenAPI e WebSocket.
- Backend com DDD nos contextos relevantes.
- TypeScript strict nos apps.
- Testes automatizados: Jest na API; Vitest, React Testing Library, MSW e Cypress no web.
- Sync de token com alvo de latência menor que 200 ms em rede local.
- Logs sem JWT, segredos ou PII desnecessária.
- Upload por URL assinada, sem credenciais S3 no cliente.
- Selo e disclaimer da Licença da Comunidade visíveis antes do lançamento.

## Roadmap

1. Fundação: auth, healthcheck, Swagger, logs, layout base e disclaimer legal.
2. Campanhas e personagens: CRUD, convites, ficha OP e RBAC.
3. Documentos: TipTap, permissões, autosave e upload.
4. Tempo real: gateway WebSocket, Redis pub/sub e presença.
5. Mapa tabletop e modo apresentação.
6. Rolagem de dados e log compartilhado.
7. Quadro de investigações.
8. Deploy, AdSense, métricas, dashboards e e2e.
9. Pós-MVP: Premium, recap de sessão, outros sistemas e homebrew.

## Critérios de aceite do MVP

- Login Google e dashboard funcionando.
- Campanhas, convites, fichas, documentos, mapa, rolagens e quadro integrados.
- Mapa sincronizado com pelo menos 4 clientes.
- Modo apresentação limpo em nova aba.
- Swagger em `/api/docs` e contratos WS atualizados.
- Testes automatizados passando.
- Ads no Free, ausentes em `/present` e no Premium.
- `/health`, `/health/ready`, `/metrics`, analytics e logs básicos.
- Selo e disclaimer da Licença da Comunidade.
