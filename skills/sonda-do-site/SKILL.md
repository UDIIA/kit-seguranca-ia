---
name: sonda-do-site
description: Confere se o site da pessoa deixa público arquivo que não devia (.env, pasta .git, backup do banco, config com senha, phpinfo) e se anuncia uma versão de PHP sem a correção do PHP2Shell. Use quando a pessoa disser "meu site tá seguro?", "testa meu site", "sonda o site", "meu site é WordPress, fui afetado?", ou depois de publicar site novo. Só em domínio que é dela.
---

# Sonda do site

`sonda-site.mjs` (nesta pasta) faz GET em 23 endereços conhecidos de cada domínio, um por vez, e diz o que está
público. A saída traz só o código HTTP, o tamanho e o veredito; o conteúdo que voltou fica fora da tela.

## Antes de rodar

Peça que a pessoa digite o domínio e confirme que é dela (ou que tem autorização por escrito pra testar). Testar site
dos outros sem autorização é invasão, mesmo sendo só GET. Se o domínio não for dela, não rode.

## Rodar

```bash
node "<pasta desta skill>/sonda-site.mjs" meusite.com.br loja.meusite.com.br
```

`<pasta desta skill>` é a pasta onde este SKILL.md está. Leva uns 15 s por domínio. `--json` devolve o resultado
estruturado. Se `meusite.com.br` redireciona pra `www.meusite.com.br` (ou o contrário), a sonda segue esse salto e
avisa; redirecionamento pra outro domínio ela só avisa.

## Ler o resultado

- **URGENTE** (`.env`, `.git`, `.sql`, `wp-config` de backup, `.npmrc`, `.htpasswd`): alguém pode estar lendo isso
  agora. Duas ações, nesta ordem: (1) tirar do ar (apagar da pasta publicada ou bloquear no servidor) e conferir
  rodando a sonda de novo; (2) trocar TODA chave e senha que estava no arquivo (skill `vazou-e-agora`), porque robô
  varre esses endereços o dia inteiro e o arquivo pode já ter sido copiado.
- **PHP sem correção no cabeçalho:** pedir à hospedagem PHP 8.2.35, 8.3.36, 8.4.27 ou 8.5.12 (ou mais novo) e
  esconder o número (`expose_php = Off`). Site WordPress, Drupal ou Joomla está no alvo do PHP2Shell.
- **ATENÇÃO** (`phpinfo`, `server-status`, `docker-compose.yml`, `netlify.toml`, `.DS_Store`): mostra a quem ataca
  como o site é montado. Tire da pasta publicada.
- **INFO** (`package.json`): lista as bibliotecas e versões do site. Baixo risco; tire se der.
- **OK:** nenhum dos 23 endereços conferidos está aberto. Outros arquivos e outras falhas ficam fora deste teste.

## Consertos por tipo de hospedagem

- **Netlify, Vercel, Cloudflare Pages:** o que está na pasta de publicação vai pro ar. Tire `.env`, `.git` e configs
  dessa pasta e ponha os segredos nas variáveis de ambiente do painel.
- **Hospedagem com cPanel ou Apache:** bloqueie arquivos que começam com ponto no `.htaccess`
  (`<FilesMatch "^\.">Require all denied</FilesMatch>`) e apague backups da pasta `public_html`.
- **Nginx:** `location ~ /\. { deny all; }`.
