# Requisitos — LoreForge MVP

Documento consolidado de requisitos funcionais (RF) e não funcionais (RNF) do MVP.  
Diagramas: [loreforge-arquitetura.drawio](loreforge-arquitetura.drawio)

**Referências:** [LoreForge.md](../LoreForge.md) · [plano-mvp.md](../plano-mvp.md) · [monorepo.md](../monorepo.md) · [monetizacao.md](monetizacao.md) · [metricas.md](metricas.md) · [licenca-ordem-paranormal/conformidade-loreforge.md](licenca-ordem-paranormal/conformidade-loreforge.md)

---

## 1. Visão geral

**LoreForge** é uma plataforma web de mesa virtual para RPG, com foco inicial no sistema **Ordem Paranormal RPG**. Permite que mestres e jogadores conduzam sessões com fichas, documentos, mapa tabletop sincronizado, rolagem de dados e quadro de investigações integrados.

| Item | Descrição |
|------|-----------|
| Público | Mestres e jogadores de RPG de mesa |
| Sistema inicial | Ordem Paranormal RPG (Licença da Comunidade v1.0) |
| Licenciamento | [conformidade-loreforge.md](licenca-ordem-paranormal/conformidade-loreforge.md) |
| Escopo MVP | Todas as features de [LoreForge.md](../LoreForge.md), exceto balanceador de homebrew |
| Modelo | **SaaS** — Free (com ads) + Premium (sem ads); MVP lança só Free funcional |
| Fora do MVP | Checkout Premium, balanceador homebrew, outros sistemas, áudio/vídeo, offline, app nativo |

---

## 2. Atores e papéis

| Ator | Descrição |
|------|-----------|
| **Usuário** | Pessoa autenticada via Google |
| **Mestre (GM)** | Dono da campanha; controla mapa, docs, fog, apresentação e quadro |
| **Jogador** | Participante; edita ficha, rola dados, interage conforme permissões |
| **Espectador** | Cliente somente leitura do mapa (modo apresentação, nova aba) |
| **Google OAuth** | Provedor de identidade externo |
| **Google AdSense** | Rede de anúncios (tier Free) |

### Planos SaaS

| Plano | Features MVP | Anúncios |
|-------|--------------|----------|
| Free | Todas | Sim |
| Premium | Todas (igual Free) | Não |

Detalhes: [monetizacao.md](monetizacao.md)

---

## 3. Requisitos funcionais

### RF-01 — Autenticação

| ID | Requisito |
|----|-----------|
| RF-01.1 | O sistema deve permitir login exclusivamente via Google OAuth |
| RF-01.2 | Após login, o usuário recebe JWT (access + refresh) emitido pela API |
| RF-01.3 | Rotas protegidas no frontend devem redirecionar usuários não autenticados |
| RF-01.4 | O usuário autenticado deve ver um dashboard com suas campanhas |
| RF-01.5 | Usuário possui plano `free` ou `premium` (default `free` no MVP) |

### RF-02 — Campanhas

| ID | Requisito |
|----|-----------|
| RF-02.1 | Usuário autenticado pode criar, listar, editar e excluir campanhas das quais é mestre |
| RF-02.2 | Mestre pode convidar jogadores via link ou código |
| RF-02.3 | Jogador convidado pode aceitar convite e entrar na campanha |
| RF-02.4 | Cada campanha possui membros com papel: `gm`, `player` ou `spectator` |
| RF-02.5 | Tela da campanha organiza funcionalidades em abas: Personagens, Sessão, Docs, Mapa, Quadro |

### RF-03 — Personagens (Ordem Paranormal)

| ID | Requisito |
|----|-----------|
| RF-03.1 | Jogador pode criar, editar e excluir personagem vinculado à campanha |
| RF-03.2 | Ficha MVP inclui: identidade (nome, origem, classe, trilha, NEX), atributos (5), recursos (PV, PE, Sanidade), perícias, combate, inventário e notas |
| RF-03.3 | Dados da ficha são validados pela API (schema OP); apenas terminologia permitida pela Licença da Comunidade v1.0 |
| RF-03.4 | Mestre pode visualizar fichas dos jogadores da campanha |
| RF-03.5 | Rituais e poderes complexos ficam em campo livre (notas) no MVP |

### RF-04 — Documentos do mestre

| ID | Requisito |
|----|-----------|
| RF-04.1 | Mestre pode criar documentos rich-text (TipTap) na campanha |
| RF-04.2 | Mestre define visibilidade: somente mestre ou visível aos jogadores |
| RF-04.3 | Documentos suportam imagens via upload (presigned URL) |
| RF-04.4 | Documentos são salvos automaticamente (autosave) |
| RF-04.5 | Jogadores visualizam apenas documentos marcados como públicos |

### RF-05 — Mapa tabletop (tempo real)

| ID | Requisito |
|----|-----------|
| RF-05.1 | Mestre pode fazer upload de imagem de mapa |
| RF-05.2 | Mapa exibe grid opcional configurável |
| RF-05.3 | Tokens podem ser vinculados a personagens e movidos no mapa |
| RF-05.4 | Movimento de tokens sincroniza em tempo real entre clientes via WebSocket |
| RF-05.5 | Mestre move qualquer token; jogador move apenas o próprio (se permitido) |
| RF-05.6 | Mestre configura fog of war; jogadores veem versão filtrada |
| RF-05.7 | Mapa suporta zoom e pan |
| RF-05.8 | Câmera (zoom/pan) pode ser sincronizada para modo apresentação |

### RF-06 — Modo apresentação

| ID | Requisito |
|----|-----------|
| RF-06.1 | Mestre abre modo apresentação em nova aba (`/campaign/[id]/present`) |
| RF-06.2 | Modo apresentação exibe apenas o canvas do mapa, sem sidebars ou controles de edição |
| RF-06.3 | Papel espectador: somente leitura; sync de tokens e câmera |
| RF-06.4 | Mestre alterna visão: visão do mestre (com fog) ou mapa revelado (sem fog) |
| RF-06.5 | Mesma autenticação da sessão principal (sem link público no MVP) |

### RF-07 — Rolagem de dados (tempo real)

| ID | Requisito |
|----|-----------|
| RF-07.1 | Jogador rola perícias e atributos a partir da ficha Ordem Paranormal |
| RF-07.2 | Usuário pode realizar rolagem livre (ex.: `2d6+3`) |
| RF-07.3 | Motor OP na API: pool `Xd20`, crítico (20), desastre (1), regras para atributo 0/negativo |
| RF-07.4 | API recalcula rolagens de ficha (anti-cheat); web exibe resultado autoritativo |
| RF-07.5 | Log de rolagens visível para todos os participantes da sessão |
| RF-07.6 | Resultados sincronizam em tempo real via WebSocket |
| RF-07.7 | Mestre pode informar DT opcional para testes de perícia |

### RF-08 — Quadro de investigações

| ID | Requisito |
|----|-----------|
| RF-08.1 | Quadro permite nós de texto editáveis (título + corpo) |
| RF-08.2 | Nós podem ser arrastados, redimensionados e conectados por setas |
| RF-08.3 | Nós suportam toggle de riscado (strikethrough) para descartar pistas |
| RF-08.4 | Nós suportam tags/cores (pista, NPC, local, teoria) |
| RF-08.5 | Alterações sincronizam em tempo real (debounce em texto) |
| RF-08.6 | Mestre edita tudo; jogador cria/edita conforme permissão configurável |
| RF-08.7 | Quadro permanece na mesma sessão, sem abrir janelas externas |

### RF-09 — Tempo real e sessão

| ID | Requisito |
|----|-----------|
| RF-09.1 | Clientes entram em room WebSocket por `campaignId` |
| RF-09.2 | Ao entrar, cliente recebe snapshot do estado atual (mapa, quadro, presença) |
| RF-09.3 | Sistema suporta reconexão automática |
| RF-09.4 | Presença (join/leave) é broadcast para a campanha |
| RF-09.5 | Mínimo **4 clientes simultâneos** por campanha com sync estável |

### RF-10 — Documentação da API

| ID | Requisito |
|----|-----------|
| RF-10.1 | API expõe Swagger UI em `/api/docs` desde a Fase 0 |
| RF-10.2 | Todo endpoint REST documentado com tags, operações e responses |
| RF-10.3 | Eventos WebSocket documentados em markdown (`ws-events.md`) |
| RF-10.4 | OpenAPI exportável (`openapi.json`) para consumo do frontend |

### RF-11 — Monetização (SaaS)

| ID | Requisito |
|----|-----------|
| RF-11.1 | Tier **Free**: todas as features MVP disponíveis com exibição de anúncios Google AdSense |
| RF-11.2 | Tier **Premium**: mesmas features; **único benefício** = remoção de anúncios |
| RF-11.3 | MVP lança com todos os usuários em `free`; campo `plan` preparado na API |
| RF-11.4 | Anúncios exibidos via componentes client-side (`AdProvider`, `AdSlot`) |
| RF-11.5 | **Modo apresentação** (`/present`) nunca exibe anúncios |
| RF-11.6 | Anúncios desabilitados quando `users.plan === 'premium'` |
| RF-11.7 | `NEXT_PUBLIC_ADS_ENABLED=false` em dev local para evitar cliques inválidos |
| RF-11.8 | Política de privacidade publicada antes de ativar AdSense em produção |
| RF-11.9 | Checkout/pagamento Premium fora do escopo do MVP (backlog) |

### RF-12 — Métricas e observabilidade

| ID | Requisito |
|----|-----------|
| RF-12.1 | API expõe `GET /health` e `GET /health/ready` para monitoramento |
| RF-12.2 | API expõe `GET /metrics` (Prometheus) com métricas HTTP e WebSocket |
| RF-12.3 | Logs estruturados JSON na API com `requestId` |
| RF-12.4 | Métricas WS: conexões ativas, mensagens por tipo, duração de broadcast |
| RF-12.5 | Frontend envia eventos de produto (campanha, mapa, dados, apresentação) via analytics |
| RF-12.6 | Frontend reporta Core Web Vitals (LCP, INP, CLS) |
| RF-12.7 | Eventos de anúncio (`ad_slot_rendered`, `ad_slot_skipped`) para correlacionar com AdSense |
| RF-12.8 | Dashboards operacionais (Grafana ou equivalente) em produção |
| RF-12.9 | Alertas para indisponibilidade, erros 5xx e degradação de latência/sync WS |

### RF-13 — Conformidade Licença Ordem Paranormal

| ID | Requisito |
|----|-----------|
| RF-13.1 | App exibe selo oficial da Licença da Comunidade (largura ≥ 10% da viewport ou área equivalente) |
| RF-13.2 | Footer e página `/legal` exibem disclaimer de conteúdo não oficial sem sugestão de parceria |
| RF-13.3 | Ficha e motor de dados usam apenas terminologia geral permitida pela licença (Parte 3) |
| RF-13.4 | App não reproduz textos nem imagens dos livros oficiais |
| RF-13.5 | App não inclui templates, exemplos ou conteúdo pré-populado com termos do cânone |
| RF-13.6 | UI não usa marca "Ordem Paranormal", logos oficiais nem identidade visual copiada |
| RF-13.7 | Com monetização ativa (AdSense/Premium), app não contém material gerado por IA |
| RF-13.8 | Política de privacidade publicada; tratamento de dados conforme LGPD |

### RF-14 — Recap de sessão (Fase 8, pós-MVP)

| ID | Requisito |
|----|-----------|
| RF-14.1 | Mestre pode **finalizar** uma sessão de campanha (registro com início/fim) |
| RF-14.2 | Sistema gera recap **estruturado** agregando itens, combates (log), notas e docs da sessão |
| RF-14.3 | Mestre revisa/edita o recap antes de **enviar aos jogadores** da campanha |
| RF-14.4 | Recaps ficam persistidos e consultáveis (`session_recaps`) |
| RF-14.5 | Trecho narrativo por IA só existe com `SESSION_RECAP_AI_ENABLED=true` e guard `canUseAi()` na API |
| RF-14.6 | Com monetização ativa, IA exige `SESSION_RECAP_AI_ALLOW_COMMERCIAL=true` (default `false`) |
| RF-14.7 | UI não exibe “Gerar resumo com IA” quando `sessionRecapAiAvailable=false` |
| RF-14.8 | Recap com IA exibe aviso *"Contém material gerado por inteligência artificial"* quando aplicável (Parte 4) |

---

## 4. Requisitos não funcionais

### RNF-01 — Arquitetura

| ID | Requisito |
|----|-----------|
| RNF-01.1 | Monorepo com dois apps autocontidos: `apps/web` e `apps/api` |
| RNF-01.2 | Proibido import de código entre web e api; comunicação apenas HTTP + WebSocket |
| RNF-01.3 | Módulos da API isolados por domínio para permitir extração futura em micro-serviços |
| RNF-01.4 | Regras Ordem Paranormal autoritativas somente em `apps/api` |

### RNF-02 — Performance

| ID | Requisito |
|----|-----------|
| RNF-02.1 | Sync de posição de token: latência < 200 ms em rede local (4 clientes) |
| RNF-02.2 | Eventos `camera_sync` throttled (máx. 10/s) |
| RNF-02.3 | Atualizações de mapa/quadro usam delta updates quando possível |
| RNF-02.4 | Limite soft de 10 conexões WebSocket por campanha |

### RNF-03 — Disponibilidade e resiliência

| ID | Requisito |
|----|-----------|
| RNF-03.1 | Reconexão WebSocket automática ao perder conexão |
| RNF-03.2 | Fallback polling (5 s) para log de dados se WS falhar |
| RNF-03.3 | Healthcheck HTTP (`/health`) para monitoramento de deploy |

### RNF-04 — Segurança

| ID | Requisito |
|----|-----------|
| RNF-04.1 | Autenticação via JWT; tokens com expiração e refresh |
| RNF-04.2 | RBAC por campanha (gm / player / spectator) em toda operação |
| RNF-04.3 | Validação Zod de payloads REST e WebSocket inbound |
| RNF-04.4 | Upload de arquivos via presigned URL (sem credenciais S3 no cliente) |
| RNF-04.5 | Rolagens de ficha validadas server-side (anti-cheat) |

### RNF-05 — Qualidade e testes

| ID | Requisito |
|----|-----------|
| RNF-05.1 | Backend desenvolvido com **TDD** (Jest: unit, integração, e2e) |
| RNF-05.2 | Frontend com Vitest + RTL; e2e com Cypress (fluxos críticos) |
| RNF-05.3 | CI executa lint, test, test:e2e, openapi:export e build |
| RNF-05.4 | Cobertura prioritária em `rpg/dice` e fluxos auth/CRUD/WS |

### RNF-06 — Documentação

| ID | Requisito |
|----|-----------|
| RNF-06.1 | Cada módulo API possui `<modulo>.md` |
| RNF-06.2 | Cada domínio web possui `<dominio>.md` |
| RNF-06.3 | Padrões documentados em [padroes.md](padroes.md) |

### RNF-07 — Usabilidade

| ID | Requisito |
|----|-----------|
| RNF-07.1 | Interface responsiva (desktop prioritário; tablet aceitável) |
| RNF-07.2 | Estados de loading, erro e empty em telas principais |
| RNF-07.3 | Modo apresentação com fundo escuro e layout limpo para projeção/stream |
| RNF-07.4 | Autosave visível em documentos e ficha |

### RNF-08 — Infraestrutura e deploy

| ID | Requisito |
|----|-----------|
| RNF-08.1 | Ambiente local via Docker Compose (PostgreSQL, Redis, MinIO) |
| RNF-08.2 | Deploy produção via Coolify + Cloudflare (TLS, DNS) |
| RNF-08.3 | Storage produção: Cloudflare R2; dev: MinIO |
| RNF-08.4 | Apps containerizados (Dockerfile web + api) |

### RNF-09 — Legal / IP (Licença da Comunidade OP v1.0)

| ID | Requisito |
|----|-----------|
| RNF-09.1 | LoreForge enquadrado como plataforma VTT comercial sob a Licença da Comunidade de Ordem Paranormal v1.0 |
| RNF-09.2 | Terminologia do sistema limitada ao permitido na Parte 3 (atributos, recursos, origens, classes, etc.) |
| RNF-09.3 | Proibido uso de termos do cânone em conteúdo do app (exceto Ordo Realitas como termo permitido) |
| RNF-09.4 | Proibido uso de marca, logo ou identidade visual de Ordem Paranormal |
| RNF-09.5 | Proibida reprodução de textos/imagens oficiais dos livros |
| RNF-09.6 | Proibido material gerado por IA em produto comercializado |
| RNF-09.7 | Selos em `docs/assets/`; cópia servida em `apps/web/public/licenca-op/` |
| RNF-09.8 | Rituais/poderes homebrew fora do escopo de balanceamento no MVP |

### RNF-10 — Manutenibilidade

| ID | Requisito |
|----|-----------|
| RNF-10.1 | TypeScript strict em ambos os apps |
| RNF-10.2 | Migrations versionadas com Drizzle |
| RNF-10.3 | Conflitos de sync: last-write-wins + campo `version` por entidade (MVP) |

### RNF-11 — Monetização e compliance

| ID | Requisito |
|----|-----------|
| RNF-11.1 | Script AdSense carregado apenas no client (`'use client'`) |
| RNF-11.2 | Ads não sobrepõem controles críticos (mapa, rolagem, quadro) |
| RNF-11.3 | Lazy load de ad slots fora da viewport |
| RNF-11.4 | Conformidade com políticas Google AdSense e LGPD (cookies/ads declarados) |
| RNF-11.5 | Testes automatizados garantem ausência de ads em `/present` e plano premium |

### RNF-12 — Observabilidade

| ID | Requisito |
|----|-----------|
| RNF-12.1 | Endpoint `/metrics` protegido em produção (rede interna ou auth) |
| RNF-12.2 | Logs não contêm JWT, senhas ou PII desnecessária (LGPD) |
| RNF-12.3 | Cardinalidade de labels Prometheus controlada (evitar `campaign_id` em alta cardinalidade no scrape público) |
| RNF-12.4 | Analytics de produto compatível com política de privacidade e consentimento quando aplicável |
| RNF-12.5 | Métricas permitem validar requisito de sync < 200 ms (histogram `ws_broadcast_duration_seconds`) |

---

## 5. Matriz RF × Módulo

| RF | web | api | WS |
|----|:---:|:---:|:--:|
| RF-01 Auth | ✓ | ✓ | |
| RF-02 Campanhas | ✓ | ✓ | |
| RF-03 Personagens | ✓ | ✓ | |
| RF-04 Documentos | ✓ | ✓ | |
| RF-05 Mapa | ✓ | ✓ | ✓ |
| RF-06 Apresentação | ✓ | ✓ | ✓ |
| RF-07 Dados | ✓ | ✓ | ✓ |
| RF-08 Quadro | ✓ | ✓ | ✓ |
| RF-09 Sessão | ✓ | ✓ | ✓ |
| RF-10 Swagger | | ✓ | |
| RF-11 Monetização | ✓ | ✓ | |
| RF-12 Métricas | ✓ | ✓ | ✓ |
| RF-13 Licença OP | ✓ | | |

---

## 6. Critérios de aceite (resumo)

1. Login Google + dashboard
2. CRUD campanha + convites + fichas OP
3. Docs TipTap com permissões
4. Mapa sync com 4 clientes
5. Modo apresentação em nova aba
6. Rolagens OP com log compartilhado
7. Quadro de investigações live
8. Deploy Docker local + Coolify prod
9. Swagger + `.md` atualizados
10. Suite de testes passando
11. AdSense no Free; sem ads em apresentação e Premium
12. `/metrics`, analytics de produto e dashboards operacionais
13. Selo e disclaimer da Licença da Comunidade de Ordem Paranormal; conformidade RF-13

---

## 7. Diagramas

Abrir no [draw.io](https://app.diagrams.net/) ou extensão Draw.io Integration:

**[docs/loreforge-arquitetura.drawio](loreforge-arquitetura.drawio)**

| Página | Conteúdo |
|--------|----------|
| **Arquitetura** | Visão de componentes, infra e integrações externas |
| **Fluxo da Aplicação** | Jornadas: login, campanha, sessão ao vivo |
| **Tempo Real** | Sequência WebSocket + Redis pub/sub |
| **Deploy** | Ambiente local vs produção |
