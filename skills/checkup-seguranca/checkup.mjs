#!/usr/bin/env node
// checkup.mjs (kit-seguranca-ia 1.0.0, MIT)
// Checkup local de segurança pra quem usa Claude Code ou Codex: versões com falha conhecida, o pacote envenenado de
// 21/10/2026, arquivos de chave que um ladrão de credencial levaria, chave esquecida em histórico de conversa e de
// terminal, e as travas que já estão ligadas.
// Duas promessas, conferíveis no código: (1) nada sai desta máquina, o script não abre conexão de rede;
// (2) nenhum valor de chave aparece na saída, só o tipo, a contagem e o começo mascarado.
// Uso: node checkup.mjs [--pasta <dir>] [--sem-historico] [--tempo <segundos>] [--json] [--salvar <arquivo.md>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const VERSAO = '1.0.0';
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const HOME = os.homedir();
const RAIZ = path.resolve(opt('--pasta', HOME));
const TEMPO_TOTAL = Number(opt('--tempo', '90')) * 1000;
const SEM_HIST = args.includes('--sem-historico');
const WIN = process.platform === 'win32';
const inicio = Date.now();
const achados = [];
const add = (nivel, area, titulo, detalhe = '', conserto = '') => achados.push({ nivel, area, titulo, detalhe, conserto });

// ---------- utilidades ----------
// Programa e argumentos vão separados, sem shell: nome de pasta com aspas, & ou $(...) não vira comando.
// Roda a partir da pasta temporária (um npm.cmd plantado na pasta atual não é achado antes do PATH) e com o Corepack
// proibido de baixar gerenciador de pacote (a promessa é zero acesso de rede).
const AMBIENTE = { ...process.env, NoDefaultCurrentDirectoryInExePath: '1', COREPACK_ENABLE_NETWORK: '0', COREPACK_ENABLE_DOWNLOAD_PROMPT: '0', COREPACK_ENABLE_STRICT: '0' };
const BASE = { windowsHide: true, encoding: 'utf8', cwd: os.tmpdir(), env: AMBIENTE };
function run(bin, argv = [], { timeout = 15000, input } = {}) {
  try {
    const r = spawnSync(bin, argv, { ...BASE, shell: false, timeout, input, stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'] });
    return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim(), code: r.status };
  } catch { return { ok: false, out: '', err: '', code: -1 }; }
}
// npm, pnpm, uv e bun no Windows costumam ser .cmd, que só abre por shell. Aqui o texto do comando é fixo, escrito
// neste arquivo; nada que venha do disco entra nele.
function runFixo(cmd, timeout = 15000) {
  if (!WIN) { const [b, ...a] = cmd.split(' '); return run(b, a, { timeout }); }
  try {
    const r = spawnSync(cmd, { ...BASE, shell: true, timeout, stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim(), code: r.status };
  } catch { return { ok: false, out: '', err: '', code: -1 }; }
}
// "pnpm config get" responde "undefined" (com sucesso) quando a chave não existe.
const valorCfg = (s) => (/^(undefined|null)?$/.test((s || '').trim()) ? '' : s.trim());
const versao = (s) => ((s || '').match(/\d+\.\d+\.\d+/) || ['0.0.0'])[0];
// Duração escrita como "7 days", "1 week", "168h" → dias (uv). Data fixa ou formato desconhecido → null.
const diasDe = (t) => { const m = /^\s*(\d+(?:\.\d+)?)\s*(d|days?|w|weeks?|h|hours?)\s*$/i.exec(t || ''); if (!m) return null; const n = Number(m[1]); return /^w/i.test(m[2]) ? n * 7 : /^h/i.test(m[2]) ? n / 24 : n; };
const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
const existe = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const curto = (p) => (WIN ? p.toLowerCase().startsWith(HOME.toLowerCase()) : p.startsWith(HOME)) ? '~' + p.slice(HOME.length) : p;
const lerInicio = (p, n = 65536) => { try { const fd = fs.openSync(p, 'r'); const b = Buffer.alloc(n); const k = fs.readSync(fd, b, 0, n, 0); fs.closeSync(fd); return b.subarray(0, k).toString('utf8'); } catch { return ''; } };
const restante = () => TEMPO_TOTAL - (Date.now() - inicio);

// ---------- 1. Node.js (correção de 21/10/2026: 10 falhas, a pior executa código pelo descompactador Brotli) ----------
const NODE_MIN = { 22: '22.23.4', 24: '24.22.1', 26: '26.12.1' };
{
  const r = run('node', ['--version']);
  const v = (r.out.match(/v?(\d+\.\d+\.\d+)/) || [])[1] || process.versions.node;
  const maj = Number(v.split('.')[0]);
  if (NODE_MIN[maj]) {
    if (cmp(v, NODE_MIN[maj]) >= 0) add('ok', 'Node.js', `Node ${v} já tem a correção de 21/10/2026`);
    else add('urgente', 'Node.js', `Node ${v} está sem a correção de 21/10/2026`, 'A atualização de 21/10 fechou 10 falhas; a mais grave deixa um arquivo compactado executar código no seu computador.', `Instale o Node ${NODE_MIN[maj]} ou mais novo (nodejs.org). Antes, veja o que está rodando com Node (no Windows o instalador fecha esses programas à força). Depois, confira com \`node --version\`.`);
  } else {
    add('urgente', 'Node.js', `Node ${v} é de uma linha que não recebe mais correção`, 'Só as linhas 22, 24 e 26 recebem correção de segurança.', 'Instale o Node 22.23.4, 24.22.1 ou 26.12.1 (ou mais novo) e confira com `node --version`.');
  }
  // Aplicativo com Node ou Electron embutido não aparece no `node --version`, e processo aberto antes da atualização
  // segue com o binário velho na memória: os dois ficam de fora desta medida, então o relatório diz isso.
  add('info', 'Node.js', 'VS Code, Cursor, Claude Desktop, o app do Codex e parecidos trazem o próprio Node ou Electron e ficam fora desta conferência', 'A correção deles chega pela atualização do próprio aplicativo. Programa aberto antes de atualizar o Node continua na versão velha até reiniciar.', 'Abra cada aplicativo e aplique a atualização pendente; depois de atualizar o Node, reinicie servidores, MCPs e o próprio agente.');
}

// ---------- 2. Trava de idade dos pacotes (versão recém-publicada espera alguns dias antes de entrar) ----------
{
  const npm = runFixo('npm --version');
  if (npm.ok) {
    const v = npm.out.split(/\s/)[0];
    if (cmp(v, '11.10.0') >= 0) {
      const age = runFixo('npm config get min-release-age').out;
      if (/^\d+$/.test(age) && Number(age) >= 1) add('ok', 'Pacotes', `npm ${v} espera ${age} dia(s) antes de instalar versão nova`);
      else add('atencao', 'Pacotes', `npm ${v} instala versão publicada há minutos`, 'O LiteLLM envenenado ficou no ar cerca de 1h45 em 21/10. Quem instalou nessa janela levou o vírus.', 'Rode `npm config set min-release-age 7` (versão nova só entra depois de 7 dias).');
    } else add('atencao', 'Pacotes', `npm ${v} não tem trava de idade (ela chegou no npm 11.10)`, 'Sem a trava, qualquer `npm install` pega a versão publicada há minutos.', 'Rode `idade-pacote.mjs npm npm@11` (skill pacote-novo-com-calma), instale a versão que ele indicar (`npm install -g npm@<versão>`; no Windows ela vai pra pasta do usuário e o atalho do Node passa a usá-la, sem administrador) e depois `npm config set min-release-age 7`.');
  }
  const pnpm = runFixo('pnpm --version');
  if (pnpm.ok) {
    const v = pnpm.out.split(/\s/)[0];
    const age = valorCfg(runFixo('pnpm config get minimumReleaseAge').out) || valorCfg(runFixo('pnpm config get minimum-release-age').out);
    const conserto = 'Rode `pnpm config set --global minimum-release-age 10080` (minutos, 7 dias).';
    if (cmp(v, '10.16.0') < 0) add('atencao', 'Pacotes', `pnpm ${v} não tem trava de idade (ela chegou no pnpm 10.16)`, '', `Atualize o pnpm (\`pnpm self-update\`). ${conserto}`);
    else if (/^\d+$/.test(age) && Number(age) >= 1440) add('ok', 'Pacotes', `pnpm ${v} espera ${Math.round(Number(age) / 1440)} dia(s) antes de instalar versão nova`);
    else add('atencao', 'Pacotes', `pnpm ${v} sem trava de idade de pelo menos 1 dia`, age ? `minimum-release-age está em ${age} minuto(s).` : '', conserto);
  }
  const uv = runFixo('uv --version');
  if (uv.ok) {
    const v = versao(uv.out);
    const cfgs = WIN ? [path.join(process.env.APPDATA || '', 'uv', 'uv.toml')] : [path.join(process.env.XDG_CONFIG_HOME || path.join(HOME, '.config'), 'uv', 'uv.toml')];
    const valor = cfgs.map((c) => (lerInicio(c).match(/^\s*exclude-newer\s*=\s*["']([^"']+)["']/m) || [])[1]).find(Boolean);
    const dias = diasDe(valor);
    if (cmp(v, '0.9.17') < 0) add('atencao', 'Pacotes', `uv ${v} não entende espera em dias (ela chegou no uv 0.9.17)`, '', `Atualize o uv (\`uv self update\`) e ponha em ${curto(cfgs[0])} a linha \`exclude-newer = "7 days"\`.`);
    else if (dias !== null && dias >= 1) add('ok', 'Pacotes', `uv ${v} espera ${dias} dia(s) antes de instalar versão nova`);
    else if (valor && dias === null) add('info', 'Pacotes', `uv ${v} tem exclude-newer com data fixa (${valor})`, 'Data fixa congela tudo naquela data; nem correção de segurança entra.', 'Troque por `exclude-newer = "7 days"`.');
    else add('atencao', 'Pacotes', `uv ${v} instala versão publicada há minutos`, valor ? `exclude-newer está em "${valor}".` : '', `Ponha em ${curto(cfgs[0])} a linha \`exclude-newer = "7 days"\`.`);
  }
  const bun = runFixo('bun --version');
  if (bun.ok) {
    const v = versao(bun.out);
    const seg = Number(((lerInicio(path.join(HOME, '.bunfig.toml')).match(/^\s*minimumReleaseAge\s*=\s*([\d_]+)/m) || [])[1] || '0').replace(/_/g, ''));
    const conserto = 'No ~/.bunfig.toml: `[install]` e embaixo `minimumReleaseAge = 604800` (segundos, 7 dias).';
    if (cmp(v, '1.3.0') < 0) add('atencao', 'Pacotes', `bun ${v} não tem trava de idade (ela chegou no bun 1.3)`, '', `Atualize o bun (\`bun upgrade\`). ${conserto}`);
    else if (seg >= 86400) add('ok', 'Pacotes', `bun ${v} espera ${Math.round(seg / 86400)} dia(s) antes de instalar versão nova`);
    else add('atencao', 'Pacotes', `bun ${v} sem trava de idade de pelo menos 1 dia`, seg ? `minimumReleaseAge está em ${seg} segundos.` : '', conserto);
  }
}

// ---------- 3. Pythons instalados e seus site-packages (LiteLLM 1.107.0, arquivos do vírus, certifi) ----------
// O Python roda com -S -I e lê a sonda pela entrada padrão (nenhum arquivo temporário que outro usuário troque): não
// carrega site-packages, então cook.pth e sitecustomize.py não disparam por causa deste checkup. Limite honesto: numa
// máquina já comprometida, nada que rode nela prova que ela está limpa; este checkup procura as marcas conhecidas.
// Mesmo ambiente achado por dois caminhos (Python e varredura) entra uma vez só; no Windows, sem diferença de caixa.
const sitePackagesMapa = new Map();
const sitePackages = { add: (p) => { const n = path.normalize(p); const k = WIN ? n.toLowerCase() : n; if (!sitePackagesMapa.has(k)) sitePackagesMapa.set(k, n); }, [Symbol.iterator]: () => sitePackagesMapa.values() };
{
  const sonda = [
    'import sys, sysconfig, json, os',
    'p = set()',
    'for s in sysconfig.get_scheme_names():',
    '    for k in ("purelib", "platlib"):',
    '        try:',
    '            x = sysconfig.get_path(k, s)',
    '            if x and os.path.isdir(x): p.add(os.path.abspath(x))',
    '        except Exception: pass',
    'print(json.dumps({"v": sys.version.split()[0], "exe": sys.executable, "paths": sorted(p)}))',
  ].join('\n') + '\n';
  const exes = new Set(['python', 'python3']);
  if (WIN) { const r = run('py', ['-0p']); for (const l of r.out.split(/\r?\n/)) { const m = l.match(/([A-Za-z]:\\.*python(?:w)?\.exe)\s*$/i); if (m) exes.add(m[1]); } }
  const vistos = new Set();
  for (const exe of exes) {
    const r = run(exe, ['-S', '-I', '-'], { input: sonda });
    if (!r.ok) continue;
    try {
      const j = JSON.parse(r.out.split(/\r?\n/).pop());
      if (vistos.has(j.exe.toLowerCase())) continue;
      vistos.add(j.exe.toLowerCase());
      add('info', 'Python', `Python ${j.v} em ${curto(j.exe)}`);
      j.paths.forEach((p) => sitePackages.add(p));
    } catch { /* saída estranha: pula */ }
  }
}

// ---------- 4. Varredura de pastas: ambientes virtuais (site-packages) e arquivos .env ----------
const envs = [];
{
  // OneDrive e Dropbox entram: muita gente guarda projeto ali. Listar pasta não baixa arquivo da nuvem.
  // AppData e Library ficam de fora da descida (enormes), mas os lugares de ambiente Python e o iCloud dentro deles
  // entram como ponto de partida próprio.
  const PULA = new Set(['node_modules', '.git', 'AppData', 'Library', '.cache', '.npm', '.cargo', '.rustup', '.gradle', '.m2', 'Windows', 'Program Files', 'Program Files (x86)', '$Recycle.Bin', '.Trash', 'snap', 'Applications', '.vscode', '.cursor', '.nvm', 'go', '.docker']);
  const OCULTAS_OK = ['.venv', '.env', '.config', '.local', '.pyenv', '.conda', '.virtualenvs', '.direnv', '.tox', '.nox', '.hatch'];
  const LA = process.env.LOCALAPPDATA || path.join(HOME, 'AppData', 'Local');
  const extras = [
    path.join(HOME, 'Library', 'Mobile Documents', 'com~apple~CloudDocs'), path.join(HOME, 'Library', 'Caches', 'pypoetry', 'virtualenvs'),
    path.join(HOME, 'Library', 'Application Support', 'pipx', 'venvs'), path.join(HOME, '.local', 'share', 'uv'), path.join(HOME, '.local', 'share', 'pipx'),
    path.join(HOME, '.local', 'pipx', 'venvs'), path.join(LA, 'uv'), path.join(LA, 'pypoetry'), path.join(LA, 'pipx'),
  ].filter((p) => p !== RAIZ && existe(p));
  const limite = Date.now() + Math.min(30000, restante() / 3);
  const fila = [[RAIZ, 0], ...extras.map((p) => [p, 1])];
  let cortou = false;
  while (fila.length) {
    if (Date.now() > limite) { cortou = true; break; }
    const [dir, prof] = fila.shift();
    let itens;
    try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const it of itens) {
      const p = path.join(dir, it.name);
      if (it.isDirectory() && !it.isSymbolicLink()) {
        if (it.name === 'site-packages' || it.name === 'dist-packages') { sitePackages.add(p); continue; }
        if (PULA.has(it.name) || (it.name.startsWith('.') && prof > 0 && !OCULTAS_OK.includes(it.name))) continue;
        if (prof < 9) fila.push([p, prof + 1]);
      } else if (it.isFile() && /^\.env(\..+)?$/i.test(it.name) && !/\.(example|sample|template|dist|defaults?|schema|enc|age|gpg|asc|vault|yarn)$/i.test(it.name)) envs.push(p);
    }
  }
  if (cortou) add('info', 'Varredura', `Varredura de pastas parou no limite de tempo em ${curto(RAIZ)}`, 'O resto do checkup segue normal.', 'Pra varrer uma pasta de projetos específica: `node checkup.mjs --pasta <pasta>`.');
}
{
  let litellmVisto = false;
  const certifiVelhos = [];
  for (const sp of sitePackages) {
    let nomes;
    try { nomes = fs.readdirSync(sp); } catch { continue; }
    // Todas as entradas do LiteLLM na pasta (resto de versão antiga pode estar ao lado da nova): dist-info (pip
    // moderno), egg-info e .egg (instalação antiga), com ou sem versão no nome; vale a versão escrita no METADATA.
    const lites = nomes.filter((n) => /^litellm(?:-\d[^/\\]*)?\.(?:dist-info|egg-info|egg)$/i.test(n));
    for (const lite of lites) {
      litellmVisto = true;
      const meta = ['METADATA', 'PKG-INFO', path.join('EGG-INFO', 'PKG-INFO'), ''].map((f) => lerInicio(path.join(sp, lite, f), 4096)).find(Boolean) || '';
      const v = (meta.match(/^Version:\s*(\d+(?:\.\d+)*)/m) || [])[1] || (lite.match(/^litellm-(\d+(?:\.\d+)*)/i) || [])[1] || '?';
      // 1.107.0: ataque de 21/10/2026. 1.82.7 e 1.82.8: o mesmo pacote foi atacado assim em março de 2026.
      if (['1.107.0', '1.82.7', '1.82.8'].includes(v)) add('urgente', 'Pacote envenenado', `LiteLLM ${v} instalado em ${curto(sp)}`, v === '1.107.0' ? 'Essa é a versão que roubava senha do navegador, chave SSH, chave de nuvem e de IA, e baixava código novo a cada hora.' : 'Essa versão saiu com código malicioso no ataque de março de 2026 ao LiteLLM.', 'Siga a skill vazou-e-agora AGORA: troque todas as chaves deste computador, depois `pip install "litellm!=1.107.0,!=1.82.7,!=1.82.8"` ou recrie o ambiente do projeto. Ver docs.litellm.ai/blog/security-incident-oct-21-2026.');
      else add('ok', 'Pacote envenenado', `LiteLLM ${v} em ${curto(sp)} (versão fora do ataque de 21/10)`);
    }
    for (const f of ['cook.pth', 'cook.py']) if (nomes.includes(f)) add('urgente', 'Pacote envenenado', `Arquivo do vírus do LiteLLM (${f}) em ${curto(sp)}`, 'Esse arquivo roda sozinho toda vez que o Python abre.', 'Assuma que as chaves desta máquina foram levadas: skill vazou-e-agora. Depois apague o ambiente inteiro e recrie.');
    if (nomes.includes('sitecustomize.py') && /cook|privcollect|remote_code_loader|pythonclient-test/.test(lerInicio(path.join(sp, 'sitecustomize.py')))) add('urgente', 'Pacote envenenado', `sitecustomize.py com assinatura do vírus em ${curto(sp)}`, '', 'Skill vazou-e-agora, depois recriar o ambiente.');
    const cert = nomes.find((n) => /^certifi-[\d.]+\.dist-info$/i.test(n));
    if (cert && !/[\\/]pkgs[\\/]/.test(sp)) { const v = cert.replace(/^certifi-/i, '').replace(/\.dist-info$/i, ''); if (cmp(v, '2026.10.19') < 0) certifiVelhos.push(`${v} em ${curto(sp)}`); }
  }
  if (!litellmVisto) add('ok', 'Pacote envenenado', 'LiteLLM não encontrado nos Pythons e ambientes varridos');
  if (certifiVelhos.length) add('atencao', 'Certificados', `certifi antigo em ${certifiVelhos.length} lugar(es)`, `certifi anterior à 2026.10.19 ainda confia nos 8 certificados intermediários revogados da eMudhra. ${certifiVelhos.slice(0, 3).join('; ')}${certifiVelhos.length > 3 ? '…' : ''}`, 'Em cada ambiente: `pip install -U certifi` (ou `uv pip install -U certifi`).');
}

// ---------- 5. Marcas que o vírus deixa na pasta temporária ----------
{
  const temps = [...new Set([os.tmpdir(), '/tmp', '/var/tmp'].filter(existe))];
  for (const t of temps) {
    let nomes = [];
    try { nomes = fs.readdirSync(t); } catch {}
    if (nomes.includes('.pc_once_72129118c59f5636c0bb')) add('urgente', 'Pacote envenenado', `Marca de roubo concluído em ${t}`, 'O ladrão do LiteLLM grava esse arquivo depois de mandar os dados embora.', 'Trate todas as chaves e senhas deste computador como roubadas: skill vazou-e-agora, na ordem dela.');
    if (nomes.includes('remote_code_loader.lock')) add('urgente', 'Pacote envenenado', `Carregador remoto do vírus em ${t}`, 'Esse arquivo indica o pedaço que busca código novo a cada hora.', 'Desligue a máquina da rede, troque as chaves de outro aparelho (skill vazou-e-agora) e reinstale o ambiente Python.');
    const pastas = nomes.filter((n) => /^\.pc_(sq|e)_/.test(n));
    if (pastas.length) add('urgente', 'Pacote envenenado', `Pastas temporárias do vírus em ${t} (${pastas.length})`, '', 'Skill vazou-e-agora.');
  }
}

// ---------- 6. Docker ----------
{
  const r = run('docker', ['images', '--format', '{{.Repository}}:{{.Tag}}|{{.CreatedAt}}'], { timeout: 20000 });
  if (r.ok) {
    const lite = r.out.split(/\r?\n/).filter((l) => /litellm/i.test(l));
    for (const l of lite) {
      const [img, quando] = l.split('|');
      // Qualquer imagem do LiteLLM criada em 21/10, inclusive a que perdeu a tag (<none>) depois de outra baixar por cima.
      if (/:v?1\.107\.0\b/.test(img)) add('urgente', 'Pacote envenenado', `Imagem Docker do LiteLLM 1.107.0: ${img}`, 'As imagens do LiteLLM 1.107.0 vieram com o vírus.', 'Pare os containers dessa imagem, apague a imagem, troque as chaves que ela usava (skill vazou-e-agora).');
      else if (/^2026-10-21/.test(quando || '')) add('atencao', 'Pacote envenenado', `Imagem Docker do LiteLLM criada em 21/10, dia do ataque: ${img}`, 'Nesse dia as tags latest, main-latest e main-stable apontaram por algumas horas pra versão com vírus.', 'Não rode essa imagem pra conferir. Apague (`docker rmi <imagem>`) e baixe de novo por uma versão fixa e conferida; se algum container dela rodou com chave, siga a skill vazou-e-agora.');
      else add('info', 'Docker', `Imagem do LiteLLM: ${img} (fora da janela do ataque)`);
    }
  }
}

// ---------- 7. PHP local (PHP2Shell: correção em 21/10/2026) ----------
{
  const PHP_MIN = { '8.5': '8.5.12', '8.4': '8.4.27', '8.3': '8.3.36', '8.2': '8.2.35' };
  const r = run('php', ['-v']);
  const v = (r.out.match(/PHP (\d+\.\d+\.\d+)/) || [])[1];
  if (v) {
    const ramo = v.split('.').slice(0, 2).join('.');
    if (PHP_MIN[ramo] && cmp(v, PHP_MIN[ramo]) >= 0) add('ok', 'PHP', `PHP ${v} já tem a correção do PHP2Shell`);
    else if (PHP_MIN[ramo]) add('urgente', 'PHP', `PHP ${v} sem a correção do PHP2Shell`, 'Um pedido web montado sob medida executa código no servidor, sem login.', `Atualize pra ${PHP_MIN[ramo]} ou mais novo e reinicie o PHP-FPM ou o servidor web.`);
    else add('urgente', 'PHP', `PHP ${v} é de um ramo sem correção completa`, '', 'Suba pra 8.2.35, 8.3.36, 8.4.27 ou 8.5.12 (ou mais novo).');
  }
}

// ---------- 8. Arquivos com chave que um ladrão de credencial levaria (só presença; nada é impresso) ----------
const emRisco = [];
{
  const P = (...x) => path.join(HOME, ...x);
  const lista = [
    ['Claude Code (login)', P('.claude', '.credentials.json')], ['Codex (login)', P('.codex', 'auth.json')],
    ['OpenCode (chaves)', P('.local', 'share', 'opencode', 'auth.json')], ['OpenCode (chaves)', path.join(process.env.XDG_DATA_HOME || '', 'opencode', 'auth.json')],
    ['OpenCode (chaves)', path.join(process.env.LOCALAPPDATA || '', 'opencode', 'auth.json')], ['GitHub CLI (token)', P('.config', 'gh', 'hosts.yml')],
    ['GitHub CLI (token)', path.join(process.env.APPDATA || '', 'GitHub CLI', 'hosts.yml')], ['PyPI (token)', P('.pypirc')],
    ['AWS', P('.aws', 'credentials')], ['Google Cloud', P('.config', 'gcloud', 'application_default_credentials.json')],
    ['Google Cloud', path.join(process.env.APPDATA || '', 'gcloud', 'application_default_credentials.json')],
    ['Azure', P('.azure', 'msal_token_cache.json')], ['Docker (registros)', P('.docker', 'config.json')],
    ['Kubernetes', P('.kube', 'config')], ['Gemini CLI', P('.gemini', 'oauth_creds.json')], ['Continue', P('.continue', 'config.json')],
    ['Cursor (MCP)', P('.cursor', 'mcp.json')], ['Aider', P('.aider.conf.yml')],
  ];
  for (const [rot, p] of lista) if (p && path.isAbsolute(p) && existe(p) && !emRisco.some((x) => x[1] === p)) emRisco.push([rot, p]);
  const npmrc = P('.npmrc');
  if (existe(npmrc)) { emRisco.push(['npm', npmrc]); if (/_authToken\s*=/.test(lerInicio(npmrc))) add('atencao', 'Chaves em arquivo', 'Token do npm em texto no ~/.npmrc', 'Foi um dos arquivos que o vírus do LiteLLM levava.', 'Use token de curta duração ou o login pelo navegador (`npm login --auth-type=web`) e apague a linha _authToken.'); }
  const cj = P('.claude.json');
  if (existe(cj)) {
    try {
      const j = JSON.parse(fs.readFileSync(cj, 'utf8'));
      const servidores = [j.mcpServers, ...Object.values(j.projects || {}).map((x) => x && x.mcpServers)].filter(Boolean);
      let comChave = 0;
      for (const s of servidores) for (const cfg of Object.values(s)) {
        const env = cfg && cfg.env ? Object.entries(cfg.env) : [];
        const hdr = cfg && cfg.headers ? Object.entries(cfg.headers) : [];
        if ([...env, ...hdr].some(([k, v]) => typeof v === 'string' && v.length >= 20 && !/^\$\{/.test(v) && /(key|token|secret|auth|pass)/i.test(k))) comChave++;
      }
      if (comChave) add('atencao', 'Chaves em arquivo', `${comChave} servidor(es) MCP com chave escrita direto no ~/.claude.json`, 'Quem lê esse arquivo leva as chaves junto.', 'Troque o valor por variável de ambiente (`"${NOME}"`) e guarde a chave num cofre (skill segredo-fora-do-chat).');
    } catch {}
  }
  const ssh = P('.ssh');
  if (existe(ssh)) {
    let semSenha = 0, total = 0;
    for (const n of fs.readdirSync(ssh)) {
      if (!/^id_/.test(n) || n.endsWith('.pub')) continue;
      const t = lerInicio(path.join(ssh, n), 4096);
      if (!/PRIVATE KEY/.test(t)) continue;
      total++;
      if (/BEGIN OPENSSH PRIVATE KEY/.test(t)) {
        const b64 = t.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
        const bin = Buffer.from(b64.slice(0, 200), 'base64');
        const off = 'openssh-key-v1\0'.length;
        try { const len = bin.readUInt32BE(off); if (bin.subarray(off + 4, off + 4 + len).toString() === 'none') semSenha++; } catch { /* formato inesperado: não conta */ }
      } else if (!/ENCRYPTED/.test(t)) semSenha++;
    }
    if (total) { emRisco.push(['Chaves SSH', ssh]); if (semSenha) add('atencao', 'Chaves em arquivo', `${semSenha} de ${total} chave(s) SSH sem senha`, 'Chave SSH sem senha funciona na mão de quem copiar o arquivo.', 'Ponha senha: `ssh-keygen -p -f ~/.ssh/<arquivo>`.'); }
  }
  if (emRisco.length) add('info', 'Chaves em arquivo', `${emRisco.length} arquivo(s) com credencial nesta máquina (o que um ladrão de credencial levaria)`, emRisco.map(([r, p]) => `${r}: ${curto(p)}`).join('; '), 'Nada a fazer se a máquina está limpa. Se algum item URGENTE apareceu acima, cada um desses vira uma chave pra trocar.');
}

// ---------- 9. Arquivos .env: versionados no git? ----------
{
  const raizGit = (p) => { let d = path.dirname(p); for (let i = 0; i < 12; i++) { if (existe(path.join(d, '.git'))) return d; const up = path.dirname(d); if (up === d) break; d = up; } return null; };
  let versionados = 0, foraIgnore = 0, semResposta = 0, conferidos = 0;
  const exemplos = [];
  const MAX_ENVS = 200;
  for (const e of envs.slice(0, MAX_ENVS)) {
    const g = raizGit(e);
    if (!g) continue;
    conferidos++;
    const rel = path.relative(g, e).split(path.sep).join('/');
    // core.fsmonitor desligado: a config de um repositório baixado da internet não roda programa nenhum aqui.
    const git = (...a) => run('git', ['-c', 'core.fsmonitor=false', '-C', g, ...a]);
    // ls-files: 0 = versionado, 1 = não está no git; check-ignore: 0 = ignorado, 1 = não ignorado. Outro código
    // (git ausente, repositório de outro usuário) é "não deu pra conferir", nunca "fora do .gitignore".
    const ls = git('ls-files', '--error-unmatch', '--', rel);
    if (ls.code === 0) { versionados++; exemplos.push(curto(e)); continue; }
    if (ls.code !== 1) { semResposta++; continue; }
    const ci = git('check-ignore', '-q', '--', rel);
    if (ci.code === 1) foraIgnore++;
    else if (ci.code !== 0) semResposta++;
  }
  if (versionados) add('urgente', 'Chaves em arquivo', `${versionados} arquivo(s) .env dentro do git (versionados)`, `Se esse repositório já subiu pro GitHub, as chaves estão no histórico dele. ${exemplos.slice(0, 3).join('; ')}`, 'Troque as chaves desses arquivos (skill vazou-e-agora), depois `git rm --cached <arquivo>` e ponha `.env`, `.env.*` e `!.env.example` no .gitignore. Apagar o arquivo não apaga o histórico; trocar a chave resolve.');
  if (foraIgnore) add('atencao', 'Chaves em arquivo', `${foraIgnore} arquivo(s) .env em repositório git sem estar no .gitignore`, 'Um `git add .` distraído manda a chave pro repositório.', 'Adicione `.env`, `.env.*` e `!.env.example` no .gitignore desses repositórios.');
  if (semResposta) add('info', 'Chaves em arquivo', `${semResposta} arquivo(s) .env em repositório que o git não deixou conferir`, 'Pode ser git ausente ou repositório de outro usuário do computador.', 'Confira à mão nesses repositórios com `git ls-files .env`.');
  if (envs.length > MAX_ENVS) add('info', 'Chaves em arquivo', `Conferi no git os primeiros ${MAX_ENVS} de ${envs.length} arquivos .env`, '', 'Pra conferir o resto, rode o checkup numa pasta de projetos: `--pasta <pasta>`.');
  if (envs.length && !versionados && !foraIgnore && !semResposta) add('ok', 'Chaves em arquivo', `${envs.length} arquivo(s) .env encontrados${conferidos < envs.length ? ` (${conferidos} dentro de git)` : ''}, nenhum versionado no git`);
}

// ---------- 10. Chave esquecida em histórico de conversa (Claude Code, Codex) e de terminal ----------
const PADROES = [
  ['Anthropic', /sk-ant-(?:api03|admin01)-[A-Za-z0-9_-]{80,}/g], ['OpenAI', /sk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]{40,}/g],
  ['OpenAI (formato antigo)', /\bsk-[A-Za-z0-9]{48}\b/g], ['OpenRouter', /sk-or-v1-[0-9a-f]{64}/g], ['Google (Gemini, Cloud)', /AIza[0-9A-Za-z_-]{35}/g],
  ['GitHub', /\b(?:ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{70,}/g], ['AWS', /\bAKIA[0-9A-Z]{16}\b/g],
  ['Slack', /\bxox[abprs]-[A-Za-z0-9-]{20,}/g], ['Stripe', /\b[sr]k_live_[0-9A-Za-z]{20,}/g], ['Groq', /\bgsk_[A-Za-z0-9]{50,}/g],
  ['Hugging Face', /\bhf_[A-Za-z0-9]{34,}/g], ['npm', /\bnpm_[A-Za-z0-9]{36}\b/g],
];
const ehFalso = (v) => /(.)\1{7,}/.test(v) || /(?:x{6,}|0{8,}|abcdef|example|placeholder|your[_-]?key|fake|dummy|sample)/i.test(v);
// Mostra o prefixo fixo do formato e só 4 caracteres do miolo: dá pra reconhecer a chave sem entregá-la.
const PREFIXO = /^(sk-ant-(?:api03|admin01)-|sk-(?:proj|svcacct|admin)-|sk-or-v1-|AIza|gh[pousr]_|github_pat_|AKIA|xox[abprs]-|[sr]k_live_|gsk_|hf_|npm_|sk-)/;
const mascara = (v) => { const p = (v.match(PREFIXO) || [''])[0]; return `${v.slice(0, p.length + 4)}… (${v.length} caracteres)`; };
async function varreHistorico() {
  const alvos = [];
  const anda = (d, filtro, prof = 0) => { if (prof > 6) return; let it; try { it = fs.readdirSync(d, { withFileTypes: true }); } catch { return; } for (const x of it) { const p = path.join(d, x.name); if (x.isDirectory()) anda(p, filtro, prof + 1); else if (filtro.test(x.name)) alvos.push(p); } };
  anda(path.join(HOME, '.claude', 'projects'), /\.jsonl$/);
  anda(path.join(HOME, '.codex', 'sessions'), /\.jsonl$/);
  for (const f of [path.join(HOME, '.codex', 'history.jsonl'), path.join(HOME, '.bash_history'), path.join(HOME, '.zsh_history'), path.join(HOME, '.python_history'), path.join(HOME, '.local', 'share', 'fish', 'fish_history'), path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'PowerShell', 'PSReadLine', 'ConsoleHost_history.txt')]) if (existe(f)) alvos.push(f);
  alvos.sort((a, b) => { try { return fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs; } catch { return 0; } });
  const porTipo = new Map();
  let lidos = 0, bytes = 0, chavePrivada = 0;
  const prazo = Date.now() + Math.max(5000, restante() - 3000);
  for (const f of alvos) {
    if (Date.now() > prazo) break;
    let resto = '';
    try {
      for await (const pedaco of fs.createReadStream(f, { encoding: 'utf8', highWaterMark: 1 << 20 })) {
        const t = resto + pedaco;
        for (const [tipo, re] of PADROES) {
          re.lastIndex = 0;
          for (const m of t.matchAll(re)) {
            const v = m[0];
            if (ehFalso(v) || (tipo === 'OpenAI (formato antigo)' && /^sk-ant/.test(v))) continue;
            if (!porTipo.has(tipo)) porTipo.set(tipo, { valores: new Set(), arquivos: new Set() });
            const o = porTipo.get(tipo); o.valores.add(v); o.arquivos.add(f);
          }
        }
        chavePrivada += (t.match(/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[A-Za-z0-9+/=\s\\n]{40}/g) || []).length;
        resto = t.slice(-300);
        bytes += pedaco.length;
        if (Date.now() > prazo) break;
      }
      lidos++;
    } catch { /* arquivo preso ou sumiu: pula */ }
  }
  const parcial = lidos < alvos.length;
  if (!alvos.length) { add('info', 'Histórico', 'Nenhum histórico de conversa do Claude Code ou do Codex encontrado'); return; }
  const mb = (bytes / 1048576).toFixed(0);
  if (!porTipo.size && !chavePrivada) add('ok', 'Histórico', `Nenhuma chave em texto em ${lidos} arquivo(s) de histórico (${mb} MB)${parcial ? `; parcial: ${alvos.length - lidos} arquivo(s) mais antigos ficaram fora pelo limite de tempo` : ''}`);
  for (const [tipo, o] of porTipo) {
    const mascarados = [...o.valores].slice(0, 3).map(mascara);
    add('atencao', 'Histórico', `${o.valores.size} chave(s) ${tipo} em texto no histórico (${o.arquivos.size} arquivo(s))`, `Começo mascarado: ${mascarados.join('; ')}. Exemplos de arquivo: ${[...o.arquivos].slice(0, 2).map(curto).join('; ')}.`, 'Se alguma dessas chaves ainda está em uso, troque (skill vazou-e-agora). Histórico guardado no disco é exatamente o que um ladrão de credencial copia.');
  }
  if (chavePrivada) add('atencao', 'Histórico', `${chavePrivada} chave(s) privada(s) inteira(s) aparecem no histórico`, '', 'Gere chave nova e troque onde ela é usada.');
  if (parcial && (porTipo.size || chavePrivada)) add('info', 'Histórico', `Leitura parcial: ${lidos} de ${alvos.length} arquivos (${mb} MB) dentro do limite de tempo`, '', 'Pra ler tudo: `node checkup.mjs --tempo 600`.');
}
if (!SEM_HIST) await varreHistorico();

// ---------- 11. Travas já ligadas ----------
{
  const s = lerInicio(path.join(HOME, '.claude', 'settings.json'), 1 << 20);
  const ch = lerInicio(path.join(HOME, '.codex', 'hooks.json'), 1 << 20);
  if (/tripwires/.test(s) || /tripwires/.test(ch)) add('ok', 'Travas', 'tripwires ligado (barra leitura de arquivo de chave antes de acontecer)');
  else if (/PreToolUse/.test(s)) add('info', 'Travas', 'Há hook PreToolUse no Claude Code; confira se algum barra a leitura de .env e arquivos de chave');
  else add('atencao', 'Travas', 'Nenhuma trava automática antes das ferramentas do agente', 'O agente pode esquecer uma regra escrita no CLAUDE.md; um hook roda antes de cada comando e pode dizer não.', 'Veja o passo opcional do INSTALAR.md (tripwires, código aberto).');
  const md = lerInicio(path.join(HOME, '.claude', 'CLAUDE.md'), 1 << 20) + lerInicio(path.join(HOME, '.codex', 'AGENTS.md'), 1 << 20);
  if (/kit-seguranca-ia/.test(md)) add('ok', 'Travas', 'Regras do kit presentes no CLAUDE.md ou AGENTS.md');
  else add('atencao', 'Travas', 'Regras de segurança do kit ainda não estão no CLAUDE.md nem no AGENTS.md', '', 'Siga o passo 3 do INSTALAR.md.');
}

// ---------- relatório ----------
const ORDEM = { urgente: 0, atencao: 1, ok: 2, info: 3 };
const ROT = { urgente: 'URGENTE', atencao: 'ATENÇÃO', ok: 'OK', info: 'INFO' };
achados.sort((a, b) => ORDEM[a.nivel] - ORDEM[b.nivel]);
const conta = (n) => achados.filter((a) => a.nivel === n).length;
const quando = new Date().toLocaleString('pt-BR');
if (args.includes('--json')) {
  console.log(JSON.stringify({ kit: 'kit-seguranca-ia', versao: VERSAO, quando, maquina: `${process.platform} ${process.arch}`, segundos: (Date.now() - inicio) / 1000, achados }, null, 2));
} else {
  const L = [];
  L.push(`# Checkup de segurança (kit-seguranca-ia ${VERSAO})`, '');
  L.push(`${quando} · ${process.platform} ${process.arch} · ${((Date.now() - inicio) / 1000).toFixed(1)} s · pasta varrida: ${curto(RAIZ)}`);
  L.push('Nada saiu desta máquina. Nenhum valor de chave aparece neste relatório.', '');
  L.push(`Resumo: ${conta('urgente')} URGENTE · ${conta('atencao')} ATENÇÃO · ${conta('ok')} OK`, '');
  for (const a of achados) {
    L.push(`- [${ROT[a.nivel]}] ${a.area}: ${a.titulo}`);
    if (a.detalhe) L.push(`  ${a.detalhe}`);
    if (a.conserto) L.push(`  O que fazer: ${a.conserto}`);
  }
  const texto = L.join('\n');
  console.log(texto);
  // Só grava .md, e só sobrescreve relatório anterior do próprio checkup (nunca outro arquivo).
  const salvar = opt('--salvar', null);
  if (salvar) {
    const alvo = path.resolve(salvar);
    if (!/\.md$/i.test(alvo)) console.log('\n(--salvar só aceita arquivo .md; relatório não salvo)');
    else if (existe(alvo) && !lerInicio(alvo, 64).startsWith('# Checkup de segurança')) console.log(`\n(${alvo} já existe e não é um relatório do checkup; relatório não salvo)`);
    else { fs.writeFileSync(alvo, texto + '\n'); console.log(`\n(relatório salvo em ${alvo})`); }
  }
}
