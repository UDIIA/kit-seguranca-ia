#!/usr/bin/env node
// testa-chave.mjs (kit-seguranca-ia 1.0.0, MIT)
// Diz se uma chave de API ainda funciona, sem a chave aparecer em lugar nenhum. Ela é lida de uma VARIÁVEL DE
// AMBIENTE (você passa o NOME, nunca o valor) e vai só pro provedor dela, numa chamada de leitura que não gasta
// crédito (listar modelos ou ver o próprio usuário). A saída é só o código HTTP e o veredito.
// Uso: node testa-chave.mjs NOME_DA_VARIAVEL [--arquivo <.env>] [--provedor anthropic|openai|google|github|openrouter|mistral|groq|huggingface]
//      node testa-chave.mjs ANTHROPIC_API_KEY --arquivo .env      (lê a linha desse nome no arquivo, sem imprimir nada dela)
import fs from 'node:fs';
const args = process.argv.slice(2);
const iProv = args.indexOf('--provedor');
const iArq = args.indexOf('--arquivo');
const prov = iProv >= 0 ? String(args[iProv + 1] || '').toLowerCase() : null;
const arquivo = iArq >= 0 ? args[iArq + 1] : null;
const valorDeFlag = (i) => (iProv >= 0 && i === iProv + 1) || (iArq >= 0 && i === iArq + 1);
const nome = args.find((a, i) => !a.startsWith('--') && !valorDeFlag(i));
if (!nome) { console.error('uso: node testa-chave.mjs NOME_DA_VARIAVEL [--provedor x]'); process.exit(2); }
// Nome de variável é letra, número e sublinhado, curto. Qualquer outra coisa pode ser o valor de uma chave colado por
// engano, e aí nada aqui repete o que veio.
const pareceValor = !/^[A-Za-z_][A-Za-z0-9_]{0,59}$/.test(nome) || /^(sk-|AIza|gh[pousr]_|github_pat_|hf_|gsk_|xox|npm_)/.test(nome)
  || (nome.length >= 16 && /[a-z]/.test(nome) && /[A-Z]/.test(nome) && /\d/.test(nome));
if (pareceValor) {
  console.error('Isso não parece nome de variável (pode ser o VALOR de uma chave). Não cole chave em comando nem em conversa.');
  console.error('Ponha a chave numa variável (ou no .env) e passe só o nome, como ANTHROPIC_API_KEY. Se era uma chave, trate como exposta: skill vazou-e-agora.');
  process.exit(2);
}
// Do arquivo (.env) quando passado; senão, da variável de ambiente. Funciona em qualquer Node 18+.
function doArquivo(caminho) {
  let texto;
  try { texto = fs.readFileSync(caminho, 'utf8'); } catch { console.error('Não consegui abrir o arquivo passado em --arquivo.'); process.exit(2); }
  for (const linha of texto.split(/\r?\n/)) {
    const m = linha.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || m[1] !== nome) continue;
    let val = m[2].trim();
    if (/^(["']).*\1$/.test(val)) val = val.slice(1, -1);
    else val = val.replace(/\s+#.*$/, '');
    return val.trim();
  }
  return '';
}
const v = arquivo ? doArquivo(arquivo) : (process.env[nome] || '').trim();
// Só repete o nome quando ele tem cara de nome de variável (MAIÚSCULAS_COM_SUBLINHADO).
const eco = /^[A-Z_][A-Z0-9_]*$/.test(nome) ? nome : '<NOME>';
if (!v) { console.error(arquivo ? `Não achei ${eco} preenchida no arquivo.` : `A variável ${eco} está vazia neste terminal. Dica: node testa-chave.mjs ${eco} --arquivo <caminho do seu .env>`); process.exit(2); }
// Palpite só pelos formatos que são de um provedor só. "sk-" sozinho também é usado por DeepSeek, proxies e outros:
// aí só vai pra OpenAI se o nome da variável disser OPENAI; senão pede --provedor.
const adivinha = () => /^sk-ant-/.test(v) ? 'anthropic' : /^sk-or-/.test(v) ? 'openrouter' : /^sk-(?:proj|svcacct|admin)-/.test(v) ? 'openai'
  : /^sk-/.test(v) && /OPENAI/i.test(nome) ? 'openai' : /^AIza/.test(v) ? 'google' : /^(gh[pousr]_|github_pat_)/.test(v) ? 'github'
  : /^gsk_/.test(v) ? 'groq' : /^hf_/.test(v) ? 'huggingface' : null;
const p = prov || adivinha();
const ROTAS = {
  anthropic: ['https://api.anthropic.com/v1/models', { 'x-api-key': v, 'anthropic-version': '2023-06-01' }],
  openai: ['https://api.openai.com/v1/models', { authorization: `Bearer ${v}` }],
  google: ['https://generativelanguage.googleapis.com/v1beta/models', { 'x-goog-api-key': v }],
  github: ['https://api.github.com/user', { authorization: `Bearer ${v}`, 'user-agent': 'kit-seguranca-ia' }],
  openrouter: ['https://openrouter.ai/api/v1/key', { authorization: `Bearer ${v}` }],
  mistral: ['https://api.mistral.ai/v1/models', { authorization: `Bearer ${v}` }],
  groq: ['https://api.groq.com/openai/v1/models', { authorization: `Bearer ${v}` }],
  huggingface: ['https://huggingface.co/api/whoami-v2', { authorization: `Bearer ${v}` }],
};
if (!ROTAS[p]) { console.error(`Não reconheci o provedor pelo formato. Passe --provedor (${Object.keys(ROTAS).join(', ')}).`); process.exit(2); }
const [url, headers] = ROTAS[p];
try {
  // Sem seguir redirecionamento: a chave vai só pro endereço fixo do provedor, nunca pra outro que ele apontar.
  const r = await fetch(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(15000) });
  await r.body?.cancel();
  const viva = r.status >= 200 && r.status < 300;
  const morta = r.status === 401 || r.status === 403;
  console.log(`${nome} (${p}): HTTP ${r.status} → ${viva ? 'VIVA: a chave funciona' : morta ? 'MORTA: revogada ou inválida' : r.status === 429 ? 'VIVA, mas com limite estourado agora' : 'resposta inesperada, confira no painel do provedor'}`);
  process.exit(viva || r.status === 429 ? 0 : morta ? 1 : 3);
} catch (e) { console.log(`${nome} (${p}): sem resposta (${String(e.cause?.code || e.name).slice(0, 40)})`); process.exit(3); }
