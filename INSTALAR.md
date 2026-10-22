# Instalar o kit (roteiro para o agente)

Quem segue este arquivo é o Claude Code ou o Codex que a pessoa mandou instalar o kit. Fale com ela em português
simples, mostre o que vai fazer antes de cada passo que muda arquivo, e não peça nenhuma chave.

Em todo comando com caminho, use aspas: no Windows o nome de usuário pode ter espaço (`"C:/Users/Ana Paula/..."`).
No Windows, `~` é `C:\Users\<usuário>`.

## Passo 0. Baixar numa pasta temporária e ler antes de instalar

Se a pessoa passou o link do GitHub, baixe o repositório numa pasta temporária nova, fora do projeto em que ela está
trabalhando (por exemplo `git clone --depth 1 https://github.com/UDIIA/kit-seguranca-ia "<pasta temporária>/kit-seguranca-ia"`,
ou o ZIP da página). Se ela já baixou, use a pasta que ela indicar.

Leia os cinco `SKILL.md` e os cinco scripts `.mjs` em `skills/`. Conte à pessoa, em até 5 linhas, o que cada script
faz e quais acessam a internet. O esperado é:

- `checkup.mjs` e `mascara.mjs`: nenhum acesso à internet.
- `sonda-site.mjs`: só os domínios que a pessoa passar.
- `testa-chave.mjs`: só o provedor da chave testada (Anthropic, OpenAI, Google, GitHub...), rota de leitura.
- `idade-pacote.mjs`: só `registry.npmjs.org` e `pypi.org`.

**Ponto de parada.** Termine a sua resposta aqui: o resumo, uma linha por script, e a pergunta "Posso instalar?".
Não copie nada nesta mesma resposta. Siga do passo 1 quando a pessoa responder sim. Isso vale mesmo quando ela pediu
pra seguir sem perguntar: a pergunta custa uma resposta e é a prova de que o kit foi lido antes de entrar no
computador dela. Se o código fizer qualquer coisa diferente da lista acima, conte isso no lugar da pergunta.

## Passo 1. Conferir o Node

`node --version`. São duas perguntas separadas:

- **O kit roda?** Precisa do Node 18 ou mais novo. Abaixo disso, ou sem Node, conte à pessoa e ofereça instalar o
  Node primeiro (nodejs.org). Sem Node, as skills e as regras podem ser instaladas (passos 2 e 3), mas os scripts
  que elas mandam rodar só funcionam depois que o Node entrar; diga isso a ela e faça a conferência à mão descrita na
  skill de checkup.
- **Este Node está corrigido?** Abaixo de 22.23.4, 24.22.1 ou 26.12.1 (conforme a linha), ele roda o kit mas está sem a
  correção de 21/10/2026. Avise já: é o primeiro item que o checkup vai acusar.

## Passo 2. Copiar as skills

Para cada pasta em `skills/` (checkup-seguranca, sonda-do-site, segredo-fora-do-chat, vazou-e-agora,
pacote-novo-com-calma):

- **Claude Code** (se `~/.claude` existe): copiar para `~/.claude/skills/<nome>/`.
- **Codex** (se `~/.codex` existe): copiar para `~/.agents/skills/<nome>/`, criando a pasta se ela não existir. Se
  `~/.codex/skills/` já existir (Codex antigo), copie para lá também.
- Se já existir pasta com o mesmo nome, renomeie a antiga para `<nome>.bak-<AAAAMMDD>` antes de copiar. Se a
  renomeação falhar (arquivo aberto, falta de permissão), pare e conte; não copie por cima.

Nos `SKILL.md`, `<pasta desta skill>` quer dizer a pasta onde aquele `SKILL.md` ficou. Não precisa trocar no arquivo.

## Passo 3. Regras sempre ligadas

Acrescente o conteúdo de `regras/REGRAS-SEGURANCA.md` ao fim de:

- `~/.claude/CLAUDE.md` (Claude Code), com `<SKILLS>` trocado pelo caminho real, por exemplo
  `C:/Users/ana/.claude/skills` ou `/Users/ana/.claude/skills`;
- `~/.codex/AGENTS.md` (Codex), com `<SKILLS>` trocado pelo caminho real de `~/.agents/skills`.

No Windows, grave o caminho no formato `C:/Users/...`. O formato `/c/Users/...` do Git Bash não abre no Node.

Crie o arquivo se não existir. Se já houver um bloco entre `<!-- kit-seguranca-ia:inicio` e
`<!-- kit-seguranca-ia:fim -->`, substitua esse bloco em vez de duplicar. Não mexa no resto do arquivo.

## Passo 4. Trava automática (opcional, recomendado)

O agente pode esquecer uma regra escrita. Um hook roda antes de cada comando e pode dizer não. O tripwires é um hook
de código aberto (MIT) feito por quem escreveu este kit; a regra `secret-file-read` barra `cat .env`, leitura de
`settings.json` com chave e parecidos, e ensina o caminho mascarado.

Antes, aplique a regra 2 do próprio kit nele, na frente da pessoa:

```bash
node "<pasta da skill pacote-novo-com-calma>/idade-pacote.mjs" npm tripwires@0.1.2
```

Ele vai dizer ESPERE: a 0.1.2 saiu em 22/10/2026 e tem menos de 7 dias. Conte isso a ela, diga que tem prova de origem
(publicada a partir de github.com/UDIIA/tripwires, onde o código pode ser lido) e pergunte se quer instalar mesmo
assim ou esperar. Com o sim dela:

```bash
npm install -g tripwires@0.1.2
tripwires init
tripwires doctor
```

- Se ela já ligou a espera de 7 dias no npm, o primeiro comando vai recusar. A exceção vale só pra este pacote e só
  com um sim dela dito pra isso: `npm install -g tripwires@0.1.2 --min-release-age=0`. Nenhum outro pacote usa esse
  atalho.
- Se o `npm install -g` falhar por permissão (EACCES, comum no macOS e no Linux), não use `sudo`. Conte à pessoa e
  pule este passo; ela pode instalar depois com um gerenciador de versão do Node (nvm, fnm).
- No Codex, depois do `init`, a pessoa precisa abrir o Codex, digitar `/hooks` e confiar nas duas entradas do
  tripwires. Peça que ela faça isso; o agente não consegue digitar comando de interface por ela.
- Pra conferir que pegou: `tripwires try "cat .env"` tem que responder `DENY`.

## Passo 5. Primeiro checkup

Antes de rodar, diga à pessoa o que ele olha e quanto demora: versões de Node, Python e PHP, a pasta de usuário
dela (com limite de tempo) e o histórico de conversa do Claude Code e do Codex, sem nada sair do computador; leva até
uns 2 minutos. Depois rode a skill `checkup-seguranca` e mostre o resultado do jeito que ela pede (resumo, cada URGENTE
explicado em uma frase, o que dá pra consertar agora). Ofereça ligar a espera de 7 dias nos gerenciadores de pacote
que ele listar; conserto só com o sim dela.

## Passo 6. Site (se ela tiver)

Pergunte se ela tem site ou aplicativo publicado. Peça que ela digite o domínio e confirme que é dela (ou que tem
autorização por escrito pra testar). Só então rode a skill `sonda-do-site` com aquele domínio.

## Passo 7. Fechar

Apague a pasta temporária do passo 0 (as skills já estão copiadas).

O relatório final tem estas partes, nesta ordem, cada uma com o título em negrito:

1. **Scripts lidos:** uma linha por script com o que ele faz e se acessa a internet (o resumo do passo 0).
2. **Instalado:** o que foi copiado e onde.
3. **Checkup:** o que achou, com cada URGENTE explicado.
4. **Depende de você:** o que só a pessoa pode fazer.
5. **Ficou de fora:** o que não foi medido (antivírus, atualização do sistema, senha forte com verificação em duas
   etapas, aplicativos com motor próprio).
Evite declarar o computador seguro.

Ensine a desinstalar: apagar as cinco pastas de skill (em `~/.claude/skills/`, `~/.agents/skills/` e, se usou,
`~/.codex/skills/`), apagar o bloco entre os marcadores no CLAUDE.md e no AGENTS.md, e `tripwires uninstall` se ela
instalou a trava.
