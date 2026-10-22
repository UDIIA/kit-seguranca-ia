# Kit de Segurança pro Claude Code e o Codex

Um pacote grátis, em português, que você instala no seu Claude Code ou no seu Codex. São cinco skills (roteiros que o
agente segue, cada um com um script pequeno) e seis regras que o agente passa a ler em toda conversa. Com elas, o
agente faz um checkup do seu computador, testa se o seu site deixa arquivo de chave à mostra, confere arquivo de chave
mostrando só o nome de cada valor, segue um roteiro quando uma chave vaza e confere a idade de um pacote antes de
instalar.

Feito pela [UDIIA](https://udiia.com), comunidade brasileira de IA, a partir do que rodamos nos nossos computadores em
21 e 22/10/2026.

**Usa IA só no navegador ou no celular?** Cole o
[pedido "Sem terminal"](PROMPTS.md#sem-terminal-claude-chatgpt-ou-gemini-pelo-navegador-ou-pelo-celular) no Claude,
no ChatGPT ou no Gemini. Ele te faz uma pergunta por vez e monta a lista do que conferir hoje. O resto desta página é
pra quem usa Claude Code ou Codex no computador. Palavra estranha? Tem um [glossário](#palavras-que-aparecem-aqui) no
fim.

## Por que agora

Entre 19 e 21/10/2026 vieram três ataques atrás do mesmo alvo, a chave, e uma rodada de correção urgente:

- **21/10, pacote envenenado.** A versão 1.107.0 do LiteLLM, biblioteca Python que liga programas a dezenas de IAs,
  saiu com um ladrão de credenciais e ficou cerca de 1h45 no ar. Levava senha salva no navegador, chave SSH (a que dá
  acesso a servidores), chave de nuvem e a configuração de mais de 15 ferramentas de IA de programação, e deixava um
  carregador que busca código novo a cada hora.
  Fontes: [LiteLLM](https://docs.litellm.ai/blog/security-incident-oct-21-2026),
  [StepSecurity](https://www.stepsecurity.io/blog/litellm-1-107-0-compromised-pypi-backdoored-wheels-credential-stealer).
- **19 a 21/10, cofre invadido.** O Console do OpenCode e a Railway, lugares onde muita gente guarda chave de API,
  foram invadidos. No OpenCode, os invasores gastaram crédito de IA na conta das vítimas; a Railway pediu a todos os
  clientes que trocassem as chaves guardadas lá. Fontes:
  [TechCrunch](https://techcrunch.com/2026/10/19/hackers-hit-ai-coding-tool-opencode-running-up-charges-on-users-ai-accounts),
  [Railway](https://blog.railway.com/p/security-disclosure-wednesday-october-21st).
- **21/10, buraco no servidor.** Duas falhas no PHP, a linguagem por trás do WordPress, deixam um pedido web executar
  código no servidor sem login (o apelido é PHP2Shell). Os detalhes vazaram antes da correção, e vários governos
  tiraram sites do ar por precaução. Fontes:
  [Security Labs da Datadog](https://securitylabs.datadoghq.com/articles/php2shell-critical-vulnerabilities-in-php/),
  [watchTowr](https://watchtowr.com/intelligence/php-cve-2026-109618-faq/).
- **21/10, correção urgente.** O Node.js, que roda boa parte das ferramentas de IA, corrigiu 10 falhas; a pior executa
  código pelo descompactador Brotli, usado pra comprimir tráfego da web. Fonte:
  [nodejs.org](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).

Quem usa Claude Code e Codex está no meio disso, porque o agente instala pacote, lê arquivo e roda comando por você.
Sem regra, ele faz exatamente o que o atacante precisa.

## Instalar

Abra o Claude Code ou o Codex no terminal e cole:

```
Instale o kit de segurança de https://github.com/UDIIA/kit-seguranca-ia seguindo o INSTALAR.md de lá. Antes de copiar qualquer coisa, leia os scripts e me diga em poucas linhas o que cada um faz e se algum manda dado pra internet.
```

O agente baixa o kit numa pasta temporária, lê os cinco scripts e te conta o que cada um faz antes de copiar qualquer
coisa. Depois instala as skills, acrescenta as regras e roda o primeiro checkup. No Codex, aprove quando ele pedir
acesso à internet pra baixar. Precisa do Node 18 ou mais novo (o programa que roda os scripts); o agente confere isso
pra você.

Pra conferir o que ele contar: o passo 0 do [INSTALAR.md](INSTALAR.md) lista o que cada script deve fazer, e os cinco
scripts estão aqui no GitHub pra qualquer pessoa ler, sem nenhum pacote de terceiro. Se o resumo do agente não bater
com essa lista, pare a instalação.

Prefere baixar você mesmo? No computador, use o botão verde "Code" → "Download ZIP" (ou o
[ZIP direto](https://github.com/UDIIA/kit-seguranca-ia/archive/refs/heads/main.zip)), descompacte e diga ao
agente: "instale o kit que está na pasta <pasta> seguindo o INSTALAR.md".

Mais pedidos prontos (checkup, testar o site, acho que vazou, antes de instalar qualquer coisa) estão em
[PROMPTS.md](PROMPTS.md).

## O que vem

| Skill | Pra que serve | Script |
|---|---|---|
| `checkup-seguranca` | Checkup do computador | `checkup.mjs` |
| `sonda-do-site` | Testa 23 endereços do seu site que deviam estar fechados | `sonda-site.mjs` |
| `segredo-fora-do-chat` | Confere arquivo de chave sem mostrar os valores | `mascara.mjs` |
| `vazou-e-agora` | Roteiro de vazamento, na ordem certa | `testa-chave.mjs` |
| `pacote-novo-com-calma` | Idade de um pacote e a espera de 7 dias | `idade-pacote.mjs` |

Mais `regras/REGRAS-SEGURANCA.md`: seis regras que vão no seu `CLAUDE.md` e no seu `AGENTS.md`.

O checkup olha a versão do Node, do Python e do PHP; o LiteLLM envenenado e as marcas que o vírus deixa; se o npm,
o pnpm, o uv e o bun esperam antes de instalar versão nova; `.env` dentro do git; e chave esquecida em texto no
histórico do Claude Code, do Codex e do terminal.

A sonda pede `.env`, `.git`, backup de banco, arquivos de configuração com senha e páginas de diagnóstico do servidor,
e diz quais responderam. O roteiro de vazamento vai nesta ordem: trocar a chave, pôr a nova onde ela é usada,
confirmar que a velha parou e a nova funciona, ver se alguém usou a antiga e só então limpar.

### Como fica a saída

Trecho real do teste automático (`node teste/teste-checkup.mjs --mostrar`), que monta uma pasta de usuário falsa com o
pacote envenenado e chaves geradas na hora. A chave plantada tem 39 caracteres; o relatório mostra os 8 primeiros.

```
Resumo: 7 URGENTE · 10 ATENÇÃO · 2 OK

- [URGENTE] Pacote envenenado: LiteLLM 1.107.0 instalado em ~\projetos\bot\.venv\Lib\site-packages
  O que fazer: Siga a skill vazou-e-agora AGORA: troque todas as chaves deste computador, depois ...
- [ATENÇÃO] Histórico: 1 chave(s) Google (Gemini, Cloud) em texto no histórico (1 arquivo(s))
  Começo mascarado: AIza9ERC… (39 caracteres). Exemplos de arquivo: ~\.claude\projects\x\sessao.jsonl.
- [OK] Node.js: Node 22.23.4 já tem a correção de 21/10/2026
```

## O que ele faz e o limite dele

- **Nada sai do seu computador sem você mandar.** O checkup e o mascarador não acessam a internet. A sonda acessa só
  os domínios que você passar. O teste de chave fala só com o provedor daquela chave, numa rota de leitura. O
  conferidor de pacote consulta só o npm e o PyPI.
- **Nenhum script imprime valor de chave.** Aparece o tipo, a contagem e o começo mascarado. O teste automático planta
  chaves geradas na hora e confere que nenhuma aparece na saída.
- **Regra escrita depende de o agente lembrar dela.** Por isso o passo 4 do INSTALAR.md oferece uma trava automática
  (hook) que barra a leitura de arquivo de chave, e o checkup oferece ligar a espera de 7 dias direto no npm, no pnpm,
  no uv e no bun, onde ela vale mesmo se o agente esquecer.
- **Ele mede o que conhece.** O checkup procura falhas e golpes com nome e data. Antivírus, atualização do sistema e
  senha forte com verificação em duas etapas continuam por sua conta.

## De onde veio

Do que rodamos nos nossos computadores em 21 e 22/10/2026, quando a onda chegou: varremos 74 sites nossos atrás de
arquivo de chave exposto (444 testes, nenhum aberto), testamos quais chaves de IA ainda respondiam sem imprimir
nenhuma, conferimos o LiteLLM nas duas máquinas de trabalho (nenhuma 1.107.0) e atualizamos Node, certifi, uv e bun,
medindo a versão depois. O instalador do Node no Windows fechou à força programas que usavam o Node; por isso a skill
de checkup manda listar o que está rodando antes de atualizar. O kit é esse trabalho em forma de skill, pra qualquer
Claude Code ou Codex repetir.

Os scripts e os textos passaram por revisão de duas IAs de outros fornecedores (Gemini e Grok), e o teste automático
tem 23 casos. A trava automática opcional do passo 4 do INSTALAR.md é o
[tripwires](https://github.com/UDIIA/tripwires), também da UDIIA e também de código aberto.

## Palavras que aparecem aqui

- **Chave de API:** código longo (começa com `sk-`, `AIza`, `ghp_` e parecidos) que você cria no painel de
  desenvolvedor de um serviço de IA ou de nuvem pra um programa usar a sua conta. É outra coisa além da senha com que
  você entra no site do ChatGPT ou do Claude. Quem rouba a sua chave gasta o seu crédito.
- **Terminal:** a janela onde se digitam comandos (PowerShell no Windows, Terminal no Mac). É onde o Claude Code e o
  Codex costumam rodar.
- **`.env`:** arquivo onde projetos guardam chaves. Deveria ficar fora do GitHub e fora da pasta pública do site.
- **Git e repositório:** o git guarda cada versão dos arquivos de um projeto; o repositório é a pasta com esse
  histórico, no seu computador ou no GitHub. Arquivo que entrou no histórico continua lá depois de apagado.
- **Pacote e gerenciador de pacotes:** pacote é uma biblioteca pronta que se instala com um comando; o gerenciador é o
  programa que instala (npm, pnpm, yarn e bun pra JavaScript; pip e uv pra Python). Foi por um pacote que o LiteLLM
  envenenado entrou.
- **Node:** o programa que roda JavaScript fora do navegador. Os scripts do kit e muitas ferramentas de IA rodam nele.
- **PHP:** a linguagem de muitos sites, inclusive os feitos em WordPress.
- **Skill:** pasta com um roteiro (`SKILL.md`) que o Claude Code e o Codex leem quando o assunto aparece.
- **`CLAUDE.md` e `AGENTS.md`:** as instruções que o Claude Code e o Codex leem no começo de toda conversa.
- **Hook:** programa que roda antes de cada comando do agente e pode barrar o comando.
- **MCP:** extensão que dá ao agente acesso a outro serviço (banco, e-mail, navegador). Também se instala, então a
  regra 2 vale pra ele.
- **MIT:** licença de código aberto. Qualquer pessoa pode usar, copiar e mudar o código.

## Desinstalar

Apague as cinco pastas de skill (em `~/.claude/skills/`, `~/.agents/skills/` e, no Codex antigo, `~/.codex/skills/`),
apague o bloco entre `<!-- kit-seguranca-ia:inicio` e `<!-- kit-seguranca-ia:fim -->` no `CLAUDE.md` e no
`AGENTS.md`, e rode `tripwires uninstall` se instalou a trava.

## Licença

MIT. Veja [LICENSE](LICENSE).
