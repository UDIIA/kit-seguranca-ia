#!/usr/bin/env node
// idade-pacote.mjs (kit-seguranca-ia 1.0.0, MIT)
// Antes de instalar: quantos dias tem esta versão, se o autor retirou, se roda script na instalação e se veio com
// prova de origem. Consulta só o registro público (registry.npmjs.org ou pypi.org).
// Uso: node idade-pacote.mjs npm <pacote>[@versao]      ex.: node idade-pacote.mjs npm express@5.1.0
//      node idade-pacote.mjs pypi <pacote>[==versao]    ex.: node idade-pacote.mjs pypi litellm==1.107.0
const [eco, alvo] = process.argv.slice(2);
if (!/^(npm|pypi)$/.test(eco || '') || !alvo) { console.error('uso: node idade-pacote.mjs npm <pacote>[@versao] | pypi <pacote>[==versao]'); process.exit(2); }
const DIAS_MIN = 7;
const idade = (iso) => (Date.now() - new Date(iso).getTime()) / 86400000;
const fmt = (d) => d < 1 ? `${Math.round(d * 24)} hora(s)` : `${d.toFixed(1)} dia(s)`;
const veredito = (d, extra = []) => {
  const L = [];
  if (d < DIAS_MIN) L.push(`ESPERE: publicada há ${fmt(d)}, menos de ${DIAS_MIN} dias. Versão envenenada costuma ser descoberta e retirada nesse prazo (o LiteLLM 1.107.0 ficou ~1h45 no ar). Use a versão anterior ou leia o código antes.`);
  else L.push(`OK pela idade: publicada há ${fmt(d)}.`);
  return L.concat(extra);
};
async function j(url) { const r = await fetch(url, { signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
try {
  if (eco === 'npm') {
    const m = alvo.match(/^(@?[^@]+)(?:@(.+))?$/);
    const nome = m[1];
    const d = await j(`https://registry.npmjs.org/${nome.replace('/', '%2f')}`);
    const ver = m[2] || d['dist-tags']?.latest;
    const info = d.versions?.[ver];
    if (!info) { console.log(`${nome}@${ver}: essa versão não existe no npm. Ou foi retirada (se você tem ela instalada, descubra por quê antes de seguir) ou o nome está errado (desconfie de nome parecido com pacote famoso).`); process.exit(1); }
    const quando = d.time?.[ver];
    const scripts = Object.keys(info.scripts || {}).filter((s) => /^(preinstall|install|postinstall)$/.test(s));
    const extra = [];
    if (scripts.length) extra.push(`ATENÇÃO: roda script na instalação (${scripts.join(', ')}). É por aí que pacote malicioso age; leia o script antes ou instale com --ignore-scripts.`);
    extra.push(info.dist?.attestations ? 'Tem prova de origem (provenance): foi publicada por um processo de build verificável.' : 'Sem prova de origem (provenance). Não é prova de golpe, só menos uma garantia.');
    extra.push(`Mantenedores: ${(info.maintainers || d.maintainers || []).length}. Versões publicadas: ${Object.keys(d.versions || {}).length}.`);
    console.log(`${nome}@${ver} (npm), publicada em ${quando}`);
    for (const l of veredito(idade(quando), extra)) console.log(`- ${l}`);
  } else {
    const m = alvo.match(/^([^=<>!~ ]+)(?:==(.+))?$/);
    const nome = m[1];
    const d = await j(`https://pypi.org/pypi/${nome}/json`);
    const ver = m[2] || d.info?.version;
    const arqs = d.releases?.[ver];
    if (!arqs) { console.log(`${nome}==${ver}: essa versão não existe no PyPI. Ou foi removida (se você tem ela instalada, descubra por quê antes de seguir) ou o nome está errado (desconfie de nome parecido com pacote famoso).`); process.exit(1); }
    if (!arqs.length) { console.log(`${nome}==${ver}: a versão existe, mas sem nenhum arquivo (foi apagada). Não instale.`); process.exit(1); }
    const quando = arqs.map((a) => a.upload_time_iso_8601).sort()[0];
    const extra = [];
    // O motivo é texto do autor do pacote: sai sem caractere de controle e cortado, entre aspas, como citação.
    const motivo = String(arqs.find((a) => a.yanked_reason)?.yanked_reason || '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').trim().slice(0, 160);
    if (arqs.some((a) => a.yanked)) extra.push(`RETIRADA PELO AUTOR (yanked)${motivo ? `; motivo escrito pelo autor: "${motivo}"` : ''}. Não instale.`);
    extra.push(`Arquivos: ${arqs.length} (${[...new Set(arqs.map((a) => a.packagetype))].join(', ')}).`);
    console.log(`${nome}==${ver} (PyPI), publicada em ${quando}`);
    for (const l of veredito(idade(quando), extra)) console.log(`- ${l}`);
  }
} catch (e) { console.error(`não consegui consultar o registro: ${e.message}`); process.exit(3); }
