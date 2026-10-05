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
import { erroriVoci, leggiVoce, senzaSegni } from '../src/motore/voci';

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
      if (k === 'testo' && typeof v === 'string') out.push({ dove: qui, testo: v });
      else testi(v, `${qui}.${k}`, out);
    }
  }
}

let errori = 0;
for (const file of process.argv.slice(2)) {
  const nome = file.replace(/\\/g, '/');
  console.log(`\n== ${nome}`);
  let nuovo: unknown;
  try { nuovo = parse(readFileSync(file, 'utf8')); } catch (e) { console.log(`  YAML non valido: ${(e as Error).message}`); errori++; continue; }
  try {
    const vecchio = parse(execFileSync('git', ['show', `HEAD:${nome}`], { encoding: 'utf8' }));
    const a = JSON.stringify(senzaTesti(vecchio)), b = JSON.stringify(senzaTesti(nuovo));
    if (a !== b) {
      let i = 0; while (i < a.length && a[i] === b[i]) i++;
      console.log(`  STRUTTURA CAMBIATA (deve cambiare solo "testo"). Prima differenza: …${a.slice(Math.max(0, i - 80), i + 80)}… / …${b.slice(Math.max(0, i - 80), i + 80)}…`);
      errori++;
    }
  } catch { console.log('  (file nuovo, nessun confronto con il repository)'); }
  const blocchi: { dove: string; testo: string }[] = [];
  testi(nuovo, '', blocchi);
  const conta: Record<string, number> = { fisico: 0, sociale: 0, mentale: 0 };
  let segnalati = 0;
  for (const b of blocchi) {
    for (const x of erroriVoci(b.testo)) { console.log(`  VOCE${b.dove}: ${x}`); errori++; }
    for (const p of b.testo.split(/\n\s*\n/)) { const v = leggiVoce(p.trim()); if (v) conta[v.attributo]!++; }
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
  errori += segnalati;
}
console.log(errori ? `\n${errori} problemi da sistemare.` : '\nTutto a posto.');
process.exit(errori ? 1 : 0);
