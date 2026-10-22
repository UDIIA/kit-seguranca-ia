#!/usr/bin/env node
// mascara.mjs (kit-seguranca-ia 1.0.0, MIT)
// Mostra a ESTRUTURA de um arquivo com segredo (.env, settings.json, auth.json, config.toml, docker-compose.yml)
// sem mostrar os valores. O agente descobre quais chaves existem, se estão vazias e de que tipo são, e o valor nunca
// entra na conversa. Regra: tudo é mascarado, menos o que é estrutura de verdade (booleano, número curto, caminho,
// palavra curta sem dígito em campo que não parece segredo).
// Uso: node mascara.mjs <arquivo> [--max 400]
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
if (!file) { console.error('uso: node mascara.mjs <arquivo> [--max N]'); process.exit(2); }
const MAX = args.includes('--max') ? Number(args[args.indexOf('--max') + 1]) : 400;
const SENSIVEL = /(token|secret|key|senha|passw|pass$|auth|salt|pin|cookie|session|private|cred|url|webhook|dsn|conn|email|phone|tel|account|user|otp|mfa|2fa|bearer|jwt|sig|cert|hash|code)/i;
const ehCaminho = (s) => /^(?:[A-Za-z]:[\\/]|~[\\/]|\/|\.{1,2}[\\/])[^\s?#=]*$/.test(s);
// Item de lista estrutural (allow, args) com cara de segredo: trecho longo misturando letra e número, ou flag=valor.
const temSegredo = (s) => (s.match(/[A-Za-z0-9_+=.-]{12,}/g) || []).some((x) => /\d/.test(x) && /[A-Za-z]/.test(x)) || /(key|token|secret|passw|auth|bearer)\w*\s*[=:]\s*\S/i.test(s);
function mascara(k, v) {
  if (v === null || typeof v === 'boolean') return String(v);
  if (typeof v === 'number') return String(v).length <= 6 && !SENSIVEL.test(k) ? String(v) : `(número, ${String(v).length} dígitos)`;
  const s = String(v);
  if (s === '') return '(vazio)';
  if (/^(true|false)$/i.test(s)) return s;
  if (/^\d{1,6}$/.test(s) && !SENSIVEL.test(k)) return s;
  if (ehCaminho(s) && !SENSIVEL.test(k)) return JSON.stringify(s);
  if (!SENSIVEL.test(k) && s.length <= 12 && /^[\p{L}\s_./-]*$/u.test(s)) return JSON.stringify(s);
  if (/^\$\{?[A-Z_][A-Z0-9_]*\}?$/.test(s)) return `${s} (aponta pra variável de ambiente: bom)`;
  const tipo = /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? 'url' : /^[A-Za-z0-9+/=_-]{20,}$/.test(s) ? 'chave/token' : /^[0-9a-f-]{32,}$/i.test(s) ? 'hex/uuid' : 'texto';
  const host = tipo === 'url' ? ` ${s.split(':')[0]}, host=${s.replace(/^[a-z][a-z0-9+.-]*:\/\/(?:[^@/]+@)?([^/:?]+).*$/i, '$1')}${/^[a-z][a-z0-9+.-]*:\/\/[^/@]*:[^/@]*@/i.test(s) ? ', COM SENHA DENTRO DA URL' : ''}` : '';
  return `"${s.slice(0, 2)}…" (${s.length} caracteres, ${tipo}${host})`;
}
let n = 0;
const out = (s) => { if (n++ < MAX) console.log(s); else if (n === MAX + 1) console.log(`… (cortado em ${MAX} linhas; --max N pra mais)`); };
// Listas de permissão e nomes de ferramenta são estrutura, não segredo: aparecem, salvo se tiverem cara de token.
const PAIS_ESTRUTURAIS = new Set(['allow', 'deny', 'ask', 'matcher', 'args', 'enabledPlugins', 'enabledMcpjsonServers', 'disabledMcpjsonServers']);
function anda(o, pref, k, pai, anterior) {
  if (Array.isArray(o)) { out(`${pref}${k ?? ''}: [lista, ${o.length} itens]`); o.forEach((v, i) => anda(v, pref + '  ', `${k ?? ''}[${i}]`, k, o[i - 1])); return; }
  if (o && typeof o === 'object') { if (k !== undefined) out(`${pref}${k}:`); for (const [kk, vv] of Object.entries(o)) anda(vv, k === undefined ? pref : pref + '  ', kk, k); return; }
  // Valor logo depois de uma flag como --api-key ou --token: é o segredo, mascara sempre.
  const depoisDeFlag = typeof anterior === 'string' && /^-/.test(anterior) && SENSIVEL.test(anterior);
  if (PAIS_ESTRUTURAIS.has(pai) && !depoisDeFlag && typeof o === 'string' && o.length <= 120 && !temSegredo(o)) { out(`${pref}${k} = ${JSON.stringify(o)}`); return; }
  out(`${pref}${k} = ${mascara(depoisDeFlag ? 'secret' : String(k), o)}`);
}
const texto = fs.readFileSync(file, 'utf8');
console.log(`# ${path.basename(file)} (${texto.length} bytes, mascarado: nenhum valor aparece inteiro)`);
let json = null;
if (/\.json$/i.test(file) || /^\s*[{[]/.test(texto)) { try { json = JSON.parse(texto); } catch {} }
if (json !== null) anda(json, '', undefined);
else {
  for (const raw of texto.split(/\r?\n/)) {
    const l = raw.trimEnd();
    if (!l.trim()) continue;
    if (/^\s*[#;]/.test(l)) { out(/[=:]\s*\S{8,}/.test(l) ? '# (comentário com valor, oculto)' : l.slice(0, 100)); continue; }
    if (/^\s*\[\[?[^\]]+\]\]?\s*$/.test(l)) { out(l.trim()); continue; }
    const kv = l.match(/^(\s*)(?:export\s+|-\s+)?([\w.\-"' ]+?)\s*[=:]\s*(.*)$/);
    if (!kv) { out(`  (linha sem chave=valor, ${l.length} caracteres)`); continue; }
    const k = kv[2].trim().replace(/^["']|["']$/g, '');
    const v = kv[3].trim().replace(/\s+#.*$/, '').replace(/^["']|["']$/g, '');
    out(`${kv[1]}${k} = ${v === '' ? '(vazio)' : /^\[.*\]$/.test(v) ? `[lista, ${v.split(',').length} itens]` : mascara(k, v)}`);
  }
}
