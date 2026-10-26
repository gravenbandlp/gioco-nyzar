// La riscrittura alla Lovecraft (26 ottobre 2026): il passo di Le Montagne della Follia in tutto il gioco, testi delle
// scene ed esiti. Le regole sono in ../cantiere/lovecraft/istruzioni.md, che rimanda a docs/stile-dei-testi.md; il
// lavoro sta fuori dal repository, in ../cantiere/lovecraft. Lo strumento è quello della riscrittura asciutta
// (scripts/riscrittura.ts), con tre differenze: si riscrivono anche gli esiti, il testo può allungarsi entro un tetto,
// e il controllo segnala i nomi propri che il gioco non ha.
//
//   npx tsx scripts/riscrittura-lovecraft.ts estrai                  blocchi/NNN.json, scene intere in ordine di file
//   npx tsx scripts/riscrittura-lovecraft.ts prova <nome> <id>...    blocchi/<nome>.json con gli storylet scelti
//   npx tsx scripts/riscrittura-lovecraft.ts verifica NNN            controlla uscite/NNN.json rispetto al blocco
//   npx tsx scripts/riscrittura-lovecraft.ts reinserisci NNN...      scrive negli YAML i testi di quei blocchi (o «tutti»)
//   npx tsx scripts/riscrittura-lovecraft.ts stato                   quali blocchi sono fatti, verificati, reinseriti
//
// Un testo da riscrivere ha la chiave `<raccolta>:<id>:<percorso>`: `storylet:la-mula:testo` per la scena,
// `storylet:la-mula:opzioni.0.successo` per un esito. Un'uscita è un oggetto { chiave: testo nuovo }, con i paragrafi
// separati da una riga vuota e senza a capo dentro i paragrafi.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, parseDocument, isMap, isScalar, isSeq, isAlias, type Document, type Scalar, type Pair, type YAMLMap } from 'yaml';
import { analizza, quotaFrasiBrevi } from './controlla-stile';
import { erroriVoci, senzaSegni } from '../src/motore/voci';
import { declina, erroriGenere } from '../src/motore/genere';

const RADICE = fileURLToPath(new URL('..', import.meta.url));
const LAVORO = join(RADICE, '..', 'cantiere', 'lovecraft');
const BLOCCHI = join(LAVORO, 'blocchi');
const USCITE = join(LAVORO, 'uscite');
const FATTI = join(LAVORO, 'reinseriti.json');

/** Le raccolte e i campi da riscrivere. Sotto la soglia di parole un testo resta com'è, e nel blocco fa da contesto. */
const CAMPI: Record<string, { campi: string[]; soglia: number }> = {
  storylet: { campi: ['testo'], soglia: 30 },
  aree: { campi: ['testo'], soglia: 40 },
  luoghi: { campi: ['testo'], soglia: 40 },
};
const ESITI = ['esito', 'successo', 'fallimento', 'vittoria', 'sconfitta'] as const;
const SOGLIA_ESITO = 25;
const MAX_PAROLE = 4500;
const MAX_SCENE = 15;
const LARGHEZZA = 110;

/** Un testo da riscrivere, con il percorso del suo nodo nel file YAML. */
interface Testo { chiave: string; percorso: (string | number)[]; campo: string; testo: string }
interface EsitoBlocco { chiave?: string; titolo?: string; testo?: string }
interface OpzioneBlocco { testo: string; descrizione?: string; prova?: string; esiti: Record<string, EsitoBlocco> }
interface Scena {
  scena: string; file: string; raccolta: string; id: string;
  titolo?: string; luogo?: string; tipo?: string; area?: string; ripetibile?: boolean;
  testo: { chiave?: string; testo: string };
  opzioni: OpzioneBlocco[];
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

/** Il nodo del testo si può riscrivere: un blocco di testo, non una riga in linea né un alias di un'ancora. */
function riscrivibile(doc: Document, percorso: (string | number)[], campo: string): boolean {
  let nodo: unknown = doc.contents;
  for (const passo of percorso) {
    if (isAlias(nodo)) return false;
    nodo = isMap(nodo) || isSeq(nodo) ? (nodo as YAMLMap).get(passo as never, true) : undefined;
  }
  if (!isMap(nodo) || nodo.flow) return false;
  const valore = nodo.get(campo, true);
  return isScalar(valore) && typeof valore.value === 'string';
}

// ---------------------------------------------------------------- estrai

/** Le scene di tutti i file, ognuna con i suoi testi da riscrivere. */
function scene(): { scene: Scena[]; testi: Map<string, Testo & { file: string }> } {
  const out: Scena[] = [];
  const testi = new Map<string, Testo & { file: string }>();
  for (const file of fileYaml(join(RADICE, 'contenuti'))) {
    const rel = relative(RADICE, file).replace(/\\/g, '/');
    const src = readFileSync(file, 'utf8');
    const js = parse(src) as Record<string, unknown> | null;
    if (!js) continue;
    const doc = parseDocument(src);
    for (const [raccolta, { campi, soglia }] of Object.entries(CAMPI)) {
      const lista = js[raccolta];
      if (!Array.isArray(lista)) continue;
      (lista as Record<string, unknown>[]).forEach((x, i) => {
        if (!x || typeof x['id'] !== 'string') return;
        const id = x['id'] as string;
        const aggiungi = (percorso: (string | number)[], campo: string, t: string, minimo: number): string | undefined => {
          if (parole(t) < minimo || !riscrivibile(doc, percorso, campo)) return undefined;
          const coda = percorso.slice(2).join('.');
          const chiave = `${raccolta}:${id}:${coda ? `${coda}` : campo}`;
          testi.set(chiave, { chiave, percorso, campo, testo: paragrafi(t).join('\n\n'), file: rel });
          return chiave;
        };
        for (const campo of campi) {
          const t = x[campo];
          if (typeof t !== 'string') continue;
          const chiave = aggiungi([raccolta, i], campo, t, soglia);
          const opzioni = ((x['opzioni'] as Record<string, unknown>[] | undefined) ?? []).map((o, j) => {
            const esiti: Record<string, EsitoBlocco> = {};
            for (const k of ESITI) {
              const e = o[k] as { titolo?: string; testo?: string } | undefined;
              if (!e?.testo) continue;
              const ck = aggiungi([raccolta, i, 'opzioni', j, k], 'testo', e.testo, SOGLIA_ESITO);
              esiti[k] = { ...(ck ? { chiave: ck } : {}), titolo: e.titolo, testo: paragrafi(e.testo).join('\n\n') };
            }
            const p = o['prova'] as { abilita?: string | string[]; difficolta?: string } | undefined;
            return {
              testo: String(o['testo'] ?? ''), descrizione: o['descrizione'] as string | undefined,
              ...(p ? { prova: `${[p.abilita].flat().join('/')} ${p.difficolta}` } : {}), esiti,
            };
          });
          if (!chiave && !opzioni.some((o) => Object.values(o.esiti).some((e) => e.chiave))) continue;
          out.push({
            scena: `${raccolta}:${id}`, file: rel, raccolta, id,
            titolo: (x['titolo'] ?? x['nome']) as string | undefined, luogo: x['luogo'] as string | undefined,
            tipo: x['tipo'] as string | undefined, area: x['area'] as string | undefined,
            ...(x['ripetibile'] ? { ripetibile: true } : {}),
            testo: { ...(chiave ? { chiave } : {}), testo: paragrafi(t).join('\n\n') }, opzioni,
          });
        }
      });
    }
  }
  return { scene: out, testi };
}

/** Le parole da riscrivere in una scena. */
const daRiscrivere = (s: Scena) =>
  (s.testo.chiave ? parole(s.testo.testo) : 0)
  + s.opzioni.reduce((a, o) => a + Object.values(o.esiti).reduce((b, e) => b + (e.chiave ? parole(e.testo ?? '') : 0), 0), 0);

function preparaCartelle(): void {
  mkdirSync(BLOCCHI, { recursive: true });
  mkdirSync(USCITE, { recursive: true });
}

function estrai(): void {
  const { scene: tutte } = scene();
  preparaCartelle();
  const blocchi: Scena[][] = [];
  let corrente: Scena[] = [];
  let somma = 0;
  for (const s of tutte) {
    const n = daRiscrivere(s);
    if (corrente.length && (corrente.length >= MAX_SCENE || somma + n > MAX_PAROLE)) { blocchi.push(corrente); corrente = []; somma = 0; }
    corrente.push(s);
    somma += n;
  }
  if (corrente.length) blocchi.push(corrente);
  blocchi.forEach((b, i) => writeFileSync(join(BLOCCHI, `${nomeBlocco(i + 1)}.json`), JSON.stringify(b, null, 1)));
  const tot = tutte.reduce((a, s) => a + daRiscrivere(s), 0);
  console.log(`${tutte.length} scene, ${tot} parole da riscrivere, ${blocchi.length} blocchi in ${relative(RADICE, BLOCCHI)}`);
}

function prova(nome: string, ids: string[]): void {
  const { scene: tutte } = scene();
  const scelte = ids.map((id) => {
    const s = tutte.find((x) => x.id === id);
    if (!s) throw new Error(`nessuna scena da riscrivere con id ${id}`);
    return s;
  });
  preparaCartelle();
  writeFileSync(join(BLOCCHI, `${nome}.json`), JSON.stringify(scelte, null, 1));
  console.log(`${scelte.length} scene, ${scelte.reduce((a, s) => a + daRiscrivere(s), 0)} parole da riscrivere in blocchi/${nome}.json`);
}

const nomeBlocco = (n: number | string) => (/^\d+$/.test(String(n)) ? String(n).padStart(3, '0') : String(n));
const leggiBlocco = (n: string): Scena[] => JSON.parse(readFileSync(join(BLOCCHI, `${nomeBlocco(n)}.json`), 'utf8'));
const leggiUscita = (n: string): Record<string, string> => JSON.parse(readFileSync(join(USCITE, `${nomeBlocco(n)}.json`), 'utf8'));

/** I testi da riscrivere di un blocco, ognuno con il resto della sua scena per i controlli sui nomi. */
function testiDelBlocco(blocco: Scena[]): { chiave: string; testo: string; scena: Scena; esito: boolean }[] {
  const out: { chiave: string; testo: string; scena: Scena; esito: boolean }[] = [];
  for (const s of blocco) {
    if (s.testo.chiave) out.push({ chiave: s.testo.chiave, testo: s.testo.testo, scena: s, esito: false });
    for (const o of s.opzioni) for (const e of Object.values(o.esiti)) if (e.chiave) out.push({ chiave: e.chiave, testo: e.testo ?? '', scena: s, esito: true });
  }
  return out;
}

// ---------------------------------------------------------------- verifica

/** I segni in testa ai paragrafi: voci, origini, mezzanotte. */
const segni = (t: string) => paragrafi(t).map((p) => /^\{[^}]+\}/.exec(p)?.[0]).filter((x): x is string => !!x);

/** Frasi e virgole, sulla forma maschile e senza segni. */
function metriche(t: string): { parole: number; frasi: number; virgole: number } {
  const p = senzaSegni(declina(t, 'maschile')).replace(/\*/g, '');
  return { parole: parole(p), frasi: Math.max(1, p.split(/[.!?]+(?=\s|$|»)/).filter((f) => f.trim().length > 2).length), virgole: (p.match(/,/g) ?? []).length };
}

/** Le parole maiuscole dentro una frase (non in testa): i nomi propri. */
const RX_NOME = /(?<![.!?»:]\s|^|\n|«|\*|\}\s)\b(\p{Lu}[\p{L}'’-]{2,})/gu;
const nomiIn = (t: string) => new Set([...senzaSegni(declina(t, 'maschile')).matchAll(RX_NOME)].map((m) => m[1]!));
const contiene = (testo: string, nome: string) =>
  new RegExp(`(^|[^\\p{L}])${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u').test(testo);

/** Il resto della scena: tutti i suoi testi tranne quello che si sta controllando. */
function restoDellaScena(s: Scena, chiave: string): string {
  const pezzi = [s.testo.chiave === chiave ? '' : s.testo.testo];
  for (const o of s.opzioni) {
    pezzi.push(o.testo, o.descrizione ?? '');
    for (const e of Object.values(o.esiti)) pezzi.push(e.titolo ?? '', e.chiave === chiave ? '' : e.testo ?? '');
  }
  return pezzi.join(' ');
}

/**
 * I nomi che la riscrittura deve tenere: i nomi propri e le scritte in corsivo del testo vecchio che il resto della
 * scena nomina anche lui.
 */
function nomiDaTenere(vecchio: string, resto: string): string[] {
  const nomi = nomiIn(vecchio);
  for (const m of senzaSegni(declina(vecchio, 'maschile')).matchAll(/\*([^*]+?)\*/g)) if (!/[.!?]$/.test(m[1]!)) nomi.add(m[1]!);
  return [...nomi].filter((n) => contiene(resto, n));
}

/** Tutti i testi del gioco, una stringa per oggetto, per sapere dove un nome compare. */
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
  tuttoInsieme = [...tuttiTesti.values()].join('\n');
  return tuttiTesti;
}

/**
 * I nomi propri che la riscrittura toglie e che altre scene usano (al massimo quaranta volte: i nomi molto comuni,
 * come Velo o Cattedrale, non hanno bisogno di essere presentati). Una scena dopo potrebbe darli per conosciuti.
 */
function nomiTolti(s: Scena, vecchio: string, nuovo: string): string[] {
  const testi = testiDelGioco();
  const mio = testi.get(s.scena) ?? '';
  return [...nomiIn(vecchio)].filter((nome) => {
    if (nuovo.includes(nome)) return false;
    const rx = new RegExp(`(^|[^\\p{L}])${nome}([^\\p{L}]|$)`, 'gu');
    const volte = (tuttoInsieme!.match(rx) ?? []).length - (mio.match(rx) ?? []).length;
    return volte >= 1 && volte <= 40;
  });
}

/** I nomi propri nuovi che il gioco non ha da nessuna parte: un fatto inventato, quasi sempre. */
function nomiNuovi(vecchio: string, nuovo: string): string[] {
  testiDelGioco();
  const prima = nomiIn(vecchio);
  return [...nomiIn(nuovo)].filter((n) => !prima.has(n) && !contiene(tuttoInsieme!, n));
}

/** Il tetto di lunghezza: i testi brevi possono raddoppiare, quelli lunghi crescono meno. */
function tetto(esito: boolean, paroleVecchie: number): number {
  if (esito) return paroleVecchie < 50 ? 2 : 1.6;
  return paroleVecchie < 80 ? 2.2 : paroleVecchie < 160 ? 1.8 : 1.5;
}

function verifica(n: string): boolean {
  const blocco = leggiBlocco(n);
  if (!existsSync(join(USCITE, `${nomeBlocco(n)}.json`))) { console.log(`Blocco ${nomeBlocco(n)}: manca uscite/${nomeBlocco(n)}.json`); return false; }
  const uscita = leggiUscita(n);
  const lista = testiDelBlocco(blocco);
  let errori = 0;
  const tot = { prima: { parole: 0, frasi: 0, virgole: 0 }, dopo: { parole: 0, frasi: 0, virgole: 0 } };
  for (const { chiave, testo: vecchio, scena: s, esito } of lista) {
    const nuovo = uscita[chiave];
    const problemi: string[] = [];
    const avvisi: string[] = [];
    if (typeof nuovo !== 'string' || !nuovo.trim()) { console.log(`✗ ${chiave}: manca il testo riscritto`); errori++; continue; }
    if (nuovo.trim().split(/\n\s*\n/).some((p) => p.includes('\n'))) avvisi.push('a capo dentro un paragrafo (vanno tolti)');
    const sa = segni(vecchio).join(' '), sb = segni(nuovo).join(' ');
    if (sa !== sb) problemi.push(`segni diversi: prima [${sa}], dopo [${sb}]`);
    for (const x of erroriVoci(nuovo, ORIGINI)) problemi.push(`voce: ${x}`);
    for (const x of erroriGenere(nuovo)) problemi.push(`genere: ${x}`);
    const mancanti = nomiDaTenere(vecchio, restoDellaScena(s, chiave)).filter((nome) => !nuovo.includes(nome));
    if (mancanti.length) problemi.push(`mancano nomi che il resto della scena riprende: ${mancanti.join(', ')}`);
    const tolti = nomiTolti(s, vecchio, nuovo).filter((x) => !mancanti.includes(x));
    if (tolti.length) problemi.push(`hai tolto nomi che altre scene usano, e che qui forse vengono presentati: ${tolti.join(', ')}. Rimettili`);
    const inventati = nomiNuovi(vecchio, nuovo);
    if (inventati.length) problemi.push(`nomi che il gioco non ha da nessuna parte: ${inventati.join(', ')}. Niente nomi nuovi`);
    const piano = senzaSegni(declina(nuovo, 'maschile'));
    const stile = Object.entries(analizza(piano)).filter(([, x]) => x.length);
    if (quotaFrasiBrevi(piano) > 0.25) stile.push(['troppe frasi brevi', [`${Math.round(quotaFrasiBrevi(piano) * 100)}% delle frasi ha quattro parole o meno`]]);
    for (const [k, x] of stile) for (const y of x) problemi.push(`stile, ${k}: ${y.slice(0, 100)}`);
    const a = metriche(vecchio), b = metriche(nuovo);
    for (const k of ['parole', 'frasi', 'virgole'] as const) { tot.prima[k] += a[k]; tot.dopo[k] += b[k]; }
    const rapporto = b.parole / a.parole;
    const max = tetto(esito, a.parole);
    if (rapporto > max) problemi.push(`troppo lungo (${a.parole} → ${b.parole} parole, il tetto è ${Math.floor(a.parole * max)}): togli il dettaglio più debole`);
    else if (rapporto < 0.8) avvisi.push(`più corto di prima (${a.parole} → ${b.parole} parole): controllare che non manchi niente`);
    if (b.virgole / b.frasi > 0.9) avvisi.push(`${(b.virgole / b.frasi).toFixed(1)} virgole a frase`);
    const riga = `${a.parole}→${b.parole} parole, virgole a frase ${(a.virgole / a.frasi).toFixed(1)}→${(b.virgole / b.frasi).toFixed(1)}`;
    if (problemi.length) { errori++; console.log(`✗ ${chiave} (${riga})`); for (const p of problemi) console.log(`    · ${p}`); }
    else console.log(`✓ ${chiave} (${riga})`);
    for (const p of avvisi) console.log(`    ? ${p}`);
  }
  const extra = Object.keys(uscita).filter((k) => !lista.some((x) => x.chiave === k));
  if (extra.length) { errori++; console.log(`✗ chiavi che il blocco non ha: ${extra.join(', ')}`); }
  const { prima: p, dopo: d } = tot;
  console.log(`\nBlocco ${nomeBlocco(n)}: ${p.parole}→${d.parole} parole (+${Math.round((d.parole / p.parole - 1) * 100)}%), virgole a frase ${(p.virgole / p.frasi).toFixed(2)}→${(d.virgole / d.frasi).toFixed(2)}. ${errori ? `${errori} testi da sistemare.` : 'Tutto a posto.'}`);
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
  const { testi } = scene();
  const perFile = new Map<string, { t: Testo; nuovo: string }[]>();
  for (const n of numeri) {
    if (!verifica(n)) { console.log(`\nBlocco ${nomeBlocco(n)} non reinserito: prima va sistemato.`); process.exitCode = 1; return; }
    const uscita = leggiUscita(n);
    for (const { chiave, testo: vecchio } of testiDelBlocco(leggiBlocco(n))) {
      const t = testi.get(chiave);
      // il percorso si ricalcola dai file di adesso: se il testo è cambiato dopo l'estrazione, non si tocca
      if (!t || t.testo !== vecchio) { console.log(`  salto ${chiave}: il testo nel file è cambiato dopo l'estrazione`); continue; }
      perFile.set(t.file, [...(perFile.get(t.file) ?? []), { t, nuovo: uscita[chiave]! }]);
    }
  }
  for (const [file, lista] of perFile) {
    const percorso = join(RADICE, file);
    const src = readFileSync(percorso, 'utf8');
    const doc = parseDocument(src);
    const sostituzioni: { da: number; a: number; con: string }[] = [];
    for (const { t, nuovo } of lista) {
      const mappa = doc.getIn(t.percorso, true);
      if (!isMap(mappa)) throw new Error(`${file}: ${t.chiave} non porta a un oggetto`);
      const pair = mappa.items.find((p) => isScalar(p.key) && (p.key as Scalar).value === t.campo) as Pair<Scalar, Scalar> | undefined;
      const nodo = pair?.value;
      if (!pair || !isScalar(nodo) || !nodo.range || !pair.key.range) throw new Error(`${file}: ${t.chiave} non è un testo semplice`);
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
    const riletto = parseDocument(out);
    for (const { t, nuovo } of lista) {
      const letto = riletto.getIn([...t.percorso, t.campo]) as string;
      if (paragrafi(letto).join('\n\n') !== paragrafi(nuovo).join('\n\n')) throw new Error(`${file}: ${t.chiave} riletto diverso da quello scritto`);
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
else if (comando === 'prova') prova(resto[0]!, resto.slice(1));
else if (comando === 'verifica') { let ok = true; for (const n of resto) ok = verifica(n) && ok; process.exitCode = ok ? 0 : 1; }
else if (comando === 'reinserisci') {
  const numeri = resto[0] === 'tutti' ? readdirSync(USCITE).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort() : resto;
  reinserisci(numeri);
} else if (comando === 'stato') stato();
else console.log('Uso: npx tsx scripts/riscrittura-lovecraft.ts estrai | prova <nome> <id>... | verifica NNN... | reinserisci NNN...|tutti | stato');
