# LoreForge

Plataforma web de mesa virtual para RPG: campanhas, fichas, documentos do mestre, mapa em tempo real, rolagem de dados e quadro de investigações.

O repositório usa dois apps autocontidos:

- `apps/web`: frontend Next.js.
- `apps/api`: backend NestJS, fonte autoritativa para regras, validação e persistência.

Documentação consolidada:

- [docs/README.md](docs/README.md): índice.
- [docs/produto.md](docs/produto.md): escopo, requisitos e roadmap do MVP.
- [docs/arquitetura.md](docs/arquitetura.md): monorepo, padrões técnicos, testes e setup.
- [docs/contratos.md](docs/contratos.md): REST/OpenAPI e eventos WebSocket.
- [docs/operacao.md](docs/operacao.md): monetização, métricas, deploy e variáveis de ambiente.
- [docs/licenca-ordem-paranormal.md](docs/licenca-ordem-paranormal.md): conformidade com a Licença da Comunidade.

Regras de documentação: preferir Swagger/OpenAPI, testes e estes documentos centrais. Não criar `.md` por módulo ou por domínio sem necessidade real de arquitetura, contrato ou operação.

Licenças:

- Código-fonte: [Apache License 2.0](LICENSE).
- Compatibilidade Ordem Paranormal RPG: [Licença da Comunidade de Ordem Paranormal v1.0](docs/licenca-ordem-paranormal/LICENCA-COMUNIDADE-v1.0.md).
