#!/usr/bin/env node
// Teste do checkup numa casa falsa (pasta temporária no lugar da sua pasta de usuário): planta o pacote envenenado,
// os arquivos e a marca do vírus, um .env versionado no git e chaves geradas na hora num histórico falso, e confere
// que o checkup acusa cada um sem imprimir nenhuma chave. Uso: node teste/teste-checkup.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CHECKUP = path.join(AQUI, '..', 'skills', 'checkup-seguranca', 'checkup.mjs');
const SONDA = path.join(AQUI, '..', 'skills', 'sonda-do-site', 'sonda-site.mjs');
const MASCARA = path.join(AQUI, '..', 'skills', 'segredo-fora-do-chat', 'mascara.mjs');
const WIN = process.platform === 'win32';
const casa = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-casa-'));
const tmp = path.join(casa, 'tmp');
const alfa = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const aleatorio = (n) => Array.from(crypto.randomBytes(n), (b) => alfa[b % alfa.length]).join('');
const mk = (p, t = '') => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t); };

// 1. ambiente virtual com o LiteLLM envenenado e os arquivos do vírus
const sp = path.join(casa, 'projetos', 'bot', '.venv', 'Lib', 'site-packages');
mk(path.join(sp, 'litellm-1.107.0.dist-info', 'METADATA'), 'Name: litellm\nVersion: 1.107.0\n');
mk(path.join(sp, 'cook.pth'), 'import cook\n');
mk(path.join(sp, 'cook.py'), '# payload de teste\n');
mk(path.join(sp, 'certifi-2025.1.31.dist-info', 'METADATA'), 'Name: certifi\n');
// 2. marca de roubo concluído na pasta temporária
mk(path.join(tmp, '.pc_once_72129118c59f5636c0bb'), '');
// 3. repositório git com .env versionado
const repo = path.join(casa, 'projetos', 'site');
mk(path.join(repo, '.env'), `CHAVE=${aleatorio(30)}\n`);
spawnSync('git', ['init', '-q', repo], { windowsHide: true });
spawnSync('git', ['-C', repo, 'add', '.env'], { windowsHide: true });
spawnSync('git', ['-C', repo, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'teste'], { windowsHide: true });
// 4. histórico falso de conversa com chaves geradas agora (nunca escritas neste arquivo)
// Prefixo montado em pedaços: este teste não chama API nenhuma, e travas de gasto que leem o arquivo não confundem.
const chaveA = `${['sk', 'ant', 'api03'].join('-')}-${aleatorio(95)}`;
const chaveG = `AIza${aleatorio(35)}`;
mk(path.join(casa, '.claude', 'projects', 'x', 'sessao.jsonl'), JSON.stringify({ tool_result: `CHAVE_CLAUDE=${chaveA}\nGEMINI=${chaveG}` }) + '\n');
// 5. instalação antiga (egg-info) do LiteLLM envenenado noutro ambiente
mk(path.join(casa, 'projetos', 'velho', 'venv', 'lib', 'python3.11', 'site-packages', 'litellm-1.107.0-py3.11.egg-info', 'PKG-INFO'), 'Name: litellm\nVersion: 1.107.0\n');
// 6. pasta com nome que vira comando se alguém passar o caminho por um shell; tem .git e .env pra cair no passo do git
const isca = path.join(casa, 'projetos', WIN ? 'p&mkdir PWNED&q' : 'p$(mkdir PWNED)q');
mk(path.join(isca, '.env'), 'X=1\n');
spawnSync('git', ['init', '-q', isca], { windowsHide: true });
// 7. trava do bun "ligada" com zero, que não espera nada
mk(path.join(casa, '.bunfig.toml'), '[install]\nminimumReleaseAge = 0\n');

const env = { ...process.env, HOME: casa, USERPROFILE: casa, TEMP: tmp, TMP: tmp, TMPDIR: tmp, APPDATA: path.join(casa, 'AppData', 'Roaming') };
const r = spawnSync(process.execPath, [CHECKUP, '--tempo', '40'], { env, cwd: casa, encoding: 'utf8', windowsHide: true, timeout: 120000 });
const saida = (r.stdout || '') + (r.stderr || '');
const temBun = spawnSync('bun --version', { shell: true, windowsHide: true }).status === 0; // texto fixo; bun no Windows costuma ser .cmd
const pwned = () => { const achou = []; const anda = (d) => { for (const x of fs.readdirSync(d, { withFileTypes: true })) { if (x.name === 'PWNED') achou.push(d); else if (x.isDirectory() && x.name !== '.git') anda(path.join(d, x.name)); } }; anda(casa); return achou.length === 0 && !fs.existsSync(path.join(AQUI, 'PWNED')) && !fs.existsSync(path.join(process.cwd(), 'PWNED')); };
// sonda: domínio com @ desviaria os pedidos pra outro host; tem que recusar antes de qualquer rede
const sondaRuim = spawnSync(process.execPath, [SONDA, 'vitima.com.br@127.0.0.1'], { encoding: 'utf8', windowsHide: true, timeout: 15000 });
// mascara: valor curto logo depois de --api-key, e PIN numérico em campo sensível
const tokCurto = `t${aleatorio(9)}`;
const pin = String(100000 + (crypto.randomBytes(2).readUInt16BE() % 800000));
const cfg = path.join(casa, 'cfg.json');
fs.writeFileSync(cfg, JSON.stringify({ mcpServers: { x: { command: 'npx', args: ['srv@1.2.3', '--api-key', tokCurto] } }, pin }));
const masc = spawnSync(process.execPath, [MASCARA, cfg], { encoding: 'utf8', windowsHide: true });
const casos = [
  ['acusa LiteLLM 1.107.0', /\[URGENTE\] Pacote envenenado: LiteLLM 1\.107\.0 instalado/],
  ['acusa LiteLLM 1.107.0 em egg-info', (s) => (s.match(/\[URGENTE\] Pacote envenenado: LiteLLM 1\.107\.0 instalado/g) || []).length >= 2],
  ['nome de pasta não vira comando', () => pwned()],
  ...(temBun ? [['bun com minimumReleaseAge = 0 não passa como OK', /\[ATENÇÃO\] Pacotes: bun .* sem trava de idade/]] : []),
  ['sonda recusa domínio com @', () => sondaRuim.status === 2 && /domínio inválido/.test(sondaRuim.stderr)],
  ['mascara esconde valor depois de --api-key', () => masc.status === 0 && !masc.stdout.includes(tokCurto)],
  ['mascara esconde PIN em campo sensível', () => masc.status === 0 && !masc.stdout.includes(pin)],
  ['acusa cook.pth', /\[URGENTE\].*cook\.pth/],
  ['acusa marca de roubo', /\[URGENTE\].*Marca de roubo concluído/],
  ['acusa .env versionado', /\[URGENTE\].*\.env dentro do git/],
  ['acusa chave Anthropic no histórico', /chave\(s\) Anthropic em texto no histórico/],
  ['acusa chave Google no histórico', /chave\(s\) Google .* em texto no histórico/],
  ['acusa certifi velho', /certifi antigo/],
  ['NÃO imprime a chave Anthropic', (s) => !s.includes(chaveA) && !s.includes(chaveA.slice(0, 30))],
  ['NÃO imprime a chave Google', (s) => !s.includes(chaveG) && !s.includes(chaveG.slice(0, 15))],
];
let falhas = 0;
for (const [nome, t] of casos) {
  const ok = typeof t === 'function' ? t(saida) : t.test(saida);
  console.log(`${ok ? 'passou' : 'FALHOU'}  ${nome}`);
  if (!ok) falhas++;
}
if (falhas) console.log('\n--- saída do checkup ---\n' + saida);
fs.rmSync(casa, { recursive: true, force: true });
console.log(`\n${casos.length - falhas}/${casos.length} casos`);
process.exit(falhas ? 1 : 0);
