---
name: sonda-do-site
description: Confere se o site da pessoa deixa público arquivo que não devia (.env, pasta .git, backup do banco, config com senha, phpinfo) e se anuncia uma versão de PHP sem a correção do PHP2Shell. Use quando a pessoa disser "meu site tá seguro?", "testa meu site", "sonda o site", "meu site é WordPress, fui afetado?", ou depois de publicar site novo. Só em domínio que é dela.
---

# Sonda do site

`sonda-site.mjs` (nesta pasta) faz GET em 23 endereços conhecidos de cada domínio, um por vez, e diz o que está
público. Não mostra o conteúdo que voltou, só o código HTTP, o tamanho e o veredito.

## Antes de rodar

Confirme que o domínio é da pessoa (ou que ela tem autorização por escrito pra testar). Testar site dos outros sem
autorização é invasão, mesmo sendo só GET. Se o domínio não for dela, não rode.

## Rodar

```bash
node "<pasta desta skill>/sonda-site.mjs" meusite.com.br loja.meusite.com.br
```

Leva uns 10 s por domínio. `--json` devolve o resultado estruturado.

## Ler o resultado

- **URGENTE** (`.env`, `.git`, `.sql`, `wp-config` de backup, `.npmrc`, `.htpasswd`): alguém pode estar lendo isso
  agora. Duas ações, nesta ordem: (1) tirar do ar (apagar da pasta publicada ou bloquear no servidor) e conferir
  rodando a sonda de novo; (2) trocar TODA chave e senha que estava no arquivo (skill `vazou-e-agora`). Tirar do ar
  sem trocar não resolve: robô varre esses endereços o dia inteiro.
- **PHP sem correção no cabeçalho:** pedir à hospedagem PHP 8.2.35, 8.3.36, 8.4.27 ou 8.5.12 (ou mais novo) e
  esconder o número (`expose_php = Off`). Site WordPress, Drupal ou Joomla está no alvo do PHP2Shell.
- **ATENÇÃO** (`phpinfo`, `server-status`, `docker-compose.yml`, `netlify.toml`, `.DS_Store`): não entrega chave
  sozinho, mas ensina o caminho a quem ataca. Tirar da pasta publicada.
- **INFO** (`package.json`): lista as bibliotecas e versões do site. Baixo risco; tire se der.
- **OK:** nenhum dos 23 endereços expostos. Isso não prova que o site está seguro; prova que esses 23 não estão
  abertos.

## Consertos por tipo de hospedagem

- **Netlify, Vercel, Cloudflare Pages:** o que está na pasta de publicação vai pro ar. Tire `.env`, `.git` e configs
  dessa pasta; segredo vai nas variáveis de ambiente do painel, nunca em arquivo publicado.
- **Hospedagem com cPanel ou Apache:** bloqueie arquivos que começam com ponto no `.htaccess`
  (`<FilesMatch "^\.">Require all denied</FilesMatch>`) e apague backups da pasta `public_html`.
- **Nginx:** `location ~ /\. { deny all; }`.
