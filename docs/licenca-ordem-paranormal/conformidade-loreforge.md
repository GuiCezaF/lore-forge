# Conformidade — Licença da Comunidade de Ordem Paranormal

Guia de enquadramento do **LoreForge** na [Licença da Comunidade de Ordem Paranormal v1.0](LICENCA-COMUNIDADE-v1.0.md) (publicada em 28/06/2026).

Documento oficial: [ordemparanormal.com.br/licenca](https://ordemparanormal.com.br/licenca)

---

## 1. Enquadramento do LoreForge

| Aspecto | Classificação |
|---------|---------------|
| Tipo de produto | Plataforma VTT (aplicativo web) com fichas, mapa e ferramentas de mesa |
| Base de regras | Sistema Ordem Paranormal RPG — terminologia geral permitida; sem reprodução de textos/imagens oficiais |
| Monetização prevista | Google AdSense (tier Free) + assinatura Premium (pós-MVP) |
| Categoria da licença | **Conteúdo comercial** (Parte 3) — plataforma VTT com receita por ads/assinatura |

O LoreForge **não** é produto oficial, **não** possui parceria com Rafael "Cellbit" Lange, Jambô Editora ou Ordem Paranormal, e **não** deve sugerir endosso de qualquer tipo.

Durante desenvolvimento local ou beta fechado (sem monetização e sem distribuição pública), o escopo "caseiro" (até 10 pessoas) da Parte 1 pode se aplicar; **qualquer deploy público com monetização exige conformidade integral**.

---

## 2. O que o LoreForge pode usar

Terminologia **geral do sistema** (ficha, motor de dados, labels de UI):

- Atributos: Agilidade, Força, Intelecto, Presença, Vigor
- Recursos: PV, PE, Sanidade, Determinação, NEX
- Origens, classes, trilhas, perícias, poderes e rituais (nomes genéricos do sistema)
- Itens não únicos (ex.: Emissor de Pulsos Paranormais)
- Termos de universo: Membrana, Outro Lado, Elementos (Sangue, Morte, Conhecimento, Energia, Medo), Ordo Realitas

Implementação:

- Motor de dados (pool d20, crítico, desastre) baseado nas regras — **sem copiar texto dos livros**
- Formulário de ficha com campos do sistema
- Rolagem e validação server-side

---

## 3. O que o LoreForge não pode usar

### 3.1 Marca e identidade visual

| Proibido | Alternativa no LoreForge |
|----------|--------------------------|
| Marca "Ordem Paranormal" no nome do app, domínio ou perfis | Nome **LoreForge** (sem "Ordem Paranormal") |
| Logo oficial, logos de livros/séries | Identidade visual própria |
| Copiar projeto gráfico de produtos oficiais | UI original (Tailwind, design próprio) |
| Sugerir parceria/aprovação oficial | Disclaimer claro de conteúdo não oficial |

### 3.2 Narrativa do cânone

**Proibido** em conteúdo pré-populado, templates, exemplos ou material do app:

- Nomes próprios de personagens (ex.: Agatha, Kian)
- Organizações do cânone (exceto Ordo Realitas)
- Entidades, lugares, eventos ou obras do cânone (ex.: Santo Berço, Hexatombe)

**Permitido:** usuários criam personagens e campanhas com nomes próprios — o app não fornece conteúdo de cânone.

### 3.3 Material oficial

- **Proibido:** reproduzir textos ou imagens dos livros oficiais
- **Proibido:** assets oficiais (arte, fichas prontas, mapas oficiais) sem autorização
- **Proibido:** escaneamento ou distribuição de PDFs/livros

### 3.4 Inteligência artificial (conteúdo comercial)

Com monetização ativa (AdSense ou Premium), o app **não pode conter** material gerado por IA:

- Sem textos, imagens ou assets gerados por IA no produto
- Sem sugestões automáticas de ficha/conteúdo via LLM no MVP comercial
- Sem mapas/tokens gerados por IA embutidos no app

> Se no futuro existir tier 100% gratuito sem monetização, conteúdo com IA exigiria aviso *"Contém material gerado por inteligência artificial"* próximo ao selo.

---

## 4. Obrigações de implementação

### 4.1 Selo da licença (Parte 4)

Exibir o selo oficial em pontos visíveis do app:

| Local | Requisito |
|-------|-----------|
| Rodapé global | Selo com largura ≥ 10% da viewport (ou área equivalente) |
| Página "Sobre" / Legal | Selo + texto de disclaimer |
| Landing / login (se houver) | Selo visível na primeira impressão |
| Modo apresentação | Selo discreto (não obstruir mapa) ou link para página legal |

**Texto alternativo** (quando selo não couber, ex.: exportação textual):

> *Este é um conteúdo não oficial, publicado sob a Licença da Comunidade de Ordem Paranormal*

**Assets:** selos versionados em [`docs/assets/`](../assets/) (`ordem-paranormal-selo-preto.png`, `ordem-paranormal-selo-branco.png`). Copiar para `apps/web/public/licenca-op/` na Fase 0.

Componente previsto: `apps/web/src/components/legal/LicenseBadge.tsx`

### 4.2 Disclaimer de não oficialidade

Texto mínimo em footer, about e documentação pública:

> LoreForge é uma ferramenta de mesa virtual **não oficial**, compatível com o sistema Ordem Paranormal RPG, publicada sob a [Licença da Comunidade de Ordem Paranormal](https://ordemparanormal.com.br/licenca). Não possui afiliação, parceria ou endosso de Rafael "Cellbit" Lange, Jambô Editora ou Ordem Paranormal.

### 4.3 LGPD (apps digitais)

- Política de privacidade publicada antes do deploy com AdSense
- Não vender, ceder ou compartilhar dados pessoais com terceiros (exceto subprocessadores declarados: Google OAuth, AdSense, analytics)
- Logs sem PII desnecessária (já previsto em RNF-12.2)

### 4.4 Conteúdo sensível

Campanhas de horror/terror são responsabilidade dos usuários. O app **não** pré-popula conteúdo sensível. Se no futuro houver templates ou material curado, exibir aviso adequado.

---

## 5. Impacto no desenvolvimento por fase

| Fase | Ações de conformidade |
|------|----------------------|
| **0** | Selos em `docs/assets/` → copiar para `public/licenca-op/`; `LicenseBadge`; disclaimer no layout; doc `legal.md` |
| **1** | Schema de ficha só com termos permitidos; sem templates de cânone; validar nomes de origem/classe contra lista permitida |
| **2** | Docs do mestre: usuário cria conteúdo — app não inclui texto oficial |
| **4–6** | Tokens/mapas: assets próprios ou upload do usuário; sem biblioteca de arte oficial |
| **7** | Selo visível em produção; política de privacidade; **zero IA** com AdSense ativo; revisão final de copy/marketing |

---

## 6. Checklist de conformidade (pré-lançamento)

- [ ] Selo da licença visível (≥ 10% largura) no app publicado
- [ ] Disclaimer de não oficialidade em footer e página legal
- [ ] Nome/domínio/perfil **sem** "Ordem Paranormal"
- [ ] UI **sem** logo ou identidade visual oficial
- [ ] Ficha e motor de dados usam apenas terminologia permitida
- [ ] Nenhum texto/imagem reproduzido dos livros oficiais
- [ ] Nenhum conteúdo pré-populado com termos do cânone
- [ ] **Sem** material gerado por IA no produto comercial
- [ ] Política de privacidade + LGPD documentada
- [ ] Copy de marketing **sem** sugestão de parceria oficial

---

## 7. Referências cruzadas

| Documento | Seção relevante |
|-----------|-----------------|
| [requisitos.md](../requisitos.md) | RF-13, RNF-09 |
| [plano-mvp.md](../../plano-mvp.md) | Fase 0, Fase 7, riscos |
| [monetizacao.md](../monetizacao.md) | Implicações comerciais |
| [AGENT.md](../../AGENT.md) | Restrições de domínio |
| [README.md](../../README.md) | Aviso legal |

---

## 8. Atualizações da licença

A licença pode ser atualizada pelo titular. Conteúdos já publicados mantêm os direitos da versão vigente à época. Monitorar [ordemparanormal.com.br/licenca](https://ordemparanormal.com.br/licenca) e atualizar este guia quando houver nova versão.
