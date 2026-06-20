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
