## Licenciamento — Ordem Paranormal

LoreForge é compatível com o sistema Ordem Paranormal RPG sob a [Licença da Comunidade de Ordem Paranormal v1.0](docs/licenca-ordem-paranormal/LICENCA-COMUNIDADE-v1.0.md).

- **Enquadramento:** plataforma VTT com monetização (AdSense + Premium) → conteúdo comercial (Parte 3)
- **Permitido:** terminologia geral do sistema; motor de dados; fichas virtuais
- **Proibido:** marca/logo oficial; textos/imagens dos livros; termos do cânone; IA em produto comercial
- **Obrigatório:** selo da licença no app; disclaimer de não oficialidade; LGPD

Ver [docs/licenca-ordem-paranormal/conformidade-loreforge.md](docs/licenca-ordem-paranormal/conformidade-loreforge.md).

---

Requisitos funcionais
- Login com o Google (oAuth)
- Gerenciar personagens (CRUD)
- Gerenciar campanhas (CRUD)
- Mapa em tempo real (Tabletop)
- Rolagem de dados em tempo real
- Gerenciar documentos (Docs criados pelo mestre)
- Quadro de investigações ( Permitir anotações, riscar, conectar dados sem precisar abrir novas janelas)
Opcional para o futuro:
- Balanceador de homebrews (armas, poderes)

## Modelo SaaS
- **Free:** todas as features + Google AdSense
- **Premium:** mesmas features, sem anúncios (pagamento pós-MVP)
- MVP lança tier Free; ver [docs/monetizacao.md](docs/monetizacao.md)
- Métricas: [docs/metricas.md](docs/metricas.md)


## Stacks:
```markdown
Frontend
├─ Next.js  
├─ TypeScript  
├─ Tailwind  
├─ Zustand  
├─ TanStack Query  
├─ PixiJS  
├─ React Flow  
└─ TipTap  
  
Backend  
├─ NestJS  
├─ Drizzle  
├─ PostgreSQL  
├─ Redis  
└─ WebSocket  
  
Storage  
├─ Cloudflare R2  
├─ S3 SDK
└─ MinIO (dev apenas)

  
Infra  
├─ Docker  
├─ Coolify  
└─ Cloudflare
```
