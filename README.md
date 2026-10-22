# Kit de Segurança pro Claude Code e o Codex

Cinco skills (roteiros prontos que o agente segue, cada um com um script pequeno) e um bloco de regras que você
instala no seu Claude Code ou no seu Codex. Com eles, o agente faz um checkup do seu computador, testa se o seu site
deixa arquivo de chave à mostra, mantém suas chaves fora da conversa, sabe o que fazer quando uma chave vaza e espera
alguns dias antes de instalar versão nova de pacote.

Grátis, código aberto (MIT), em português. Funciona em Windows, macOS e Linux com Node 18 ou mais novo.

## Por que agora

Na semana de 16 a 22/10/2026 vieram três golpes contra o mesmo alvo, a chave, e uma rodada de correção urgente:

- **21/10, pacote envenenado.** A versão 1.107.0 do LiteLLM, biblioteca Python que liga programas a dezenas de IAs,
  saiu com um ladrão de credenciais e ficou cerca de 1h45 no ar. Levava senha salva no navegador, chave SSH, chave de
  nuvem e a configuração de mais de 15 ferramentas de IA de programação.
- **19 a 21/10, cofre invadido.** O Console do OpenCode e a Railway, lugares onde muita gente guarda chave de API,
  foram invadidos. Os invasores gastaram crédito de IA na conta das vítimas.
- **21/10, buraco no servidor.** Duas falhas no PHP (PHP2Shell) deixam um pedido web executar código no servidor sem
  login. Os detalhes vazaram antes da correção, e vários governos tiraram sites do ar por precaução.
- **21/10, correção urgente.** O Node.js, que roda boa parte das ferramentas de IA, corrigiu 10 falhas; a pior executa
  código pelo descompactador de arquivos.

Quem usa Claude Code e Codex está no meio disso, porque o agente instala pacote, lê arquivo e roda comando por você.
Sem regra, ele faz exatamente o que o atacante precisa.

## Instalar

Abra o Claude Code ou o Codex no terminal e cole:

```
Instale o kit de segurança de https://github.com/UDIIA/kit-seguranca-ia seguindo o INSTALAR.md de lá. Antes de copiar qualquer coisa, leia os scripts e me diga em poucas linhas o que cada um faz e se algum manda dado pra internet.
```

O agente baixa o repositório, lê, conta o que achou, instala as skills, acrescenta as regras e roda o primeiro
checkup. No Codex, aprove quando ele pedir acesso à internet pra baixar. Prefere baixar você mesmo? Botão verde
"Code" → "Download ZIP", descompacte e diga ao agente: "instale o kit que está na pasta <pasta> seguindo o
INSTALAR.md".

**Não usa terminal?** Use o [pedido "Sem terminal"](PROMPTS.md#sem-terminal-claude-chatgpt-ou-gemini-pelo-navegador-ou-pelo-celular):
você cola no Claude, no ChatGPT ou no Gemini do celular, ele te entrevista e monta a lista do que fazer hoje.
Outros pedidos prontos estão em [PROMPTS.md](PROMPTS.md).

## O que vem

| Skill | Pra que serve | Script |
|---|---|---|
| `checkup-seguranca` | Versão do Node, Python e PHP; o LiteLLM envenenado e as marcas do vírus; trava de idade do npm, pnpm, uv e bun; `.env` dentro do git; chave esquecida em texto no histórico do Claude Code, do Codex e do terminal | `checkup.mjs` |
| `sonda-do-site` | 23 endereços que não deviam estar públicos no seu site (`.env`, `.git`, backup do banco, config com senha) e a versão do PHP anunciada no cabeçalho | `sonda-site.mjs` |
| `segredo-fora-do-chat` | As regras pra chave nunca entrar na conversa e onde guardar cada uma | `mascara.mjs` |
| `vazou-e-agora` | Roteiro de vazamento na ordem certa: trocar, atualizar, testar, ver se alguém usou, limpar | `testa-chave.mjs` |
| `pacote-novo-com-calma` | Idade da versão, retirada pelo autor, script de instalação e como ligar a espera de 7 dias | `idade-pacote.mjs` |

Mais `regras/REGRAS-SEGURANCA.md`: seis regras que vão no seu `CLAUDE.md` e no seu `AGENTS.md` e valem em toda
conversa.

### Palavras que aparecem aqui

- **Chave de API:** a senha que um programa usa pra falar com a IA ou com um serviço. Quem tem a sua, gasta na sua
  conta.
- **`.env`:** arquivo onde projetos guardam essas chaves. Nunca deveria ir pro GitHub nem ficar público no site.
- **Skill:** pasta com um roteiro (`SKILL.md`) que o Claude Code e o Codex leem quando o assunto aparece.
- **`CLAUDE.md` e `AGENTS.md`:** as instruções que o Claude Code e o Codex leem no começo de toda conversa.
- **Hook:** programa que roda antes de cada comando do agente e pode barrar o comando.
- **Pacote:** biblioteca que se instala com `npm install` ou `pip install`. Foi por um pacote que o LiteLLM
  envenenado entrou.

## O que ele faz e o limite dele

- **Nada sai do seu computador sem você mandar.** O checkup e o mascarador não acessam a internet. A sonda acessa só
  os domínios que você passar. O teste de chave fala só com o provedor daquela chave, numa rota que não gasta
  crédito. O conferidor de pacote consulta só o npm e o PyPI.
- **Nenhum script imprime valor de chave.** Aparece o tipo, a contagem e o começo mascarado. O teste automático em
  `teste/teste-checkup.mjs` planta chaves geradas na hora e confere que nenhuma aparece na saída.
- **Ele mede o que conhece.** O checkup procura falhas e golpes com nome e data. Antivírus, atualização do sistema e
  senha forte com verificação em duas etapas continuam sendo seus.
- **Leia antes de instalar.** Vale pra este kit também: são cinco scripts curtos, sem dependência.

## De onde veio

Do que rodamos nos nossos computadores em 21 e 22/10/2026, quando a onda chegou: varremos 74 sites nossos atrás de
arquivo de chave exposto (444 pedidos, nenhum aberto), testamos quais chaves de IA ainda respondiam sem imprimir
nenhuma, conferimos o LiteLLM nas duas máquinas de trabalho e atualizamos Node, certifi, uv e bun, medindo a versão
depois. O instalador do Node no Windows fechou à força programas que usavam o Node; por isso a skill de checkup manda
listar o que está rodando antes de atualizar. O kit é esse trabalho em forma de skill, pra qualquer Claude Code ou
Codex repetir.

Feito pela [UDIIA](https://udiia.com), a comunidade de IA do Hibra, pra alunos e pra quem chega pelos grupos. A trava
automática opcional do passo 4 do INSTALAR.md é o
[tripwires](https://github.com/UDIIA/tripwires), também nosso e também MIT.

## Desinstalar

Apague as cinco pastas de skill (em `~/.claude/skills/`, `~/.agents/skills/` e, no Codex antigo, `~/.codex/skills/`),
apague o bloco entre
`<!-- kit-seguranca-ia:inicio` e `<!-- kit-seguranca-ia:fim -->` no `CLAUDE.md` e no `AGENTS.md`, e rode
`tripwires uninstall` se instalou a trava.

## Licença

MIT. Veja [LICENSE](LICENSE).
