#!/usr/bin/env node
// sonda-site.mjs (kit-seguranca-ia 1.0.0, MIT)
// Procura, no SEU site, os arquivos que não deviam estar públicos (.env, .git, backup de banco, config com senha) e
// o cabeçalho que entrega a versão do PHP. Só faz GET em endereço fixo, um por vez; nunca imprime o conteúdo que
// voltou, só o código HTTP, o tamanho e o veredito.
// Use só em domínio que é seu ou que você tem autorização por escrito pra testar.
// Uso: node sonda-site.mjs <dominio> [outro-dominio ...] [--json]
const args = process.argv.slice(2);
const dominios = args.filter((a) => !a.startsWith('--')).map((d) => d.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase());
if (!dominios.length) { console.error('uso: node sonda-site.mjs <dominio> [outro ...] [--json]'); process.exit(2); }
// Só nome de domínio puro (letras, números, hífen e ponto). "seusite.com@outro.com", porta, IP, espaço ou barra
// invertida mandariam os pedidos pra outro lugar; aí nada roda.
const DOMINIO = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const ruins = dominios.filter((d) => !DOMINIO.test(d));
if (ruins.length) { console.error(`domínio inválido: ${ruins.map((d) => JSON.stringify(d)).join(', ')}. Passe só o nome, como seusite.com.br (sem @, porta, IP ou espaço).`); process.exit(2); }
const UA = 'kit-seguranca-ia-sonda/1.0 (+github.com/UDIIA/kit-seguranca-ia)';
const PHP_MIN = { '8.5': '8.5.12', '8.4': '8.4.27', '8.3': '8.3.36', '8.2': '8.2.35' };
const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };

// [caminho, gravidade, o que é, teste do conteúdo]
const ALVOS = [
  ['/.env', 'urgente', 'arquivo de chaves', (t) => /^\s*[A-Z][A-Z0-9_]{2,}\s*=/m.test(t)],
  ['/.env.local', 'urgente', 'arquivo de chaves', (t) => /^\s*[A-Z][A-Z0-9_]{2,}\s*=/m.test(t)],
  ['/.env.production', 'urgente', 'arquivo de chaves', (t) => /^\s*[A-Z][A-Z0-9_]{2,}\s*=/m.test(t)],
  ['/.env.backup', 'urgente', 'arquivo de chaves', (t) => /^\s*[A-Z][A-Z0-9_]{2,}\s*=/m.test(t)],
  ['/.git/config', 'urgente', 'configuração do git (dá pra baixar o código e o histórico inteiro)', (t) => /\[core\]/.test(t)],
  ['/.git/HEAD', 'urgente', 'pasta .git publicada', (t) => /^ref: refs\//.test(t)],
  ['/wp-config.php.bak', 'urgente', 'cópia do config do WordPress com senha do banco', (t) => /DB_PASSWORD/.test(t)],
  ['/wp-config.php~', 'urgente', 'cópia do config do WordPress com senha do banco', (t) => /DB_PASSWORD/.test(t)],
  ['/wp-config.old', 'urgente', 'cópia do config do WordPress com senha do banco', (t) => /DB_PASSWORD/.test(t)],
  ['/config.php.bak', 'urgente', 'cópia de config PHP', (t) => /<\?php|password|passwd|db_/i.test(t)],
  ['/backup.sql', 'urgente', 'cópia do banco de dados', (t) => /CREATE TABLE|INSERT INTO/i.test(t)],
  ['/dump.sql', 'urgente', 'cópia do banco de dados', (t) => /CREATE TABLE|INSERT INTO/i.test(t)],
  ['/database.sql', 'urgente', 'cópia do banco de dados', (t) => /CREATE TABLE|INSERT INTO/i.test(t)],
  ['/.npmrc', 'urgente', 'config do npm (pode ter token)', (t) => /_authToken|registry\s*=/.test(t)],
  ['/.vscode/sftp.json', 'urgente', 'config de envio por FTP/SFTP com senha', (t) => /"host"|"password"/i.test(t)],
  ['/.htpasswd', 'urgente', 'arquivo de senhas do servidor', (t) => /^[^:\s]+:\$?[\w./$]{10,}/m.test(t)],
  ['/docker-compose.yml', 'atencao', 'docker-compose (costuma ter senha e porta interna)', (t) => /services:/.test(t)],
  ['/netlify.toml', 'atencao', 'config do Netlify (rotas e funções)', (t) => /\[build\]|\[\[redirects\]\]|\[functions\]/.test(t)],
  ['/phpinfo.php', 'atencao', 'página phpinfo (mostra versão e caminhos internos)', (t) => /PHP Version/i.test(t)],
  ['/info.php', 'atencao', 'página phpinfo (mostra versão e caminhos internos)', (t) => /PHP Version/i.test(t)],
  ['/server-status', 'atencao', 'painel de status do Apache', (t) => /Apache Server Status/i.test(t)],
  ['/.DS_Store', 'atencao', 'índice de pasta do Mac (lista nomes de arquivo)', (t) => t.startsWith('\u0000\u0000\u0000\u0001Bud1')],
  ['/package.json', 'info', 'package.json (lista as bibliotecas e versões do site)', (t) => /^\s*\{/.test(t) && /"(?:name|scripts|dependencies|devDependencies)"\s*:/.test(t)],
];

// Lê no máximo 200 KB e larga o resto: um backup.sql de 500 MB público não trava a sonda nem enche a memória.
const LIMITE = 200000;
async function pega(url) {
  const ctl = AbortSignal.timeout(12000);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'manual', signal: ctl });
    const partes = [];
    let lidos = 0;
    if (r.body) {
      const leitor = r.body.getReader();
      while (lidos < LIMITE) { const { done, value } = await leitor.read(); if (done) break; partes.push(value); lidos += value.length; }
      await leitor.cancel().catch(() => {});
    }
    const buf = Buffer.concat(partes).subarray(0, LIMITE);
    const tam = Number(r.headers.get('content-length')) || lidos;
    return { status: r.status, tipo: r.headers.get('content-type') || '', tam, texto: buf.toString('latin1'), h: r.headers };
  } catch (e) { return { status: 0, erro: String(e.cause?.code || e.name || e).slice(0, 60) }; }
}
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const hostDe = (loc, base) => { try { return new URL(loc, base).hostname.toLowerCase(); } catch { return ''; } };
const resultado = [];
for (const dom of dominios) {
  let base = `https://${dom}`;
  const achados = [];
  let home = await pega(base + '/');
  if (home.status === 0) { resultado.push({ dominio: dom, erro: `não respondeu (${home.erro})`, achados }); continue; }
  // seusite.com.br → www.seusite.com.br (ou o contrário): a sonda segue esse salto, e só esse. Redirecionamento pra
  // outro domínio é avisado e não é seguido (a sonda só testa o que você passou).
  if ([301, 302, 307, 308].includes(home.status)) {
    const destino = hostDe(home.h.get('location') || '', base);
    const irmao = destino === `www.${dom}` || `www.${destino}` === dom;
    if (irmao) { base = `https://${destino}`; home = await pega(base + '/'); achados.push({ nivel: 'info', o: `${dom} redireciona pra ${destino}; a sonda conferiu ${destino}`, conserto: 'Nada a fazer. Se os dois endereços servem arquivos diferentes, rode a sonda nos dois.' }); }
    else if (destino && destino !== dom) achados.push({ nivel: 'atencao', o: `${dom} redireciona pra outro domínio (${destino}); os testes abaixo valem só pra ${dom}`, conserto: `Se ${destino} também é seu, rode a sonda nele.` });
  }
  // Linha de base: o que o site devolve pra um endereço que não existe (site de página única devolve 200 com o HTML).
  const nada = await pega(`${base}/kit-sonda-${Math.random().toString(36).slice(2, 10)}.txt`);
  // Só descarta por "parece a página de não encontrado" quando a própria página de não encontrado passaria no teste;
  // senão, um .git/HEAD de 21 bytes some junto com um 404 curto.
  const pareceNada = (r, teste) => r.status === nada.status && Math.abs(r.tam - nada.tam) < 64 && teste(nada.texto || '');
  const pw = home.h.get('x-powered-by') || '';
  const srv = home.h.get('server') || '';
  const php = (pw.match(/PHP\/(\d+\.\d+\.\d+)/i) || srv.match(/PHP\/(\d+\.\d+\.\d+)/i) || [])[1];
  if (php) {
    const ramo = php.split('.').slice(0, 2).join('.');
    const ok = PHP_MIN[ramo] && cmp(php, PHP_MIN[ramo]) >= 0;
    achados.push({ nivel: ok ? 'atencao' : 'urgente', o: `o site anuncia PHP ${php} no cabeçalho`, conserto: ok ? 'Versão já corrigida; mesmo assim esconda o número (expose_php = Off no php.ini).' : `PHP sem a correção do PHP2Shell: peça à hospedagem PHP ${PHP_MIN[ramo] || '8.2.35 ou mais novo'} hoje e esconda o número (expose_php = Off).` });
  } else if (/php/i.test(pw)) achados.push({ nivel: 'atencao', o: 'o site roda PHP (versão escondida)', conserto: 'Confirme com a hospedagem que o PHP é 8.2.35, 8.3.36, 8.4.27 ou 8.5.12 (ou mais novo).' });
  if (/wp-content|wp-includes|<meta name="generator" content="WordPress/i.test(home.texto || '')) achados.push({ nivel: 'atencao', o: 'o site é WordPress (roda em PHP)', conserto: 'Confirme com a hospedagem a versão do PHP (correção do PHP2Shell: 8.2.35, 8.3.36, 8.4.27, 8.5.12) e atualize WordPress e plugins.' });
  for (const [cam, nivel, oque, teste] of ALVOS) {
    await pausa(250);
    const r = await pega(base + cam);
    if (r.status !== 200 || pareceNada(r, teste)) continue;
    const html = /text\/html/i.test(r.tipo) || /^\s*<(!doctype|html)/i.test(r.texto);
    if (html && !cam.endsWith('.php') && cam !== '/server-status') continue;
    if (!teste(r.texto)) continue;
    achados.push({ nivel, o: `${cam} está público: ${oque} (${r.tam} bytes)`, conserto: nivel === 'urgente' ? 'Tire do ar agora (apague o arquivo da pasta publicada ou bloqueie no servidor) e troque toda chave ou senha que estava nele: skill vazou-e-agora.' : 'Tire da pasta publicada ou bloqueie no servidor.' });
  }
  resultado.push({ dominio: dom, servidor: srv || '(não informado)', achados });
}

if (args.includes('--json')) { console.log(JSON.stringify(resultado, null, 2)); process.exit(0); }
const ROT = { urgente: 'URGENTE', atencao: 'ATENÇÃO', info: 'INFO' };
console.log(`# Sonda de site (kit-seguranca-ia 1.0.0) · ${new Date().toLocaleString('pt-BR')}`);
console.log(`${ALVOS.length} endereços conferidos por domínio. O conteúdo das respostas não é mostrado.\n`);
for (const r of resultado) {
  console.log(`## ${r.dominio}`);
  if (r.erro) { console.log(`- ${r.erro}\n`); continue; }
  console.log(`- servidor: ${r.servidor}`);
  if (!r.achados.length) console.log('- [OK] nenhum arquivo sensível público nos endereços conferidos');
  for (const a of r.achados.sort((x, y) => ['urgente', 'atencao', 'info'].indexOf(x.nivel) - ['urgente', 'atencao', 'info'].indexOf(y.nivel))) console.log(`- [${ROT[a.nivel]}] ${a.o}\n  O que fazer: ${a.conserto}`);
  console.log('');
}
