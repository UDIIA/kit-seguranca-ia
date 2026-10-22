#!/usr/bin/env node
// idade-pacote.mjs (kit-seguranca-ia 1.0.0, MIT)
// Antes de instalar: quantos dias tem esta versão, se o autor retirou ou condenou, se roda script na instalação e se
// veio com prova de origem. Consulta só o registro público (registry.npmjs.org ou pypi.org).
// Uso: node idade-pacote.mjs npm <pacote>[@versao]      ex.: node idade-pacote.mjs npm express@5.1.0
//      node idade-pacote.mjs pypi <pacote>[==versao]    ex.: node idade-pacote.mjs pypi litellm==1.107.0
// Código de saída: 0 = pode seguir; 1 = espere ou não instale (nova demais, retirada, condenada, inexistente);
// 2 = uso errado; 3 = registro não respondeu.
const [eco, alvo] = process.argv.slice(2);
const USO = 'uso: node idade-pacote.mjs npm <pacote>[@versao] | pypi <pacote>[==versao]';
if (!/^(npm|pypi)$/.test(eco || '') || !alvo) { console.error(USO); process.exit(2); }
const DIAS_MIN = 7;
const idade = (iso) => (Date.now() - new Date(iso).getTime()) / 86400000;
const fmt = (d) => d < 1 ? `${Math.round(d * 24)} hora(s)` : `${d.toFixed(1)} dia(s)`;
// Texto escrito pelo autor do pacote: sai sem caractere de controle e cortado, entre aspas, como citação.
const citacao = (t) => String(t || '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').trim().slice(0, 160);
function fecha(cabeca, quando, alertas, extra) {
  const d = idade(quando);
  const L = [];
  if (!Number.isFinite(d)) L.push('Sem data de publicação no registro: não dá pra saber a idade. Trate como nova.');
  else if (d < DIAS_MIN) L.push(`ESPERE: publicada há ${fmt(d)}, menos de ${DIAS_MIN} dias. Versão envenenada costuma ser descoberta e retirada nesse prazo (o LiteLLM 1.107.0 ficou ~1h45 no ar). Use a versão anterior ou leia o código antes.`);
  const bloqueia = !Number.isFinite(d) || d < DIAS_MIN || alertas.length > 0;
  if (!bloqueia) L.push(`OK pela idade: publicada há ${fmt(d)}.`);
  console.log(cabeca);
  for (const l of [...alertas, ...L, ...extra]) console.log(`- ${l}`);
  process.exit(bloqueia ? 1 : 0);
}
async function j(url) { const r = await fetch(url, { signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
try {
  if (eco === 'npm') {
    const m = alvo.match(/^(@[a-z0-9._~-]+\/[a-z0-9._~-]+|[a-z0-9._~-]+)(?:@([0-9A-Za-z.+-]+))?$/i);
    if (!m) { console.error(`não entendi "${citacao(alvo)}". ${USO}`); process.exit(2); }
    const nome = m[1];
    const d = await j(`https://registry.npmjs.org/${nome.replace('/', '%2f')}`);
    let ver = m[2] || d['dist-tags']?.latest;
    // Etiqueta (next-11, latest) ou faixa só com o número principal (npm@11, npm@11.21): resolve pra versão exata e
    // aponta a mais nova da faixa que já tem 7 dias, que é a que o `npm install` deveria pedir.
    let nota = '';
    if (ver && !d.versions?.[ver]) {
      const tag = d['dist-tags']?.[ver];
      if (tag) { nota = `"${citacao(ver)}" é uma etiqueta que hoje aponta pra ${tag}.`; ver = tag; }
      else if (/^\d+(\.\d+)?$/.test(ver)) {
        const num = (v) => v.split('.').map(Number);
        const ordem = (a, b) => { const [x, y] = [num(a), num(b)]; return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };
        const faixa = Object.keys(d.versions || {}).filter((v) => /^\d+\.\d+\.\d+$/.test(v) && v.startsWith(`${ver}.`)).sort(ordem);
        const madura = faixa.filter((v) => idade(d.time?.[v]) >= DIAS_MIN).pop();
        if (faixa.length) {
          nota = `"${ver}" é uma faixa; a mais nova dela é ${faixa.at(-1)}.`
            + (madura && madura !== faixa.at(-1) ? ` A mais nova com ${DIAS_MIN} dias ou mais é ${madura}: instale \`${nome}@${madura}\`.` : '');
          ver = faixa.at(-1);
        }
      }
    }
    const info = d.versions?.[ver];
    if (!info) { console.log(`${nome}@${ver}: essa versão não existe no npm. Ou foi retirada (se você tem ela instalada, descubra por quê antes de seguir) ou o nome está errado (desconfie de nome parecido com pacote famoso).`); process.exit(1); }
    const alertas = [];
    if (info.deprecated) alertas.push(`CONDENADA PELO AUTOR (deprecated); recado dele: "${citacao(info.deprecated)}". Não instale sem entender por quê.`);
    const scripts = Object.keys(info.scripts || {}).filter((s) => /^(preinstall|install|postinstall)$/.test(s));
    const extra = nota ? [nota] : [];
    if (scripts.length) extra.push(`ATENÇÃO: roda script na instalação (${scripts.join(', ')}). É por aí que pacote malicioso age; leia o script antes ou instale com --ignore-scripts.`);
    extra.push(info.dist?.attestations ? 'Tem prova de origem (provenance): foi publicada por um processo de build verificável.' : 'Sem prova de origem (provenance). Não é prova de golpe, só menos uma garantia.');
    extra.push(`Mantenedores: ${(info.maintainers || d.maintainers || []).length}. Versões publicadas: ${Object.keys(d.versions || {}).length}.`);
    fecha(`${nome}@${ver} (npm), publicada em ${d.time?.[ver] || '(sem data)'}`, d.time?.[ver], alertas, extra);
  } else {
    const m = alvo.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)(?:==([0-9A-Za-z.+!-]+))?$/);
    if (!m) { console.error(`não entendi "${citacao(alvo)}". Passe o nome, ou nome==versão (sem !=, >=, ~=). ${USO}`); process.exit(2); }
    const nome = m[1];
    const d = await j(`https://pypi.org/pypi/${nome}/json`);
    const ver = m[2] || d.info?.version;
    const arqs = d.releases?.[ver];
    if (!arqs) { console.log(`${nome}==${ver}: essa versão não existe no PyPI. Ou foi removida (se você tem ela instalada, descubra por quê antes de seguir) ou o nome está errado (desconfie de nome parecido com pacote famoso).`); process.exit(1); }
    if (!arqs.length) { console.log(`${nome}==${ver}: a versão existe, mas sem nenhum arquivo (foi apagada). Não instale.`); process.exit(1); }
    const quando = arqs.map((a) => a.upload_time_iso_8601).filter(Boolean).sort()[0];
    const alertas = [];
    const motivo = citacao(arqs.find((a) => a.yanked_reason)?.yanked_reason);
    if (arqs.some((a) => a.yanked)) alertas.push(`RETIRADA PELO AUTOR (yanked)${motivo ? `; motivo escrito pelo autor: "${motivo}"` : ''}. Não instale.`);
    const extra = [`Arquivos: ${arqs.length} (${[...new Set(arqs.map((a) => a.packagetype))].join(', ')}).`];
    fecha(`${nome}==${ver} (PyPI), publicada em ${quando || '(sem data)'}`, quando, alertas, extra);
  }
} catch (e) { console.error(`não consegui consultar o registro: ${e.message}`); process.exit(3); }
