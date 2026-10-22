#!/usr/bin/env node
// mascara.mjs (kit-seguranca-ia 1.0.0, MIT)
// Mostra a ESTRUTURA de um arquivo com segredo (.env, settings.json, auth.json, config.toml, docker-compose.yml)
// sem mostrar os valores. O agente descobre quais chaves existem, se estão vazias e de que tipo são, e o valor nunca
// entra na conversa. Regra: tudo é mascarado, menos o que é estrutura com certeza (booleano, número curto em campo
// comum, caminho em campo comum, palavra de uma lista fechada como production ou localhost).
// Uso: node mascara.mjs <arquivo> [--max 400]
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--max');
if (!file) { console.error('uso: node mascara.mjs <arquivo> [--max N]'); process.exit(2); }
const MAX = args.includes('--max') ? Number(args[args.indexOf('--max') + 1]) || 400 : 400;
// Nome de campo que indica segredo (em inglês e português). Na dúvida, mascara: errar pra mais é barato.
const SENSIVEL = /(token|secret|segredo|key|chave|senha|pass|pwd|phrase|frase|auth|salt|pin|cookie|session|private|cred|url|uri|webhook|dsn|conn|email|phone|tel|account|conta|user|usuario|otp|mfa|2fa|bearer|jwt|sig|cert|hash|code|codigo)/i;
// Valores que são estrutura e aparecem inteiros mesmo assim.
const LIVRES = new Set(['development', 'production', 'staging', 'test', 'testing', 'dev', 'prod', 'local', 'localhost', 'debug', 'info', 'warn', 'warning', 'error', 'none', 'auto', 'enabled', 'disabled', 'on', 'off', 'yes', 'no', 'utf-8', 'utf8', 'json', 'text', 'stdio', 'http', 'https', 'sse', 'npx', 'node', 'python', 'uvx', 'docker', 'bash', 'sh']);
const ehCaminho = (s) => /^(?:[A-Za-z]:[\\/]|~[\\/]|\/(?!\/)|\.{1,2}[\\/])[^\s?#=@:]*$/.test(s);
const ehUrl = (s) => /^[a-z][a-z0-9+.-]*:\/\//i.test(s);
// Trecho com cara de segredo: sequência longa misturando letra e número, flag=valor sensível, ou URL com usuário/senha.
const temSegredo = (s) => (s.match(/[A-Za-z0-9_+=.-]{12,}/g) || []).some((x) => /\d/.test(x) && /[A-Za-z]/.test(x))
  || /(key|token|secret|pass|pwd|auth|bearer|senha|chave)\w*\s*[=:]\s*\S/i.test(s) || /:\/\/[^/\s@]+@/.test(s) || /\b(sk-|AIza|gh[pousr]_|github_pat_|hf_|gsk_|xox[abprs]-|npm_)/.test(s);
function descreveUrl(s) {
  try {
    const u = new URL(s);
    const senha = u.password || /[?&#](?:[^=&#]*(?:pass|pwd|token|key|secret|auth)[^=&#]*)=/i.test(s);
    return ` ${u.protocol.replace(':', '')}, host=${u.hostname || '(sem host)'}${senha ? ', COM SENHA OU TOKEN DENTRO DA URL' : ''}`;
  } catch { return ' (url que não deu pra ler)'; }
}
function mascara(k, v) {
  if (v === null || typeof v === 'boolean') return String(v);
  const sens = SENSIVEL.test(k);
  if (typeof v === 'number') return String(v).length <= 6 && !sens ? String(v) : `(número, ${String(v).length} dígitos)`;
  const s = String(v);
  if (s === '') return '(vazio)';
  if (/^(true|false)$/i.test(s)) return s;
  if (!sens && /^\d{1,6}$/.test(s)) return s;
  if (!sens && LIVRES.has(s.toLowerCase())) return JSON.stringify(s);
  if (!sens && ehCaminho(s) && !temSegredo(s)) return JSON.stringify(s);
  if (/^\$\{?[A-Z_][A-Z0-9_]*\}?$/.test(s)) return `${s} (aponta pra variável de ambiente: bom)`;
  const tipo = ehUrl(s) ? 'url' : /^[A-Za-z0-9+/=_-]{20,}$/.test(s) ? 'chave/token' : /^[0-9a-f-]{32,}$/i.test(s) ? 'hex/uuid' : 'texto';
  // Começo de 2 caracteres só em valor de 8 ou mais; valor curto aparece só como tamanho.
  const comeco = s.length >= 8 && tipo !== 'url' ? `"${s.slice(0, 2)}…" ` : '';
  return `${comeco}(${s.length} caracteres, ${tipo}${tipo === 'url' ? descreveUrl(s) : ''})`;
}
let n = 0;
const out = (s) => { if (n++ < MAX) console.log(s); else if (n === MAX + 1) console.log(`… (cortado em ${MAX} linhas; --max N pra mais)`); };
// Listas de permissão e nomes de ferramenta são estrutura, não segredo: aparecem, salvo se tiverem cara de segredo.
const PAIS_ESTRUTURAIS = new Set(['allow', 'deny', 'ask', 'matcher', 'args', 'enabledPlugins', 'enabledMcpjsonServers', 'disabledMcpjsonServers']);
// Flag que costuma vir antes de um segredo: --api-key, --token, -p, -a, -H, --header, -e, --env...
const FLAG_ANTES = (a) => typeof a === 'string' && (/^-[A-Za-z]$/.test(a) || /^--?(header|env|password|passwd|token|key|secret|auth|api)/i.test(a) || (/^-/.test(a) && SENSIVEL.test(a)));
function anda(o, pref, k, rota, anterior) {
  if (Array.isArray(o)) { out(`${pref}${k ?? ''}: [lista, ${o.length} itens]`); o.forEach((v, i) => anda(v, pref + '  ', `${k ?? ''}[${i}]`, rota, o[i - 1])); return; }
  if (o && typeof o === 'object') { if (k !== undefined) out(`${pref}${k}:`); for (const [kk, vv] of Object.entries(o)) anda(vv, k === undefined ? pref : pref + '  ', kk, [...rota, kk]); return; }
  const pai = rota[rota.length - 1];
  const depoisDeFlag = FLAG_ANTES(anterior);
  if (PAIS_ESTRUTURAIS.has(pai) && !depoisDeFlag && typeof o === 'string' && o.length <= 120 && !ehUrl(o) && !temSegredo(o)) { out(`${pref}${k} = ${JSON.stringify(o)}`); return; }
  // O nome usado pra decidir é o caminho inteiro (auth.token, env.API_KEY): campo dentro de "auth" é sensível.
  out(`${pref}${k} = ${mascara(depoisDeFlag ? 'secret' : rota.join('.'), o)}`);
}
const texto = fs.readFileSync(file, 'utf8');
console.log(`# ${path.basename(file)} (${texto.length} bytes, mascarado: nenhum valor aparece inteiro)`);
let json = null;
if (/\.json$/i.test(file) || /^\s*[{[]/.test(texto)) { try { json = JSON.parse(texto); } catch {} }
if (json !== null) anda(json, '', undefined, []);
else {
  for (const raw of texto.split(/\r?\n/)) {
    const l = raw.trimEnd();
    if (!l.trim()) continue;
    if (/^\s*[#;]/.test(l)) { out(temSegredo(l) || /[=:]\s*\S{8,}/.test(l) || /[A-Za-z0-9_+/=-]{20,}/.test(l) ? '# (comentário com valor, oculto)' : l.slice(0, 100)); continue; }
    if (/^\s*\[\[?[A-Za-z0-9_.\-"' ]+\]\]?\s*$/.test(l)) { out(l.trim()); continue; }
    // Item de lista que é uma URL inteira (YAML "- postgres://..."): não pode ser cortado no primeiro ":".
    const itemUrl = l.match(/^(\s*)-\s+["']?([a-z][a-z0-9+.-]*:\/\/\S+?)["']?\s*$/i);
    if (itemUrl) { out(`${itemUrl[1]}- ${mascara('url', itemUrl[2])}`); continue; }
    const kv = l.match(/^(\s*)(?:export\s+|-\s+)?([\w.\-"' ]+?)\s*[=:](?!\/\/)\s*(.*)$/);
    if (!kv) { out(`  (linha sem chave=valor, ${l.length} caracteres)`); continue; }
    const k = kv[2].trim().replace(/^["']|["']$/g, '');
    const v = kv[3].trim().replace(/\s+#.*$/, '').replace(/^["']|["']$/g, '');
    out(`${kv[1]}${k} = ${v === '' ? '(vazio)' : /^\[.*\]$/.test(v) ? `[lista, ${v.split(',').length} itens]` : mascara(k, v)}`);
  }
}
