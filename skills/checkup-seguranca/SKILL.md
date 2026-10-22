---
name: checkup-seguranca
description: Checkup de segurança do computador de quem usa Claude Code ou Codex. Use quando a pessoa disser "checkup de segurança", "fui afetado?", "teve ataque", "vazou alguma coisa?", "minha máquina tá segura?", "roda o kit", ou depois de notícia de pacote envenenado, falha em Node, Python ou PHP, ou vazamento de plataforma. Roda o checkup.mjs (local, sem rede, sem imprimir chave), explica o resultado em português simples, propõe os consertos e só aplica cada um com o sim da pessoa.
---

# Checkup de segurança

O script `checkup.mjs` (nesta pasta) olha o computador e devolve uma lista com URGENTE, ATENÇÃO, OK e INFO.
Ele não abre conexão de rede e não imprime valor de chave: dá pra conferir as duas coisas lendo o código.

Limite: ele procura as falhas e as marcas conhecidas (com nome e data). Numa máquina já invadida, nenhum programa
rodado nela prova que ela está limpa. Por isso o fecho diz o que foi medido e o que ficou de fora, sem declarar a
máquina segura.

## Rodar

```bash
node "<pasta desta skill>/checkup.mjs"
```

`<pasta desta skill>` é a pasta onde este SKILL.md está.

- Antes de rodar, conte à pessoa: leva até uns 2 minutos (a varredura para sozinha no limite de 90 s), varre a pasta do usuário (inclusive OneDrive e Dropbox)
  com limite de tempo e lê o histórico de conversa do Claude Code e do Codex atrás de chave esquecida em texto.
  Nada sai do computador.
- Projetos fora da pasta do usuário: `--pasta <pasta>`. Histórico grande: `--tempo 600`. Sem ler histórico:
  `--sem-historico`. Pra guardar: `--salvar checkup-AAAA-MM-DD.md` (só aceita `.md` e não sobrescreve outro arquivo).
  Caminho com espaço vai entre aspas.
- Sem Node no computador: diga isso à pessoa (o kit inteiro precisa dele) e confira à mão o que não depende de Node:
  `pip show litellm certifi` em cada Python e ambiente (itens 3 e 7), a pasta temporária atrás de `.pc_once_*` e
  `.pc_sq_*` (item 4), `docker images | findstr litellm` ou `| grep litellm` (item 5), `php -v` (item 6) e
  `git ls-files .env` em cada projeto (item 9).

## O que ele confere

| # | Item | Por quê |
|---|---|---|
| 1 | Versão do Node | 21/10/2026: 10 falhas corrigidas, uma executa código. Mínimo 22.23.4, 24.22.1 ou 26.12.1. |
| 2 | Trava de idade do npm, pnpm, uv e bun | Versão recém-publicada espera 7 dias. O LiteLLM envenenado ficou ~1h45 no ar. |
| 3 | LiteLLM 1.107.0 (e 1.82.7, 1.82.8), arquivos cook.pth, cook.py, sitecustomize.py | O pacote envenenado de 21/10/2026 e o ataque de março de 2026 ao mesmo pacote. |
| 4 | Marca do vírus na pasta temporária | O ladrão grava `.pc_once_...` depois de mandar os dados embora. |
| 5 | Imagens Docker do LiteLLM | A v1.107.0 e as tags latest, main-latest e main-stable de 21/10 vieram contaminadas. |
| 6 | PHP local | PHP2Shell: corrigido em 8.2.35, 8.3.36, 8.4.27, 8.5.12. |
| 7 | certifi antigo | Versão anterior à 2026.10.19 ainda confia nos 8 certificados intermediários revogados da eMudhra. |
| 8 | Arquivos de credencial em disco | O que um ladrão de credencial levaria daqui. Só presença, nada é lido em voz alta. |
| 9 | `.env` versionado no git | Chave dentro do histórico do repositório. |
| 10 | Chave em texto no histórico de conversa e de terminal | Cada `cat .env` antigo deixou a chave gravada no disco. |
| 11 | Travas ligadas | Hook que barra leitura de arquivo de chave; regras do kit no CLAUDE.md e no AGENTS.md. |

## Depois de rodar

1. Mostre o resumo (quantos URGENTE, ATENÇÃO, OK) e explique cada URGENTE em uma frase de gente: o que é, por que
   importa, o que fazer. Jargão só com tradução do lado.
2. **URGENTE de pacote envenenado ou marca do vírus:** pare tudo e abra a skill `vazou-e-agora`. A ordem é trocar as
   chaves primeiro (de outro aparelho, se a máquina pode estar comprometida), limpar depois.
3. **Correções que você pode fazer na hora, com o sim da pessoa:** ligar a trava de idade do jeito da skill
   `pacote-novo-com-calma` (conferindo antes a versão de cada gerenciador), pôr `.env`, `.env.*` e `!.env.example` no
   .gitignore, atualizar certifi no ambiente indicado, pôr as regras do kit no CLAUDE.md e no AGENTS.md.
4. **Atualizar Node ou PHP:** siga o passo a passo da seção "Atualizar o Node" abaixo. No PHP local vale a mesma
   ideia: atualizar pelo mesmo caminho que instalou, reiniciar o PHP-FPM ou o servidor web e mostrar `php -v`.
5. **Chave em histórico:** o relatório mostra só o começo mascarado. Pergunte se aquela chave ainda está em uso. Se
   estiver, a saída é trocar (skill `vazou-e-agora`); apagar o histórico não desfaz cópia que alguém já fez.
6. Rode o checkup de novo no fim e mostre o antes e depois.

## Atualizar o Node

Mínimo de 21/10/2026: 22.23.4, 24.22.1 ou 26.12.1, conforme a linha (22, 24 ou 26) que a pessoa já usa.

1. **Descubra como ele foi instalado:** `where node` no Windows, `which node` no macOS e no Linux. Caminho com `nvm`,
   `fnm` ou `volta` quer dizer gerenciador de versão (`nvm install 22.23.4`, `fnm install 22.23.4`,
   `volta install node@22.23.4`). `C:\Program Files\nodejs` quer dizer o instalador oficial. Homebrew, `apt` ou
   outro gerenciador do sistema: atualize por ele. Atualize sempre pelo mesmo caminho que instalou.
2. **Guarde o caminho de volta:** anote a versão atual (`node --version`). Com gerenciador de versão a anterior
   continua instalada. Com o instalador oficial, a versão anterior fica em `https://nodejs.org/dist/v<versão>/`.
3. **Baixe só de nodejs.org e confira:** compare o SHA256 do instalador com o `SHASUMS256.txt` da mesma pasta
   (`certutil -hashfile <arquivo> SHA256` no Windows, `shasum -a 256 <arquivo>` no macOS e no Linux). Diferente:
   apague o arquivo e conte à pessoa.
4. **Antes de instalar, liste o que usa o Node agora** (`tasklist /fi "imagename eq node.exe"` no Windows,
   `ps aux | grep node` no macOS e no Linux) e diga à pessoa o que vai fechar. No Windows o instalador fecha à força
   os programas que usam o Node, mesmo com a opção que deveria impedir isso (medido em 22/10/2026). Se o próprio
   agente roda no Node (Claude Code instalado pelo npm, servidores MCP), a conversa pode cair no meio: peça à pessoa
   pra salvar o trabalho e rodar o instalador ela mesma, ou avise antes de rodar.
5. **Sem permissão de administrador:** use um gerenciador de versão (nvm, fnm), que instala na pasta do usuário, ou
   baixe o arquivo compactado oficial da mesma pasta de nodejs.org (`.zip` no Windows, `.tar.xz` no macOS e no
   Linux), confira o SHA256, descompacte numa pasta do usuário e ponha essa pasta na frente do PATH dos programas que
   precisam da correção já.
6. **Depois:** abra um terminal novo e rode `node --version`. Só chame de atualizado com o número certo na tela.
   Programa que estava aberto antes continua com o Node velho na memória até reiniciar: reabra servidores, MCPs e o
   próprio agente, e rode o checkup de novo.
7. **Aplicativos com motor próprio** (VS Code, Cursor, Claude Desktop, app do Codex, OpenCode desktop) trazem Node
   ou Electron dentro: a correção deles chega pela atualização de cada um. Peça à pessoa pra abrir cada um e aplicar a
   atualização pendente.

## Nunca

- Nunca imprimir conteúdo de arquivo de credencial pra "conferir". Use `mascara.mjs` (skill `segredo-fora-do-chat`).
- Nunca apagar ambiente, imagem ou arquivo sem a pessoa dizer sim, com o nome do que vai sumir.
- Nunca baixar "ferramenta de detecção" ou "prova de conceito" de repositório desconhecido pra confirmar o ataque:
  repositório falso de falha famosa é um jeito comum de espalhar vírus.
