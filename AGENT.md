## Visão geral do produto

LoreForge é uma plataforma web de mesa virtual para RPG, com foco inicial em **Ordem Paranormal RPG**.

Escopo do MVP:

- login via Google OAuth
- campanhas e personagens
- documentos rich-text do mestre
- mapa tabletop em tempo real
- modo apresentação
- rolagem de dados com regras de Ordem Paranormal
- quadro de investigações

Fora do MVP:

- checkout Premium
- balanceador de homebrew
- outros sistemas de RPG
- áudio e vídeo
- app nativo

## Arquitetura do monorepo

O projeto é organizado como um monorepo com **dois apps autocontidos**:

- `apps/web`: frontend Next.js
- `apps/api`: backend NestJS

Regra central:

- **não existe compartilhamento de pacotes entre web e api**
- a comunicação acontece apenas por **REST** e **WebSocket**
- a API é a **fonte da verdade** para regras de negócio, validação e persistência
- o frontend espelha contratos e tipos para consumo, mas não define regra autoritativa

### Fronteira entre apps

`apps/web` é responsável por:

- UI
- estado de tela
- cliente HTTP
- cliente WebSocket
- validações de formulário
- renderização de mapa, quadro e docs

`apps/api` é responsável por:

- autenticação
- persistência
- RBAC
- regras de Ordem Paranormal
- validação autoritativa
- gateway WebSocket
- storage
- métricas e healthchecks

## Contratos de integração

### REST

- documentado com Swagger desde o início
- `/api/docs` é parte do contrato público do backend
- cada endpoint precisa de tags, summaries e responses documentados
- o frontend consome o `openapi.json` exportado pela API

### WebSocket

- os eventos são documentados em `apps/api/docs/ws-events.md`
- o frontend deve espelhar os tipos em `apps/web/src/types/ws-events.ts`
- payload inbound deve ser validado com Zod
- a API deve manter a semântica dos eventos como contrato estável

## Regras de negócio consolidadas

### 1. Autenticação e conta

- login exclusivamente via Google OAuth
- a API emite JWT de acesso e refresh
- rotas protegidas exigem autenticação
- o usuário tem plano `free` ou `premium`
- no MVP, todos os usuários começam em `free`

### 2. Campanhas e papéis

Cada campanha possui membros com papel:

- `gm`
- `player`
- `spectator`

Regras principais:

- o mestre cria, edita e remove campanhas das quais é dono
- jogadores entram por convite
- espectadores têm acesso somente leitura, principalmente no modo apresentação
- a tela da campanha organiza a experiência em abas: Personagens, Sessão, Docs, Mapa e Quadro

### 3. Personagens

- personagens são vinculados à campanha
- a ficha inicial é baseada em Ordem Paranormal RPG
- a ficha MVP inclui:
  - identidade
  - atributos
  - recursos
  - perícias
  - combate
  - inventário
  - notas
- rituais e poderes complexos ficam em campo livre no MVP
- a API valida a estrutura da ficha
- o mestre pode visualizar as fichas dos jogadores da campanha

### 4. Documentos do mestre

- documentos são rich-text
- o mestre controla visibilidade:
  - somente mestre
  - visível aos jogadores
- suportam upload de imagens via URL assinada
- possuem autosave
- jogadores só veem documentos públicos

### 5. Mapa tabletop

- o mestre faz upload do mapa
- o mapa pode ter grid configurável
- tokens podem ser vinculados a personagens
- movimentação de tokens sincroniza em tempo real
- o mestre pode mover qualquer token
- o jogador só move o próprio token, quando permitido
- o mapa suporta fog of war
- zoom e pan fazem parte da experiência
- a câmera pode ser sincronizada para o modo apresentação

### 6. Modo apresentação

- abre em nova aba em `/campaign/[id]/present`
- exibe apenas o canvas do mapa
- não mostra sidebars nem controles de edição
- usa a mesma autenticação da sessão principal
- o papel é `spectator`
- nunca exibe anúncios
- pode alternar entre visão do mestre e mapa revelado

### 7. Rolagem de dados

- jogadores rolam perícias e atributos a partir da ficha
- há rolagem livre para expressões genéricas
- o motor de dados de Ordem Paranormal fica na API
- a API recalcula a rolagem da ficha para evitar cheat
- resultados são compartilhados com todos os participantes
- o mestre pode informar DT opcional para testes

### 8. Quadro de investigações

- o quadro usa nós editáveis de texto
- nós podem ser arrastados, redimensionados e conectados
- há suporte a riscado para descartar pistas
- há tags e cores para classificar conteúdo
- alterações sincronizam em tempo real
- o mestre pode editar tudo
- o jogador edita conforme permissão configurada

### 9. Sessão e tempo real

- cada campanha corresponde a uma room WebSocket
- ao entrar, o cliente recebe snapshot do estado atual
- há reconexão automática
- presença de entrada e saída é broadcastada
- o sistema deve suportar pelo menos 4 clientes simultâneos por campanha

### 10. Monetização

- modelo SaaS com `free` e `premium`
- o MVP lança com todos os usuários em `free`
- o plano `free` exibe anúncios do Google AdSense
- o plano `premium` remove apenas anúncios
- o modo apresentação nunca exibe anúncios
- o pagamento do Premium é pós-MVP

### 11. Métricas e observabilidade

- API expõe `/health` e `/health/ready`
- API expõe `/metrics`
- logs devem ser estruturados em JSON
- o frontend envia eventos de produto e Web Vitals
- o objetivo é acompanhar latência, estabilidade de WebSocket e uso de produto

## Regras técnicas obrigatórias

### Backend

- usar NestJS
- usar Drizzle com PostgreSQL
- usar Redis para pub/sub de tempo real
- usar storage S3 compatível
- seguir TDD em toda feature de negócio
- não introduzir endpoint REST sem Swagger
- não introduzir regra autoritativa fora da API

### Frontend

- usar Next.js
- usar Zustand para estado de UI
- usar TanStack Query para dados remotos
- usar PixiJS no mapa
- usar React Flow no quadro
- usar TipTap nos documentos
- não importar código da API
- manter tipos espelhados e alinhados ao contrato

## Padrões de documentação e teste

- todo módulo da API deve ter um `.md` ao lado do código
- todo domínio relevante do frontend deve ter um `.md`
- backend segue ciclo Red → Green → Refactor
- testes esperados:
  - API: Jest unit, integração e e2e
  - Web: Vitest, RTL, MSW e Cypress
- a documentação e os testes devem caminhar juntos com a feature

## Convenções de implementação

Ao implementar uma funcionalidade que cruza frontend e backend:

1. começar pela API com teste
2. implementar endpoint, validação e documentação
3. espelhar contrato no frontend
4. cobrir UI com teste
5. atualizar documentação do módulo/domínio

## Restrições de domínio

- Ordem Paranormal é tratado como fan content
- não usar assets oficiais sem licença
- o MVP não inclui balanceamento de homebrew
- o Premium não pode bloquear features de jogo no MVP

## Critérios de aceitação do MVP

O MVP só é considerado pronto quando existir:

- login Google funcional
- campanha com convites
- fichas de Ordem Paranormal
- docs do mestre com permissões
- mapa sincronizado com 4 clientes
- modo apresentação limpo em nova aba
- rolagem de dados com log compartilhado
- quadro de investigações em tempo real
- Swagger e documentação por módulo/domínio
- testes automatizados passando
- ads no `free` e ocultos em `present` e `premium`
- métricas e analytics básicos operacionais

## Arquivos de referência

- [README.md](README.md)
- [monorepo.md](monorepo.md)
- [plano-mvp.md](plano-mvp.md)
- [docs/requisitos.md](docs/requisitos.md)
- [docs/padroes.md](docs/padroes.md)
- [docs/monetizacao.md](docs/monetizacao.md)
- [docs/metricas.md](docs/metricas.md)
- [apps/web/web.md](apps/web/web.md)
- [apps/api/api.md](apps/api/api.md)
- [apps/api/docs/ws-events.md](apps/api/docs/ws-events.md)
