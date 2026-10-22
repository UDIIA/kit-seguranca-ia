---
name: vazou-e-agora
description: Roteiro de incidente pra chave, token ou senha que vazou ou pode ter vazado. Use quando a pessoa disser "vazou minha chave", "acho que vazou", "colei a chave no chat", "recebi e-mail de vazamento", "a plataforma X foi invadida", "tão gastando meu crédito", "instalei a versão infectada", ou quando o checkup-seguranca ou a sonda-do-site der URGENTE.
---

# Vazou, e agora?

Siga na ordem. Trocar a chave corta o uso da credencial vazada; apagar arquivo, limpar histórico e investigar vêm
depois, porque cópia que alguém já fez não volta. Se a máquina está infectada, trocar a chave só resolve junto com o
passo 0.

## 0. Se a máquina pode estar infectada

Sinal: o checkup achou o LiteLLM 1.107.0, `cook.pth`, a marca `.pc_once_...` ou imagem Docker contaminada.
Faça os passos 1 e 2 **de outro aparelho** (celular, outro computador). O ladrão do LiteLLM levava senha salva no
navegador, chave SSH, chave de nuvem, token de GitHub e npm e a configuração de mais de 15 ferramentas de IA, e
deixava um carregador que buscava código novo a cada hora. Desconecte a máquina da rede até limpar.

## 1. Revogar e gerar nova, logo

No painel de cada provedor afetado: apagar a chave antiga, criar uma nova com o menor poder possível.

| Provedor | Onde |
|---|---|
| Anthropic | console.anthropic.com → Settings → API keys |
| OpenAI | platform.openai.com → API keys |
| Google (Gemini) | aistudio.google.com → API keys (ou Google Cloud → Credenciais) |
| GitHub | github.com → Settings → Developer settings → Personal access tokens; e Settings → SSH keys |
| npm | npmjs.com → Access Tokens |
| AWS, Azure, Google Cloud | console do provedor → IAM / credenciais; desative antes de apagar |
| Banco de dados | painel do banco → trocar senha do usuário |
| Senhas do navegador | trocar as mais importantes (e-mail, banco, GitHub) e ligar verificação em duas etapas |

Se a plataforma onde a chave estava guardada foi invadida (OpenCode Console, Railway em 21/10/2026), troque TODAS
as chaves guardadas lá, mesmo as que parecem paradas.

## 2. Atualizar onde a chave nova é usada

Cada lugar que usava a antiga: `.env` local, variável do painel (Netlify, Vercel, Railway), cofre, CI do GitHub.
A pessoa digita a chave nova direto no lugar, e a conversa fica sem ela. Depois, redeploy ou reinício do serviço pra
ele pegar o valor novo.

## 3. Confirmar que a velha morreu e a nova funciona

```bash
node "<pasta desta skill>/testa-chave.mjs" NOME_DA_VARIAVEL --arquivo "<caminho do .env>"
```

`<pasta desta skill>` é a pasta onde este SKILL.md está. Sem `--arquivo`, o script lê a variável de ambiente do
terminal. Ele chama uma rota de leitura do provedor que não gasta crédito e diz VIVA ou MORTA. Rode com a nova (tem
que dar VIVA) e, se a pessoa ainda tiver a velha num arquivo, com ela (tem que dar MORTA). O script recusa se você
passar o valor em vez do nome.

## 4. Ver se alguém usou

- Uso e cobrança do provedor, desde o dia em que a chave pode ter vazado (OpenCode: desde 16/10/2026 no mínimo).
  Anthropic: Settings → Usage e Logs. OpenAI: Usage. Google: faturamento do projeto.
- GitHub: Settings → Security log; repositórios novos, chaves SSH novas, apps autorizados que você não reconhece.
- Gasto que não é seu: avise o suporte do provedor. A OpenAI reembolsou créditos usados no ataque do OpenCode.

## 5. Limpar o que ficou para trás

- **`.env` versionado no git:** `git rm --cached .env`; no `.gitignore`, as linhas `.env`, `.env.*` e `!.env.example`;
  depois `git commit --only .gitignore .env -m "tira .env do git"` (só esses dois, pra não levar junto trabalho que
  a pessoa deixou preparado). O histórico antigo continua com a chave; por isso o passo 1 vem antes. Repositório
  público com chave: trate como vazado sempre.
- **Ambiente Python contaminado:** só ambiente virtual de projeto (`.venv`, `venv`, ambiente conda com nome). Antes de
  apagar, guarde a lista de pacotes (`pip freeze > pacotes-antes.txt`, fora da pasta que vai sumir) e diga à pessoa o
  caminho que vai sumir; apague com o sim dela e recrie bloqueando as versões atacadas
  (`litellm!=1.107.0,!=1.82.7,!=1.82.8`). **Nunca apague o Python do sistema, o `base` do Anaconda ou Miniconda, nem
  pasta fora do projeto:** aí o caminho é desinstalar o pacote (`pip uninstall litellm`) e reinstalar o Python se o
  vírus estiver nele.
- **Histórico de conversa com chave em texto:** o checkup mostra onde. Depois de trocar a chave, o texto antigo vira
  lixo inofensivo; apagar é opcional.

## 6. Fechar

Escreva pra pessoa, em uma lista curta: o que foi trocado, onde a nova está, o que o teste mostrou, o que ainda
depende dela (ex.: trocar a senha do banco no painel). Rode o `checkup-seguranca` de novo e mostre o resultado.

## Nunca

- Nunca peça a chave nova no chat pra "configurar pra ela".
- Nunca rode "ferramenta de limpeza" ou "detector" baixado de link desconhecido.
- Nunca diga "resolvido" sem o teste do passo 3.
