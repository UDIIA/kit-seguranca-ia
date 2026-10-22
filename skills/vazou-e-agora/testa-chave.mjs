#!/usr/bin/env node
// testa-chave.mjs (kit-seguranca-ia 1.0.0, MIT)
// Diz se uma chave de API ainda funciona, sem a chave aparecer em lugar nenhum. Ela é lida de uma VARIÁVEL DE
// AMBIENTE (você passa o NOME, nunca o valor) e vai só pro provedor dela, numa chamada de leitura que não gasta
// crédito (listar modelos ou ver o próprio usuário). A saída é só o código HTTP e o veredito.
// Uso: node testa-chave.mjs NOME_DA_VARIAVEL [--provedor anthropic|openai|google|github|openrouter|mistral|groq|huggingface]
//      node --env-file=.env testa-chave.mjs ANTHROPIC_API_KEY      (lê do .env sem imprimir; Node 20.6 ou mais novo)
const args = process.argv.slice(2);
const nome = args.find((a) => !a.startsWith('--'));
const prov = args.includes('--provedor') ? args[args.indexOf('--provedor') + 1] : null;
if (!nome) { console.error('uso: node testa-chave.mjs NOME_DA_VARIAVEL [--provedor x]'); process.exit(2); }
if (/^(sk-|AIza|gh[pousr]_|github_pat_|hf_|gsk_|xox)/.test(nome) || nome.length > 60) {
  console.error('Isso parece o VALOR de uma chave, não o nome da variável. Não cole chave em comando nem em conversa.');
  console.error('Ponha a chave numa variável (ou no .env) e passe só o nome. Trate essa chave como exposta: skill vazou-e-agora.');
  process.exit(2);
}
const v = (process.env[nome] || '').trim();
if (!v) { console.error(`A variável ${nome} está vazia neste terminal. Dica: node --env-file=<seu .env> testa-chave.mjs ${nome}`); process.exit(2); }
const adivinha = () => /^sk-ant-/.test(v) ? 'anthropic' : /^sk-or-/.test(v) ? 'openrouter' : /^sk-/.test(v) ? 'openai' : /^AIza/.test(v) ? 'google' : /^(gh[pousr]_|github_pat_)/.test(v) ? 'github' : /^gsk_/.test(v) ? 'groq' : /^hf_/.test(v) ? 'huggingface' : null;
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
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  await r.arrayBuffer();
  const viva = r.status >= 200 && r.status < 300;
  const morta = r.status === 401 || r.status === 403;
  console.log(`${nome} (${p}): HTTP ${r.status} → ${viva ? 'VIVA: a chave funciona' : morta ? 'MORTA: revogada ou inválida' : r.status === 429 ? 'VIVA, mas com limite estourado agora' : 'resposta inesperada, confira no painel do provedor'}`);
  process.exit(viva || r.status === 429 ? 0 : morta ? 1 : 3);
} catch (e) { console.log(`${nome} (${p}): sem resposta (${String(e.cause?.code || e.name).slice(0, 40)})`); process.exit(3); }
