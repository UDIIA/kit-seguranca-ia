# Instalar o kit (roteiro para o agente)

Quem segue este arquivo é o Claude Code ou o Codex que a pessoa mandou instalar o kit. Fale com ela em português
simples, mostre o que vai fazer antes de cada passo que muda arquivo, e não peça nenhuma chave.

## Passo 0. Ler antes de instalar

Leia os cinco `SKILL.md` e os cinco scripts `.mjs` em `skills/`. Conte à pessoa, em até 5 linhas, o que cada script
faz e quais acessam a internet. O esperado é:

- `checkup.mjs` e `mascara.mjs`: nenhum acesso à internet.
- `sonda-site.mjs`: só os domínios que a pessoa passar.
- `testa-chave.mjs`: só o provedor da chave testada (Anthropic, OpenAI, Google, GitHub...), rota de leitura.
- `idade-pacote.mjs`: só `registry.npmjs.org` e `pypi.org`.

Se o código fizer qualquer coisa diferente disso, pare e conte. Instalar sem ler é o hábito que o kit existe pra
quebrar.

## Passo 1. Conferir o Node

`node --version`. São duas perguntas separadas:

- **O kit roda?** Precisa do Node 18 ou mais novo. Abaixo disso, ou sem Node, conte à pessoa e ofereça instalar o
  Node primeiro (nodejs.org); sem ele, faça só os passos 2 e 3 e os itens à mão da skill de checkup.
- **Este Node está corrigido?** Abaixo de 22.23.4, 24.22.1 ou 26.12.1 (conforme a linha), ele roda o kit mas está sem a
  correção de 21/10/2026. Avise já: é o primeiro item que o checkup vai acusar.

Em todo comando com caminho, use aspas: no Windows o nome de usuário pode ter espaço (`"C:/Users/Ana Paula/..."`).

## Passo 2. Copiar as skills

Para cada pasta em `skills/` (checkup-seguranca, sonda-do-site, segredo-fora-do-chat, vazou-e-agora,
pacote-novo-com-calma):

- **Claude Code:** copiar para `~/.claude/skills/<nome>/`.
- **Codex:** copiar para `~/.agents/skills/<nome>/`. Versões antigas do Codex leem `~/.codex/skills/`; se só essa
  existir, use ela.
- Se já existir pasta com o mesmo nome, renomeie a antiga para `<nome>.bak-<AAAAMMDD>` antes de copiar. Se a
  renomeação falhar (arquivo aberto, falta de permissão), pare e conte; não copie por cima.

Instale nos dois agentes que existirem na máquina (`~/.claude` e `~/.codex`). No Windows, `~` é
`C:\Users\<usuário>`.

## Passo 3. Regras sempre ligadas

Acrescente o conteúdo de `regras/REGRAS-SEGURANCA.md` ao fim de:

- `~/.claude/CLAUDE.md` (Claude Code), com `<SKILLS>` trocado pelo caminho real, por exemplo
  `C:/Users/ana/.claude/skills` ou `/Users/ana/.claude/skills`;
- `~/.codex/AGENTS.md` (Codex), com `<SKILLS>` trocado por `~/.agents/skills` em caminho real.

Crie o arquivo se não existir. Se já houver um bloco entre `<!-- kit-seguranca-ia:inicio` e
`<!-- kit-seguranca-ia:fim -->`, substitua esse bloco em vez de duplicar. Não mexa no resto do arquivo.

## Passo 4. Trava automática (opcional, recomendado)

Regra escrita é conselho: o agente pode esquecer. Um hook roda antes de cada comando e pode dizer não. O tripwires
é um hook de código aberto (MIT) feito por quem escreveu este kit; a regra `secret-file-read` barra `cat .env`,
leitura de `settings.json` com chave e parecidos, e ensina o caminho mascarado.

Conte isto à pessoa antes de instalar, porque é a regra 2 do próprio kit: a versão 0.1.2 saiu em 22/10/2026, tem
menos de 7 dias e foi publicada com prova de origem a partir de github.com/UDIIA/tripwires. Se ela quiser ler antes,
o código está lá. Com o sim dela:

```bash
npm install -g tripwires@0.1.2
tripwires init
tripwires doctor
```

Se ela já ligou a espera de 7 dias no npm, o primeiro comando vai recusar. Aí existe uma exceção, só pra este
pacote e só com um sim dela dito pra isso: `npm install -g tripwires@0.1.2 --min-release-age=0`. Não use esse
atalho pra nenhum outro pacote; o resto continua esperando os 7 dias.
No Codex, depois do `init`: abrir o Codex, rodar `/hooks` e confiar nas duas entradas do tripwires.
Pra conferir que pegou: `tripwires try "cat .env"` tem que responder `DENY`.

## Passo 5. Primeiro checkup

Antes de rodar, diga à pessoa o que ele olha e quanto demora: versões de Node, Python e PHP, a pasta de usuário
dela (com limite de tempo) e o histórico de conversa do Claude Code e do Codex, sem nada sair do computador; de 10 s
a 2 min. Depois rode a skill `checkup-seguranca` e mostre o resultado do jeito que ela pede (resumo, cada URGENTE
explicado em uma frase, o que dá pra consertar agora). Ofereça ligar a espera de 7 dias nos gerenciadores de pacote
que ele listar; conserto só com o sim dela.

## Passo 6. Site (se ela tiver)

Pergunte se ela tem site ou aplicativo publicado. Peça que ela digite o domínio e confirme que é dela (ou que tem
autorização por escrito pra testar). Só então rode a skill `sonda-do-site` com aquele domínio.

## Passo 7. Fechar

Diga à pessoa, em uma lista curta: o que foi instalado e onde, o que o checkup achou, o que ainda depende dela.
Não diga que o computador "está seguro": diga o que foi medido e o que ficou de fora (antivírus, atualização do
sistema, senha forte com verificação em duas etapas).
Ensine a desinstalar: apagar as cinco pastas de skill (em `~/.claude/skills/`, `~/.agents/skills/` e, se usou,
`~/.codex/skills/`), apagar o bloco entre os marcadores no CLAUDE.md e no AGENTS.md, e `tripwires uninstall` se ela
instalou a trava.
