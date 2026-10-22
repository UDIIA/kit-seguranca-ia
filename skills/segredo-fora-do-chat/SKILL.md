---
name: segredo-fora-do-chat
description: Regras e ferramentas pra chave de API, token e senha nunca aparecerem na conversa nem no histórico. Use SEMPRE que for ler .env, settings.json, auth.json, config.toml, docker-compose ou qualquer arquivo que possa ter segredo; quando a pessoa quiser "colar a chave aqui"; quando precisar configurar variável de ambiente; ou quando ela perguntar "onde guardo minha chave?".
---

# Segredo fora do chat

Tudo que passa pela conversa fica gravado no disco, no histórico do Claude Code (`~/.claude/projects/`) e do Codex
(`~/.codex/sessions/`). Um `cat .env` de três meses atrás ainda está lá, e um ladrão de credencial (como o do LiteLLM
1.107.0, 21/10/2026) copia essas pastas. Por isso a regra é: o valor da chave nunca entra na conversa.

## As cinco regras

1. **Não leio arquivo de segredo inteiro.** Nada de `cat .env`, `type .env`, `Get-Content .env`, Read de
   `settings.json`, `auth.json`, `.npmrc`, `credentials`. Pra saber o que tem lá:
   `node "<pasta desta skill>/mascara.mjs" <arquivo>`. Ele mostra as chaves que existem, se estão vazias, o tipo e o
   tamanho, nunca o valor.
2. **Não peço pra pessoa colar chave no chat.** Se ela precisa configurar, explico onde pôr (abaixo) e ela digita
   direto no arquivo, no painel ou no cofre. Se ela colar mesmo assim, aviso na hora que aquela chave agora está no
   histórico e ofereço trocar (skill `vazou-e-agora`).
3. **Não imprimo variável de ambiente com segredo.** Nada de `echo $OPENAI_API_KEY`, `env`, `printenv`, `set` sem
   filtro. Pra conferir se existe: `node -e "console.log(process.env.NOME ? 'definida, ' + process.env.NOME.length + ' caracteres' : 'vazia')"`.
4. **Teste de chave sem mostrar a chave:** `node --env-file=.env "<pasta da skill vazou-e-agora>/testa-chave.mjs" NOME`.
5. **Chave em URL é chave exposta.** Link com `?key=` ou `usuario:senha@` vai parar em log de servidor e histórico de
   navegador. Use cabeçalho.

## Onde a chave mora (do mais simples ao mais forte)

- **Arquivo `.env` fora do git:** aceitável pra uso local se `.env*` está no `.gitignore` e o arquivo nunca entra na
  conversa. É o mínimo.
- **Cofre do sistema:** Windows Credential Manager, Chaves do macOS (Keychain), `secret-tool` no Linux. O programa lê
  na hora de rodar.
- **Gerenciador de senhas com linha de comando:** 1Password (`op run --env-file=.env.tpl -- <comando>`), Bitwarden
  (`bws run`), Doppler, Infisical. A chave entra no processo, nunca no arquivo nem na tela.
- **Arquivo cifrado:** `age` ou `sops`. O arquivo no disco é ilegível sem a chave mestra.
- **Em servidor e plataforma (Netlify, Vercel, Railway):** variável de ambiente do painel, nunca arquivo publicado.
  Lembre que a plataforma também pode vazar (Railway, 21/10/2026): chave de produção com o menor poder possível e
  limite de gasto no provedor.

## Defesa extra que vale ligar

- **Limite de gasto** no painel de cada provedor de IA (Anthropic, OpenAI, Google). Quem rouba chave de IA quer
  gastar crédito; o limite corta o prejuízo.
- **Chave por projeto**, com nome que diz onde ela mora. Quando vazar, você sabe qual trocar e o resto continua
  funcionando.
- **Trava automática:** regra escrita é conselho. Um hook PreToolUse barra o `cat .env` antes de acontecer. O passo
  opcional do INSTALAR.md liga isso.
