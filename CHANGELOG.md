# Mudanças

## 1.0.0 (22/10/2026)

Primeira versão, montada durante a onda de 16 a 22/10/2026 (LiteLLM 1.107.0, PHP2Shell, OpenCode Console, Railway,
correção do Node.js de 21/10).

- Skills: `checkup-seguranca`, `sonda-do-site`, `segredo-fora-do-chat`, `vazou-e-agora`, `pacote-novo-com-calma`.
- Scripts sem dependência: `checkup.mjs`, `sonda-site.mjs`, `mascara.mjs`, `testa-chave.mjs`, `idade-pacote.mjs`.
- `regras/REGRAS-SEGURANCA.md` pro `CLAUDE.md` e o `AGENTS.md`.
- `teste/teste-checkup.mjs`: casa falsa com o pacote envenenado (dist-info e egg-info), a marca do vírus, `.env`
  versionado, chaves geradas na hora, pasta com nome que viraria comando num shell, trava do bun em zero, domínio
  com `@` na sonda e segredo curto no mascarador; 15 casos, incluindo "nenhuma chave aparece na saída".
- Revisão por Grok antes de publicar: comandos sem shell, sonda do Python pela entrada padrão (sem arquivo
  temporário), domínio da sonda validado, git sem `core.fsmonitor`, `--salvar` só em `.md`.
