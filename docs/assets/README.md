# Assets — LoreForge

## Selos — Licença da Comunidade de Ordem Paranormal

Selos oficiais versionados no repositório (fonte: [ordemparanormal.com.br/licenca](https://ordemparanormal.com.br/licenca)).

| Arquivo | Uso |
|---------|-----|
| `ordem-paranormal-selo-preto.png` | Fundos claros |
| `ordem-paranormal-selo-branco.png` | Fundos escuros |

### Requisitos de exibição (Parte 4 da licença)

- Largura mínima = **10%** da largura da "capa" (viewport ou área equivalente)
- 100% de opacidade, legível e destacado em relação ao fundo

### Uso no app (Fase 0)

Copiar para `apps/web/public/licenca-op/` para servir via Next.js:

```bash
mkdir -p apps/web/public/licenca-op
cp docs/assets/ordem-paranormal-selo-*.png apps/web/public/licenca-op/
```

Ver [conformidade-loreforge.md](../licenca-ordem-paranormal/conformidade-loreforge.md) para pontos de exibição no app.
