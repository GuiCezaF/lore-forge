# Monetização — SaaS (Free + Premium)

Modelo de negócio do LoreForge. No **início**, todas as features do MVP são **free**; monetização via anúncios. **Premium** remove apenas os anúncios — sem paywall de funcionalidades no MVP.

**Licenciamento:** com AdSense ou assinatura Premium, o LoreForge é **conteúdo comercial** (Parte 3 da [Licença da Comunidade de Ordem Paranormal](licenca-ordem-paranormal/LICENCA-COMUNIDADE-v1.0.md)). Implica **proibição de material gerado por IA** no produto. Ver [conformidade-loreforge.md](licenca-ordem-paranormal/conformidade-loreforge.md).

---

## Planos

| Plano | Features MVP | Anúncios | Disponibilidade |
|-------|--------------|----------|-----------------|
| **Free** | Todas (mapa, fichas, docs, dados, quadro, apresentação) | Sim (Google AdSense) | Lançamento |
| **Premium** | Idêntico ao Free | Não | Pós-MVP (pagamento) |

Nenhuma feature de jogo fica bloqueada no Free. Premium = experiência sem ads.

---

## Google AdSense — setup

### Pré-requisitos

- Domínio publicado com HTTPS (Cloudflare + Coolify)
- Política de privacidade e termos de uso publicados (exigência AdSense + LGPD/licença OP)
- Conta [Google AdSense](https://www.google.com/adsense/) aprovada para o domínio

### Variáveis de ambiente

```env
# apps/web
NEXT_PUBLIC_GOOGLE_ADS_CLIENT=ca-pub-XXXXXXXXXX
NEXT_PUBLIC_ADS_ENABLED=true          # false em dev local (opcional)

# apps/api (campo usuário — stub MVP)
# plan: 'free' | 'premium'  — default 'free'
```

### Implementação (apps/web)

```
apps/web/src/
├── components/ads/
│   ├── AdProvider.tsx       # carrega script AdSense (client-only)
│   ├── AdSlot.tsx           # slot reutilizável por placement
│   ├── useShowAds.ts        # plan === 'free' && ADS_ENABLED
│   └── ads.md
└── app/layout.tsx           # AdProvider no shell (não no /present)
```

**Regras de exibição:**

| Tela | Anúncios |
|------|----------|
| Dashboard, campanha, fichas, docs | Sim (slots laterais / banner) |
| Mapa tabletop (aba normal) | Slot discreto (ex.: rodapé lateral) |
| **Modo apresentação** (`/present`) | **Nunca** — sessão limpa para mesa/stream |
| Login / onboarding | Opcional (mínimo ou nenhum) |

### Boas práticas

- Componentes de ad sempre `'use client'` (AdSense não funciona bem em SSR)
- Lazy load de slots fora da viewport
- Respeitar `prefers-reduced-motion` e não sobrepor controles críticos (mapa, dados)
- Documentar placements em `ads.md`
- Testes: mock `useShowAds` → verificar que slots não renderizam quando `premium` ou `ADS_ENABLED=false`

### API (stub para Premium)

```sql
-- users.plan: 'free' | 'premium'  DEFAULT 'free'
```

- MVP: todos `free`; campo já existe para esconder ads quando Premium for lançado
- Endpoint futuro: `GET /users/me` retorna `{ plan }`; web usa em `useShowAds`
- Pagamento (Stripe / Google Play billing web): **fora do MVP** — só documentar como Fase 9

---

## Fase no plano

Integrado na **Fase 7** ([plano-mvp.md](../plano-mvp.md)):

1. Conta AdSense + domínio aprovado
2. `AdProvider` + `AdSlot` + placements
3. Campo `users.plan` na API (default `free`)
4. Política de privacidade (mencionar cookies/ads Google)
5. Desabilitar ads em `/present` e quando `plan === 'premium'`

---

## Premium (backlog — pós-MVP)

| Item | Descrição |
|------|-----------|
| Checkout | Stripe ou similar |
| Webhook | API atualiza `users.plan` → `premium` |
| UI | Página "Remover anúncios" / billing |
| Sem feature gate | Não bloquear mapa, fichas, etc. |

---

## Checklist AdSense

- [ ] Domínio em produção com HTTPS
- [ ] Política de privacidade publicada
- [ ] Conta AdSense criada e site aprovado
- [ ] `NEXT_PUBLIC_GOOGLE_ADS_CLIENT` configurado no Coolify
- [ ] AdProvider + AdSlot implementados e testados
- [ ] Ads ocultos em `/present` e para `plan === 'premium'`
- [ ] `ADS_ENABLED=false` no dev local (evitar cliques inválidos)

Correlacionar com analytics: eventos `ad_slot_*` — ver [metricas.md](metricas.md).

---

## Referências

- [Google AdSense — Começar](https://support.google.com/adsense/answer/10162)
- [Políticas do programa AdSense](https://support.google.com/adsense/answer/48182)
- [Licença da Comunidade OP — conformidade](licenca-ordem-paranormal/conformidade-loreforge.md)
