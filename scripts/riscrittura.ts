// La riscrittura asciutta della prosa (16 ottobre 2026): estrae i testi lunghi delle scene in blocchi, controlla i
// testi riscritti e li rimette negli YAML toccando solo la prosa. Le regole di scrittura sono in
// docs/stile-dei-testi.md; il lavoro sta fuori dal repository, in ../cantiere/riscrittura.
//
//   npx tsx scripts/riscrittura.ts estrai              blocchi/NNN.json, una ventina di scene per blocco, in ordine di file
//   npx tsx scripts/riscrittura.ts verifica NNN        controlla uscite/NNN.json rispetto al blocco
//   npx tsx scripts/riscrittura.ts reinserisci NNN...  scrive negli YAML i testi di quei blocchi (o «tutti»)
//   npx tsx scripts/riscrittura.ts stato               quali blocchi sono fatti, verificati, reinseriti
//
// Una voce di un blocco ha la chiave `<raccolta>:<id>:<campo>`; un'uscita è un oggetto { chiave: testo nuovo }, con
// i paragrafi separati da una riga vuota e senza a capo dentro i paragrafi.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, parseDocument, isMap, isScalar, isSeq, type Scalar, type Pair } from 'yaml';
import { analizza, quotaFrasiBrevi } from './controlla-stile';
import { erroriVoci, senzaSegni } from '../src/motore/voci';
import { declina, erroriGenere } from '../src/motore/genere';

const RADICE = fileURLToPath(new URL('..', import.meta.url));
const LAVORO = join(RADICE, '..', 'cantiere', 'riscrittura');
const BLOCCHI = join(LAVORO, 'blocchi');
const USCITE = join(LAVORO, 'uscite');
const FATTI = join(LAVORO, 'reinseriti.json');

/** Le raccolte e i campi da riscrivere, con la soglia di parole sotto cui un testo è già breve per natura. */
const CAMPI: Record<string, { campi: string[]; soglia: number }> = {
  storylet: { campi: ['testo'], soglia: 80 },
  aree: { campi: ['testo', 'descrizione'], soglia: 60 },
  luoghi: { campi: ['testo', 'descrizione'], soglia: 60 },
};
const MAX_PAROLE = 3500;
const MAX_SCENE = 20;
const LARGHEZZA = 110;

interface Esito { titolo?: string; testo?: string }
interface Opzione { testo: string; descrizione?: string; esiti: Record<string, Esito> }
interface Voce {
  chiave: string; file: string; raccolta: string; id: string; campo: string;
  titolo?: string; luogo?: string; tipo?: string; testo: string; opzioni: Opzione[];
}

const parole = (t: string) => t.split(/\s+/).filter(Boolean).length;
const ORIGINI: string[] = (parse(readFileSync(join(RADICE, 'contenuti/origini.yaml'), 'utf8')).origini as { id: string }[]).map((o) => o.id);

function fileYaml(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...fileYaml(p));
    else if (p.endsWith('.yaml')) out.push(p);
  }
  return out;
}

/** I paragrafi di un testo, con le righe di ogni paragrafo unite. */
function paragrafi(t: string): string[] {
  return t.trim().split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
}

// ---------------------------------------------------------------- estrai

function estrai(): void {
  const voci: Voce[] = [];
  for (const file of fileYaml(join(RADICE, 'contenuti'))) {
    const rel = relative(RADICE, file).replace(/\\/g, '/');
    const js = parse(readFileSync(file, 'utf8')) as Record<string, unknown> | null;
    if (!js) continue;
    for (const [raccolta, { campi, soglia }] of Object.entries(CAMPI)) {
      const lista = js[raccolta];
      if (!Array.isArray(lista)) continue;
      for (const x of lista as Record<string, unknown>[]) {
        if (!x || typeof x['id'] !== 'string') continue;
        for (const campo of campi) {
          const t = x[campo];
          if (typeof t !== 'string' || parole(t) < soglia) continue;
          const opzioni = ((x['opzioni'] as Record<string, unknown>[] | undefined) ?? []).map((o) => {
            const esiti: Record<string, Esito> = {};
            for (const k of ['esito', 'successo', 'fallimento', 'vittoria', 'sconfitta']) {
              const e = o[k] as Esito | undefined;
              if (e && (e.titolo || e.testo)) esiti[k] = { titolo: e.titolo, testo: e.testo?.trim() };
            }
            return { testo: String(o['testo'] ?? ''), descrizione: o['descrizione'] as string | undefined, esiti };
          });
          voci.push({
            chiave: `${raccolta}:${x['id']}:${campo}`, file: rel, raccolta, id: x['id'] as string, campo,
            titolo: (x['titolo'] ?? x['nome']) as string | undefined, luogo: x['luogo'] as string | undefined,
            tipo: x['tipo'] as string | undefined, testo: paragrafi(t).join('\n\n'), opzioni,
          });
        }
      }
    }
  }
  mkdirSync(BLOCCHI, { recursive: true });
  mkdirSync(USCITE, { recursive: true });
  const blocchi: Voce[][] = [];
  let corrente: Voce[] = [];
  let somma = 0;
  for (const v of voci) {
    if (corrente.length && (corrente.length >= MAX_SCENE || somma + parole(v.testo) > MAX_PAROLE)) { blocchi.push(corrente); corrente = []; somma = 0; }
    corrente.push(v);
    somma += parole(v.testo);
  }
  if (corrente.length) blocchi.push(corrente);
  blocchi.forEach((b, i) => writeFileSync(join(BLOCCHI, `${nomeBlocco(i + 1)}.json`), JSON.stringify(b, null, 1)));
  const tot = voci.reduce((a, v) => a + parole(v.testo), 0);
  console.log(`${voci.length} testi, ${tot} parole, ${blocchi.length} blocchi in ${relative(RADICE, BLOCCHI)}`);
}

const nomeBlocco = (n: number | string) => String(n).padStart(3, '0');
const leggiBlocco = (n: string): Voce[] => JSON.parse(readFileSync(join(BLOCCHI, `${nomeBlocco(n)}.json`), 'utf8'));
const leggiUscita = (n: string): Record<string, string> => JSON.parse(readFileSync(join(USCITE, `${nomeBlocco(n)}.json`), 'utf8'));

// ---------------------------------------------------------------- verifica

/** I segni in testa ai paragrafi: voci, origini, mezzanotte. */
const segni = (t: string) => paragrafi(t).map((p) => /^\{[^}]+\}/.exec(p)?.[0]).filter((x): x is string => !!x);

/** Frasi e virgole, sulla forma maschile e senza segni. */
function metriche(t: string): { parole: number; frasi: number; virgole: number } {
  const p = senzaSegni(declina(t, 'maschile')).replace(/\*/g, '');
  return { parole: parole(p), frasi: Math.max(1, p.split(/[.!?]+(?=\s|$|»)/).filter((f) => f.trim().length > 2).length), virgole: (p.match(/,/g) ?? []).length };
}

/**
 * I nomi che la riscrittura deve tenere: le parole maiuscole dentro una frase (non in testa) e le scritte in corsivo
 * del testo vecchio che le opzioni o gli esiti della scena nominano anche loro.
 */
function nomiDaTenere(v: Voce): string[] {
  const vecchio = senzaSegni(declina(v.testo, 'maschile'));
  const altrove = v.opzioni.map((o) => [o.testo, o.descrizione, ...Object.values(o.esiti).flatMap((e) => [e.titolo, e.testo])].join(' ')).join(' ');
  const nomi = new Set<string>();
  for (const m of vecchio.matchAll(/(?<![.!?»:]\s|^|\n|«|\*|\}\s)\b(\p{Lu}[\p{L}'’-]{2,})/gu)) nomi.add(m[1]!);
  for (const m of vecchio.matchAll(/\*([^*]+?)\*/g)) if (!/[.!?]$/.test(m[1]!)) nomi.add(m[1]!);
  return [...nomi].filter((n) => new RegExp(`(^|[^\\p{L}])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u').test(altrove));
}

/** Tutti i testi del gioco (storylet, opzioni, esiti, luoghi), per sapere dove un nome compare. */
let tuttiTesti: Map<string, string> | undefined;
let tuttoInsieme: string | undefined;
function testiDelGioco(): Map<string, string> {
  if (tuttiTesti) return tuttiTesti;
  tuttiTesti = new Map();
  const c = JSON.parse(readFileSync(join(RADICE, 'src/generato/contenuti.json'), 'utf8')) as Record<string, Record<string, unknown>[]>;
  for (const [raccolta, lista] of Object.entries(c)) {
    if (!Array.isArray(lista)) continue;
    for (const x of lista) if (x && typeof x['id'] === 'string') tuttiTesti.set(`${raccolta}:${x['id']}`, JSON.stringify(x));
  }
  return tuttiTesti;
}

/**
 * I nomi propri che la riscrittura toglie e che altre scene usano (al massimo quaranta volte: i nomi molto comuni,
 * come Velo o Cattedrale, non hanno bisogno di essere presentati). Una scena dopo potrebbe darli per conosciuti.
 */
function nomiTolti(v: Voce, nuovo: string): string[] {
  const vecchio = senzaSegni(declina(v.testo, 'maschile'));
  const nomi = new Set<string>();
  for (const m of vecchio.matchAll(/(?<![.!?»:]\s|^|\n|«|\*|\}\s)\b(\p{Lu}[\p{L}'’-]{2,})/gu)) if (!nuovo.includes(m[1]!)) nomi.add(m[1]!);
  const testi = testiDelGioco();
  tuttoInsieme ??= [...testi.values()].join('\n');
  const mio = testi.get(`${v.raccolta}:${v.id}`) ?? '';
  return [...nomi].filter((nome) => {
    const rx = new RegExp(`(^|[^\\p{L}])${nome}([^\\p{L}]|$)`, 'gu');
    const volte = (tuttoInsieme!.match(rx) ?? []).length - (mio.match(rx) ?? []).length;
    return volte >= 1 && volte <= 40;
  });
}

function verifica(n: string): boolean {
  const blocco = leggiBlocco(n);
  if (!existsSync(join(USCITE, `${nomeBlocco(n)}.json`))) { console.log(`Blocco ${nomeBlocco(n)}: manca uscite/${nomeBlocco(n)}.json`); return false; }
  const uscita = leggiUscita(n);
  let errori = 0;
  const tot = { prima: { parole: 0, frasi: 0, virgole: 0 }, dopo: { parole: 0, frasi: 0, virgole: 0 } };
  for (const v of blocco) {
    const nuovo = uscita[v.chiave];
    const problemi: string[] = [];
    const avvisi: string[] = [];
    if (typeof nuovo !== 'string' || !nuovo.trim()) { console.log(`✗ ${v.chiave}: manca il testo riscritto`); errori++; continue; }
    if (nuovo.trim().split(/\n\s*\n/).some((p) => p.includes('\n'))) avvisi.push('a capo dentro un paragrafo (vanno tolti)');
    const sa = segni(v.testo).join(' '), sb = segni(nuovo).join(' ');
    if (sa !== sb) problemi.push(`segni diversi: prima [${sa}], dopo [${sb}]`);
    for (const x of erroriVoci(nuovo, ORIGINI)) problemi.push(`voce: ${x}`);
    for (const x of erroriGenere(nuovo)) problemi.push(`genere: ${x}`);
    const mancanti = nomiDaTenere(v).filter((nome) => !nuovo.includes(nome));
    if (mancanti.length) problemi.push(`mancano nomi che opzioni o esiti riprendono: ${mancanti.join(', ')}`);
    const tolti = nomiTolti(v, nuovo).filter((x) => !mancanti.includes(x));
    if (tolti.length) problemi.push(`hai tolto nomi che altre scene usano, e che qui forse vengono presentati: ${tolti.join(', ')}. Rimettili`);
    const piano = senzaSegni(declina(nuovo, 'maschile'));
    const stile = Object.entries(analizza(piano)).filter(([, x]) => x.length);
    if (quotaFrasiBrevi(piano) > 0.25) stile.push(['troppe frasi brevi', [`${Math.round(quotaFrasiBrevi(piano) * 100)}% delle frasi ha quattro parole o meno`]]);
    for (const [k, x] of stile) for (const y of x) problemi.push(`stile, ${k}: ${y.slice(0, 100)}`);
    const a = metriche(v.testo), b = metriche(nuovo);
    for (const k of ['parole', 'frasi', 'virgole'] as const) { tot.prima[k] += a[k]; tot.dopo[k] += b[k]; }
    const rapporto = b.parole / a.parole;
    if (rapporto > 1) problemi.push(`più lungo di prima (${a.parole} → ${b.parole} parole)`);
    else if (rapporto < 0.5) avvisi.push(`tagliato più di metà (${a.parole} → ${b.parole} parole): controllare che non manchi niente`);
    else if (rapporto > 0.85 && a.parole >= 100) problemi.push(`tagliato troppo poco (${a.parole} → ${b.parole} parole, ${Math.round((1 - rapporto) * 100)}%): serve almeno il 15%`);
    if (b.virgole / b.frasi > 0.8) avvisi.push(`ancora ${(b.virgole / b.frasi).toFixed(1)} virgole a frase`);
    const riga = `${a.parole}→${b.parole} parole, virgole a frase ${(a.virgole / a.frasi).toFixed(1)}→${(b.virgole / b.frasi).toFixed(1)}`;
    if (problemi.length) { errori++; console.log(`✗ ${v.chiave} (${riga})`); for (const p of problemi) console.log(`    · ${p}`); }
    else console.log(`✓ ${v.chiave} (${riga})`);
    for (const p of avvisi) console.log(`    ? ${p}`);
  }
  const extra = Object.keys(uscita).filter((k) => !blocco.some((v) => v.chiave === k));
  if (extra.length) { errori++; console.log(`✗ chiavi che il blocco non ha: ${extra.join(', ')}`); }
  const { prima: p, dopo: d } = tot;
  console.log(`\nBlocco ${nomeBlocco(n)}: ${p.parole}→${d.parole} parole (${Math.round((d.parole / p.parole - 1) * 100)}%), virgole a frase ${(p.virgole / p.frasi).toFixed(2)}→${(d.virgole / d.frasi).toFixed(2)}. ${errori ? `${errori} testi da sistemare.` : 'Tutto a posto.'}`);
  return errori === 0;
}

// ---------------------------------------------------------------- reinserisci

function aCapo(p: string, larghezza: number): string[] {
  const righe: string[] = [];
  let r = '';
  for (const w of p.split(/\s+/)) {
    if (r && r.length + 1 + w.length > larghezza) { righe.push(r); r = w; } else r = r ? `${r} ${w}` : w;
  }
  if (r) righe.push(r);
  return righe;
}

function reinserisci(numeri: string[]): void {
  const fatti: string[] = existsSync(FATTI) ? JSON.parse(readFileSync(FATTI, 'utf8')) : [];
  const perFile = new Map<string, { v: Voce; nuovo: string }[]>();
  for (const n of numeri) {
    if (!verifica(n)) { console.log(`\nBlocco ${nomeBlocco(n)} non reinserito: prima va sistemato.`); process.exitCode = 1; return; }
    const uscita = leggiUscita(n);
    for (const v of leggiBlocco(n)) perFile.set(v.file, [...(perFile.get(v.file) ?? []), { v, nuovo: uscita[v.chiave]! }]);
  }
  for (const [file, lista] of perFile) {
    const percorso = join(RADICE, file);
    const src = readFileSync(percorso, 'utf8');
    const doc = parseDocument(src);
    const sostituzioni: { da: number; a: number; con: string }[] = [];
    for (const { v, nuovo } of lista) {
      const seq = doc.get(v.raccolta, true);
      if (!isSeq(seq)) throw new Error(`${file}: manca la raccolta ${v.raccolta}`);
      const item = seq.items.find((x) => isMap(x) && x.get('id') === v.id);
      if (!isMap(item)) throw new Error(`${file}: manca ${v.id}`);
      if (item.flow) { console.log(`  salto ${v.chiave}: è scritto in una riga sola`); continue; }
      const pair = item.items.find((p) => isScalar(p.key) && (p.key as Scalar).value === v.campo) as Pair<Scalar, Scalar> | undefined;
      const nodo = pair?.value;
      if (!pair || !isScalar(nodo) || !nodo.range || !pair.key.range) throw new Error(`${file}: ${v.chiave} non è un testo semplice`);
      const inizioRiga = src.lastIndexOf('\n', pair.key.range[0] - 1) + 1;
      const rientro = ' '.repeat(pair.key.range[0] - inizioRiga + 2);
      const vecchio = src.slice(nodo.range[0], nodo.range[1]);
      const coda = /\s*$/.exec(vecchio)![0];
      const corpo = paragrafi(nuovo).map((p) => aCapo(p, LARGHEZZA - rientro.length).map((r) => rientro + r).join('\n')).join('\n\n');
      sostituzioni.push({ da: nodo.range[0], a: nodo.range[1], con: `|\n${corpo}${coda.includes('\n') ? coda : '\n'}` });
    }
    let out = src;
    for (const s of sostituzioni.sort((x, y) => y.da - x.da)) out = out.slice(0, s.da) + s.con + out.slice(s.a);
    // ricontrollo: il file si rilegge e ogni testo è quello nuovo
    const js = parse(out) as Record<string, Record<string, unknown>[]>;
    for (const { v, nuovo } of lista) {
      const letto = js[v.raccolta]!.find((x) => x['id'] === v.id)![v.campo] as string;
      if (paragrafi(letto).join('\n\n') !== paragrafi(nuovo).join('\n\n')) throw new Error(`${file}: ${v.chiave} riletto diverso da quello scritto`);
    }
    writeFileSync(percorso, out);
    console.log(`${file}: ${sostituzioni.length} testi`);
  }
  writeFileSync(FATTI, JSON.stringify([...new Set([...fatti, ...numeri.map(nomeBlocco)])].sort(), null, 1));
}

// ---------------------------------------------------------------- stato

function stato(): void {
  const fatti: string[] = existsSync(FATTI) ? JSON.parse(readFileSync(FATTI, 'utf8')) : [];
  const tutti = readdirSync(BLOCCHI).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
  const scritti = tutti.filter((n) => existsSync(join(USCITE, `${n}.json`)));
  console.log(`${tutti.length} blocchi, ${scritti.length} riscritti, ${fatti.length} reinseriti.`);
  const mancanti = tutti.filter((n) => !scritti.includes(n));
  if (mancanti.length) console.log(`Da riscrivere: ${mancanti.join(' ')}`);
  const sospesi = scritti.filter((n) => !fatti.includes(n));
  if (sospesi.length) console.log(`Riscritti e non reinseriti: ${sospesi.join(' ')}`);
}

const [comando, ...resto] = process.argv.slice(2);
if (comando === 'estrai') estrai();
else if (comando === 'verifica') { let ok = true; for (const n of resto) ok = verifica(n) && ok; process.exitCode = ok ? 0 : 1; }
else if (comando === 'reinserisci') {
  const numeri = resto[0] === 'tutti' ? readdirSync(USCITE).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort() : resto;
  reinserisci(numeri);
} else if (comando === 'stato') stato();
else console.log('Uso: npx tsx scripts/riscrittura.ts estrai | verifica NNN... | reinserisci NNN...|tutti | stato');
