// Scrive docs/storie.md: la mappa di tutte le storie lunghe, nelle sezioni delle Cronache (contenuti/cronache.yaml).
// Per ogni storia: i file, i passi con le scene, le spedizioni, le altre storie da cui dipende e gli oggetti che dà.
// Si rigenera con `npm run mappa-storie` dopo ogni cambio alle storie; il file non va modificato a mano.
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { caricaContenuti } from './build-contenuti';
import { serieDi, type Serie } from '../src/motore/serie';
import { parseRequisito } from '../src/motore/personaggio';
import type { TStorylet } from '../src/motore/contenuto';

const RADICE = fileURLToPath(new URL('..', import.meta.url));
const { contenuti: c, errori } = caricaContenuti({ tavole: false });
if (errori.length) { console.error('Prima sistema i contenuti (npm run contenuti).'); process.exit(1); }

// in che file sta ogni storylet
const fileDi = new Map<string, string>();
const giro = (dir: string): string[] => readdirSync(dir).sort().flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? giro(p) : /\.ya?ml$/.test(f) ? [p] : [];
});
for (const f of giro(join(RADICE, 'contenuti'))) {
  const doc = parse(readFileSync(f, 'utf8')) as { storylet?: { id: string }[] } | null;
  for (const st of doc?.storylet ?? []) fileDi.set(st.id, relative(join(RADICE, 'contenuti'), f).replace(/\\/g, '/'));
}

const { serie, diStorylet, spedizioni } = serieDi(c);
const req = (st: TStorylet) => st.requisiti.map((r) => { try { return parseRequisito(r); } catch { return undefined; } }).filter((r) => !!r);
const esiti = (st: TStorylet) => st.opzioni.flatMap((o) => [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta]).filter((e) => !!e);
const nomeOggetto = (id: string) => c.oggetti.find((o) => o.id === id)?.nome ?? id;

function passi(z: Serie, sts: TStorylet[]): string[] {
  if (z.tipo === 'raccolta') return z.raccolta!.passi.map((p, i) => `${i + 1}. \`${p}\``);
  if (z.tipo === 'luogo') return z.tappe.map((t, i) => `${i + 1}. «${c.storylet.find((x) => x.id === t.storylet)?.titolo}» (\`${t.storylet}\`)`);
  const perPasso = new Map<number, TStorylet[]>();
  for (const st of sts) {
    const r = req(st).find((x) => x.chiave === z.quality && x.op === '==');
    if (r) perPasso.set(r.n, [...(perPasso.get(r.n) ?? []), st]);
  }
  return [...perPasso].sort((a, b) => a[0] - b[0])
    .map(([n, l]) => `${n}. ${[...new Set(l.map((st) => `«${st.titolo}»`))].join(', ')}`);
}

function scheda(z: Serie): string {
  const sts = c.storylet.filter((st) => diStorylet.get(st.id) === z);
  const f = c.fazioni.find((x) => x.pista === z.quality);
  const titolo = f ? `${f.nome}: ${z.nome}` : z.nome;
  const file = [...new Set(sts.map((st) => fileDi.get(st.id)).filter(Boolean))].sort();
  const sped = (spedizioni.get(z.id) ?? []).map((a) => `${a.nome} (\`${a.id}\`)`);
  const proprie = new Set([z.quality, ...(z.raccolta?.chiavi ?? [])]);
  const altre = new Map<string, number>();
  for (const st of sts) for (const r of req(st)) {
    if (proprie.has(r.chiave) || !serie.some((x) => x.quality === r.chiave) || !['>=', '>', '=='].includes(r.op) || (r.op === '==' && r.n === 0)) continue;
    const n = r.op === '>' ? r.n + 1 : r.n;
    altre.set(r.chiave, Math.min(altre.get(r.chiave) ?? Infinity, n));
  }
  const oggetti = [...new Set(sts.flatMap((st) => esiti(st).flatMap((e) => Object.entries(e.effetti ?? {}).filter(([k, v]) => k.startsWith('oggetto.') && v > 0).map(([k]) => nomeOggetto(k.slice(8))))))];
  const righe = [
    `### ${titolo}`,
    '',
    `\`${z.id}\` · ${z.massimo} passi · ${sts.length} scene${f ? ` · gradi ai passi ${f.gradi.map((g) => g.passo).join(', ')}` : ''}`,
    '',
    `- **File:** ${file.map((x) => `\`${x}\``).join(', ') || 'nessuno'}`,
    ...(sped.length ? [`- **Spedizioni:** ${sped.join(', ')}`] : []),
    ...(altre.size ? [`- **Dipende da:** ${[...altre].map(([k, n]) => `${serie.find((x) => x.quality === k)?.nome} almeno al passo ${n}`).join('; ')}`] : []),
    ...(oggetti.length ? [`- **Oggetti:** ${oggetti.join(', ')}`] : []),
    `- **Passi:**`,
    ...passi(z, sts).map((p) => `  ${p}`),
    '',
  ];
  return righe.join('\n');
}

const parti = [
  '# Le storie del gioco',
  '',
  'Generato da `npm run mappa-storie` (`scripts/mappa-storie.ts`): non modificarlo a mano. Le sezioni e l\'ordine sono',
  'quelli delle Cronache (`contenuti/cronache.yaml`); le serie le ricava `src/motore/serie.ts`.',
  '',
];
for (const sez of c.sezioni) {
  parti.push(`## ${sez.nome}`, '');
  for (const id of sez.serie) { const z = serie.find((x) => x.id === id); if (z) parti.push(scheda(z)); }
}
const conSerie = new Set([...spedizioni.values()].flat().map((a) => a.id));
const sole = c.aree.filter((a) => a.spedizione && !conSerie.has(a.id));
if (sole.length) parti.push('## Spedizioni che non appartengono a una storia', '', ...sole.map((a) => `- ${a.nome} (\`${a.id}\`)`), '');

writeFileSync(join(RADICE, 'docs', 'storie.md'), parti.join('\n'));
console.log(`docs/storie.md: ${c.sezioni.reduce((n, s) => n + s.serie.length, 0)} storie in ${c.sezioni.length} sezioni.`);
