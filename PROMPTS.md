# Pedidos prontos

Copie, cole no Claude Code ou no Codex e troque o que estiver entre colchetes. Nenhum deles pede chave: se um
agente pedir pra você colar chave ou senha na conversa, diga não.

## Instalar o kit

```
Instale o kit de segurança de https://github.com/UDIIA/kit-seguranca-ia seguindo o INSTALAR.md de lá. Antes de copiar qualquer coisa, leia os scripts e me diga em poucas linhas o que cada um faz e se algum manda dado pra internet.
```

## Checkup do computador

```
Roda o checkup de segurança do kit e me explica o resultado como se eu não fosse técnico. Antes de mudar qualquer coisa, me diz o que vai mudar e espera meu ok.
```

## Testar o meu site

```
Testa se o meu site [meusite.com.br] deixa algum arquivo sensível público, com a skill sonda-do-site. O domínio é meu. Se aparecer algo urgente, me diz o que tirar do ar e quais chaves trocar.
```

## Acho que vazou

```
Acho que minha chave da [OpenAI / Anthropic / Google / GitHub] vazou. Segue a skill vazou-e-agora comigo, um passo por vez. Não me peça pra colar a chave aqui: eu digito a nova direto no lugar certo.
```

## Antes de instalar qualquer coisa

```
Antes de instalar [nome do pacote, MCP ou skill], confere a idade da versão, se o autor retirou e o que ela roda na instalação. Se for skill ou MCP, lê o código e me diz em 3 linhas o que faz e se manda dado pra fora.
```

## Ligar a espera de 7 dias em tudo

```
Liga a espera de 7 dias pra versão nova em todos os gerenciadores de pacote que eu tenho (npm, pnpm, uv, bun, yarn), do jeito que a skill pacote-novo-com-calma ensina. Me mostra o antes e o depois.
```

## Guardar minhas chaves direito

```
Me ajuda a tirar minhas chaves de API do arquivo .env aberto e guardar num cofre. Usa o mascara.mjs pra ver o que tem nos arquivos, sem mostrar nenhum valor. Me dá duas opções de cofre que funcionam no meu sistema e faz comigo a que eu escolher.
```

## Rotina semanal

```
Roda o checkup de segurança e compara com o último relatório salvo na minha pasta de usuário (checkup-*.md). Me diz só o que mudou e salva o novo com a data de hoje.
```

## Sem terminal (Claude, ChatGPT ou Gemini pelo navegador ou pelo celular)

```
Quero um checkup de segurança depois da onda de ataques de outubro de 2026: a versão 1.107.0 do LiteLLM saiu envenenada em 21/10; as falhas PHP2Shell no PHP foram corrigidas em 21/10 (8.2.35, 8.3.36, 8.4.27, 8.5.12); o Console do OpenCode e a Railway vazaram chaves de clientes; o Node.js corrigiu 10 falhas em 21/10 (22.23.4, 24.22.1, 26.12.1). Eu não uso terminal. Me entrevista, uma pergunta por vez, pra descobrir: quais ferramentas de IA eu uso e onde guardei minhas chaves de API; se tenho site, em qual hospedagem, e se é WordPress; se instalei algo com Python ou Node nesta semana. No fim, me dá a lista do que fazer hoje, em ordem, com o caminho dentro de cada painel pra trocar chave e ligar limite de gasto. Nunca me peça pra colar uma chave ou senha aqui.
```
