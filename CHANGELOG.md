# Mudanças

## 1.0.0 (22/10/2026)

Primeira versão, montada durante a onda de 19 a 21/10/2026 (LiteLLM 1.107.0, PHP2Shell, OpenCode Console, Railway,
correção do Node.js de 21/10).

- Skills: `checkup-seguranca`, `sonda-do-site`, `segredo-fora-do-chat`, `vazou-e-agora`, `pacote-novo-com-calma`.
- Scripts sem dependência: `checkup.mjs`, `sonda-site.mjs`, `mascara.mjs`, `testa-chave.mjs`, `idade-pacote.mjs`.
- `regras/REGRAS-SEGURANCA.md` pro `CLAUDE.md` e o `AGENTS.md`.
- `teste/teste-checkup.mjs`: 23 casos numa casa falsa. Planta o pacote envenenado (dist-info, egg-info e ao lado de
  uma versão antiga), a marca do vírus, `.env` versionado, chaves geradas na hora no histórico, pasta com nome que
  viraria comando num shell e a trava do bun em zero. Confere também os casos de borda do mascarador (chave sozinha em
  comentário, senha em URL de socket, URL com senha em lista YAML, senha depois de `-a`, campo em português, lista sob
  `pass`), o `testa-chave` com chave colada no lugar do nome, o `idade-pacote` com `!=` e a sonda com `@` no domínio.

### Revisão antes de publicar (Grok e Gemini, duas rodadas)

- Comandos sem shell; shell só pra texto fixo dos `.cmd` do Windows. Tudo roda a partir da pasta temporária, sem
  achar executável plantado na pasta atual, e com o Corepack sem rede.
- Sonda do Python pela entrada padrão (sem arquivo temporário), git sem `core.fsmonitor`, `--salvar` só em `.md` e
  sem sobrescrever outro arquivo.
- Sonda: domínio validado antes de qualquer pedido, leitura limitada a 200 KB por resposta, redirecionamento seguido
  só pro irmão `www`.
- Checkup: pnpm, uv e bun conferidos pela versão mínima que tem a trava; LiteLLM 1.82.7 e 1.82.8 (ataque de março de
  2026) também acusados; varredura acha `.venv`, `.conda`, pipx, poetry e uv; `.env` fora do git e sem resposta do
  git deixam de virar alarme falso.
- Mascarador decide pelo caminho inteiro do campo, esconde comentário com cara de chave e valor logo depois de flag
  sensível.
- `testa-chave` lê direto de um `.env` (`--arquivo`), recusa valor de chave colado no lugar do nome sem repeti-lo.
- `idade-pacote` aceita só nome válido e acusa versão retirada ou condenada pelo autor.
- Textos: instalação numa pasta temporária, Codex em `~/.agents/skills`, conferência da versão de cada gerenciador
  antes de ligar a espera, `.env`, `.env.*` e `!.env.example` no `.gitignore`, ambiente Python sem apagar o do
  sistema, fontes dos ataques com link no README.
