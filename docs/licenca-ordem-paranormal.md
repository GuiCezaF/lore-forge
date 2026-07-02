# Licença Ordem Paranormal

LoreForge é uma plataforma VTT não oficial compatível com Ordem Paranormal RPG e publicada sob a Licença da Comunidade de Ordem Paranormal v1.0.

Cópia de referência: [licenca-ordem-paranormal/LICENCA-COMUNIDADE-v1.0.md](licenca-ordem-paranormal/LICENCA-COMUNIDADE-v1.0.md).

## Enquadramento

Com AdSense ou assinatura Premium, o LoreForge é tratado como conteúdo comercial. O app pode usar terminologia geral de sistema permitida pela licença, mas não pode sugerir produto oficial, parceria ou endosso.

Disclaimer mínimo:

> LoreForge é uma ferramenta de mesa virtual não oficial, compatível com o sistema Ordem Paranormal RPG, publicada sob a Licença da Comunidade de Ordem Paranormal. Não possui afiliação, parceria ou endosso de Rafael "Cellbit" Lange, Jambô Editora ou Ordem Paranormal.

## Permitido

- Terminologia geral de sistema permitida pela licença.
- Motor de dados e fichas virtuais.
- Ferramentas genéricas de campanha, documentos, mapa, investigação e sessão.
- Selos oficiais da licença, mantidos em `docs/assets/` e copiados para `apps/web/public/licenca-op/` quando necessário.

## Proibido

- Usar "Ordem Paranormal" no nome do app, domínio ou perfis.
- Usar logo, marca ou identidade visual oficial.
- Reproduzir texto, imagem, arte, lore, personagens, organizações ou eventos dos livros/cânone.
- Incluir templates ou exemplos pré-populados com termos do cânone.
- Incluir material gerado por IA quando houver monetização ativa, salvo mudança explícita da licença ou autorização.

## Implementação obrigatória

- Exibir selo da licença em área visível conforme a licença.
- Exibir disclaimer no footer, rota `/legal` e documentação pública.
- Publicar política de privacidade antes de ativar AdSense.
- Garantir LGPD: coleta mínima, cookies/ads declarados e sem PII indevida em logs.
- Não exibir anúncios no modo apresentação.
- Manter recap narrativo por IA desabilitado por padrão.

## Impacto por fase

| Fase | Ação |
|------|------|
| 0 | Selo, disclaimer e rota legal |
| 1 | Ficha com apenas terminologia permitida |
| 2 | Documentos sem conteúdo oficial pré-carregado |
| 4 | Mapa sem arte oficial |
| 7 | Política de privacidade antes de AdSense |
| 8 | IA só com feature flag e revisão legal |

## Checklist pré-lançamento

- [ ] Nome, domínio e perfis usam apenas LoreForge.
- [ ] Selo da licença visível.
- [ ] Disclaimer presente no footer e `/legal`.
- [ ] Nenhum texto ou imagem oficial incluído.
- [ ] Nenhum conteúdo de cânone pré-populado.
- [ ] AdSense condicionado à política de privacidade.
- [ ] IA desabilitada com monetização ativa.
