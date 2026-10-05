// Controllo di un file di contenuti riscritto (riscrittura alla Disco Elysium, ottobre 2026).
// Uso: npx tsx scripts/controlla-file.ts contenuti/citta/grifone.yaml [altri file]
// Per ogni file controlla che:
// - il YAML si legga;
// - rispetto alla versione nel repository (git HEAD) sia cambiato solo il campo `testo` (struttura, id, requisiti,
//   effetti, titoli, descrizioni e opzioni restano identici);
// - i segni delle voci {abilità Difficoltà} siano validi;
// - lo stile non abbia segnalazioni (le regole di scripts/controlla-stile.ts, senza i segni delle voci).
// Stampa anche quante voci ci sono per attributo.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import { analizza, quotaFrasiBrevi } from './controlla-stile';
import { erroriVoci, leggiVoce, leggiOrigine, senzaSegni } from '../src/motore/voci';

const ORIGINI: string[] = (parse(readFileSync('contenuti/origini.yaml', 'utf8')).origini as { id: string }[]).map((o) => o.id);

function senzaTesti(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(senzaTesti);
  if (x && typeof x === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x)) o[k] = k === 'testo' ? '…' : senzaTesti(v);
    return o;
  }
  return x;
}

function testi(x: unknown, dove: string, out: { dove: string; testo: string }[]): void {
  if (Array.isArray(x)) x.forEach((v, i) => testi(v, `${dove}[${i}]`, out));
  else if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    const qui = typeof o['id'] === 'string' ? `${dove} ${o['id']}` : dove;
    for (const [k, v] of Object.entries(o)) {
      if (['testo', 'descrizione', 'sommario', 'titolo'].includes(k) && typeof v === 'string') out.push({ dove: `${qui}.${k}`, testo: v });
      else testi(v, `${qui}.${k}`, out);
    }
  }
}

interface Esito { effetti?: Record<string, number>; imposta?: Record<string, number>; vai?: string; segue?: string }
interface Opz { testo: string; quando?: string[]; esito?: Esito; successo?: Esito; fallimento?: Esito; vittoria?: Esito; sconfitta?: Esito }
const diOrigine = (o: Opz) => (o.quando ?? []).some((q) => q.startsWith('origine.'));
const esitiDi = (o: Opz) => [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta].filter((e): e is Esito => !!e);
/** Lo stato a cui porta un esito: effetti, flag impostati, spostamenti e seguiti (i PE regalati possono cambiare). */
const statoDi = (e: Esito) => JSON.stringify({ effetti: e.effetti ?? {}, imposta: e.imposta ?? {}, vai: e.vai ?? null, segue: e.segue ?? null });

let errori = 0;
for (const file of process.argv.slice(2)) {
  const nome = file.replace(/\\/g, '/');
  console.log(`\n== ${nome}`);
  let nuovo: unknown;
  try { nuovo = parse(readFileSync(file, 'utf8')); } catch (e) { console.log(`  YAML non valido: ${(e as Error).message}`); errori++; continue; }
  let aggiunte = 0;
  try {
    const vecchio = parse(execFileSync('git', ['show', `HEAD:${nome}`], { encoding: 'utf8' }));
    // le opzioni d'origine aggiunte (quando: origine.X) sono permesse, se portano allo stesso stato di un'opzione
    // normale della scena: le tolgo dal confronto e controllo i loro esiti a parte
    const confronto = structuredClone(nuovo) as { storylet?: { id: string; opzioni?: Opz[] }[] };
    for (const st of confronto.storylet ?? []) {
      const prima = (vecchio as typeof confronto).storylet?.find((x) => x.id === st.id)?.opzioni ?? [];
      const firme = prima.map((o) => JSON.stringify(senzaTesti(o)));
      const tenute: Opz[] = [];
      let j = 0;
      for (const o of st.opzioni ?? []) {
        if (j < firme.length && JSON.stringify(senzaTesti(o)) === firme[j]) { tenute.push(o); j++; continue; }
        if (!diOrigine(o)) { tenute.push(o); continue; }
        aggiunte++;
        const ammessi = new Set((st.opzioni ?? []).filter((x) => !diOrigine(x)).flatMap((x) => esitiDi(x).map(statoDi)));
        for (const e of esitiDi(o)) {
          if (!ammessi.has(statoDi(e))) {
            console.log(`  OPZIONE D'ORIGINE ${st.id} «${o.testo}»: un esito porta a uno stato che nessuna opzione normale della scena dà (${statoDi(e)})`);
            errori++;
          }
        }
        if (!esitiDi(o).length) { console.log(`  OPZIONE D'ORIGINE ${st.id} «${o.testo}»: senza esiti`); errori++; }
      }
      st.opzioni = tenute;
    }
    const a = JSON.stringify(senzaTesti(vecchio)), b = JSON.stringify(senzaTesti(confronto));
    if (a !== b) {
      let i = 0; while (i < a.length && a[i] === b[i]) i++;
      console.log(`  STRUTTURA CAMBIATA (deve cambiare solo "testo"). Prima differenza: …${a.slice(Math.max(0, i - 80), i + 80)}… / …${b.slice(Math.max(0, i - 80), i + 80)}…`);
      errori++;
    }
  } catch { console.log('  (file nuovo, nessun confronto con il repository)'); }
  const blocchi: { dove: string; testo: string }[] = [];
  testi(nuovo, '', blocchi);
  const conta: Record<string, number> = { fisico: 0, sociale: 0, mentale: 0 };
  const perOrigine: Record<string, number> = {};
  let segnalati = 0;
  for (const b of blocchi) {
    for (const x of erroriVoci(b.testo, ORIGINI)) { console.log(`  VOCE${b.dove}: ${x}`); errori++; }
    for (const p of b.testo.split(/\n\s*\n/)) {
      const v = leggiVoce(p.trim());
      if (v) conta[v.attributo]!++;
      const o = leggiOrigine(p.trim());
      if (o) for (const id of o.origini) perOrigine[id] = (perOrigine[id] ?? 0) + 1;
    }
    const t = senzaSegni(b.testo);
    const r = analizza(t);
    if (quotaFrasiBrevi(t) > 0.25) r['troppe frasi brevi'] = [`${Math.round(quotaFrasiBrevi(t) * 100)}% delle frasi ha quattro parole o meno`];
    const voci = Object.entries(r).filter(([, v]) => v.length);
    if (!voci.length) continue;
    segnalati++;
    console.log(`  STILE${b.dove}`);
    for (const [k, v] of voci) for (const x of v) console.log(`    · ${k}: ${x.slice(0, 110)}`);
  }
  console.log(`  ${blocchi.length} testi, ${segnalati} con segnalazioni di stile. Voci: fisico ${conta['fisico']}, sociale ${conta['sociale']}, mentale ${conta['mentale']}.`);
  console.log(`  Paragrafi d'origine: ${ORIGINI.map((id) => `${id} ${perOrigine[id] ?? 0}`).join(', ')}. Opzioni d'origine aggiunte: ${aggiunte}.`);
  errori += segnalati;
}
console.log(errori ? `\n${errori} problemi da sistemare.` : '\nTutto a posto.');
process.exit(errori ? 1 : 0);
