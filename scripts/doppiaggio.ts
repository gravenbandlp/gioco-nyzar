// Il copione per il doppiaggio: tutte le scene di Storia (e dei prologhi) con i loro esiti, pronte da incollare
// in ElevenLabs. Le azioni ripetibili, le occasioni, le crisi e le aree di penalità non si doppiano.
//
// Ogni pezzo ha un id stabile, che diventa il nome del file audio:
//   <storylet>                 la scena
//   <storylet>__<n>-<esito>    l'esito dell'opzione n (da 1), esito = successo | fallimento | vittoria | sconfitta | esito
// e un'impronta del testo: se la scena cambia dopo la registrazione, l'importazione se ne accorge.
//
// Uso: npm run doppiaggio   →  doppiaggio/copione.json e doppiaggio/copione.md
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { caricaContenuti } from './build-contenuti';
import type { TStorylet } from '../src/motore/contenuto';

const RADICE = fileURLToPath(new URL('..', import.meta.url));
const CONTENUTI = join(RADICE, 'contenuti');
const USCITA = join(RADICE, 'doppiaggio');

// Il gruppo di ogni file, nell'ordine in cui si incontrano giocando.
const GRUPPI: [RegExp, string][] = [
  [/^prologo\//, 'I prologhi'],
  [/^grifone/, 'Il Grifone di Ferro'],
  [/^aree\//, 'In città'],
  [/^piste\/dama-argento/, "La Dama d'Argento"],
  [/^piste\/sepolcro/, 'Il Sepolcro violato'],
  [/^piste\/corin/, 'La caccia di Corin'],
  [/^piste\/teatro/, "La Promessa dell'Arpia"],
  [/^piste\/registro/, 'Il registro del custode'],
  [/^piste\/tribu/, 'Le cinque tribù'],
  [/^piste\/acciaio/, 'Acciaio e Ira'],
  [/^piste\/capomozzo/, 'Capomozzo'],
  [/^piste\/arena/, "L'Arena di Qir-Azel"],
  [/^piste\/pelle/, 'Sotto la pelle di Qir-Azel'],
  [/^piste\/rovine/, 'Le rovine dei Raschiatori'],
  [/^piste\/topi/, 'Topi in cantina'],
  [/^citta\//, 'La città viva'],
  [/^economia\//, 'Commerci e casa'],
  [/^storylet-oggetti/, 'Gli Averi'],
];
const gruppo = (file: string) => GRUPPI.find(([r]) => r.test(file))?.[1] ?? 'Altro';

export interface Pezzo {
  id: string;
  gruppo: string;
  storylet: string;
  titolo: string; // titolo della scena, o dell'esito
  tipo: 'scena' | 'esito';
  opzione?: string; // per gli esiti: il testo del pulsante che porta lì
  ramo?: string; // successo, fallimento, vittoria, sconfitta, esito
  testo: string; // il testo com'è nel gioco
  voce: string; // il testo preparato per ElevenLabs
  caratteri: number;
  impronta: string;
}

// ---------------------------------------------------------------- testo per la voce

const UNITA = ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'undici', 'dodici',
  'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove'];
const DECINE = ['', '', 'venti', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta', 'ottanta', 'novanta'];

/** Un intero in lettere, all'italiana (fino a 9999). */
export function inLettere(n: number): string {
  if (n < 20) return UNITA[n]!;
  if (n < 100) {
    const d = DECINE[Math.floor(n / 10)]!; const u = n % 10;
    if (u === 0) return d;
    return (u === 1 || u === 8 ? d.slice(0, -1) : d) + (u === 3 ? 'tré' : UNITA[u]);
  }
  if (n < 1000) {
    const c = Math.floor(n / 100); const r = n % 100;
    const cento = c === 1 ? 'cento' : `${UNITA[c]}cento`;
    if (r === 0) return cento;
    const resto = r === 3 ? 'tré' : inLettere(r);
    return resto.startsWith('ott') ? cento.slice(0, -1) + resto : cento + resto; // centotto, centottanta
  }
  const m = Math.floor(n / 1000); const r = n % 1000;
  const mille = m === 1 ? 'mille' : `${inLettere(m)}mila`;
  return r === 0 ? mille : mille + (r === 3 ? 'tré' : inLettere(r));
}

/**
 * Prepara un testo per ElevenLabs (Eleven v4). Niente tag SSML: le pause le danno i paragrafi, la punteggiatura e i
 * puntini; i tag audio fra quadre sono pochi e mirati.
 * - il pensiero del protagonista (*Frase intera.*) diventa un sussurro: [whispers] Frase intera.
 * - il resto del corsivo (scritte, insegne, parole straniere) resta testo semplice
 * - le scritte tutte maiuscole (per ElevenLabs il maiuscolo è enfasi) tornano minuscole, con l'iniziale
 * - le caporali «…» diventano virgolette “…”
 * - i numeri si scrivono in lettere
 */
export function perLaVoce(testo: string): string {
  return testo
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .map((p) => p
      .replace(/\*([^*]+?[.!?…])\*/g, '[whispers] $1')
      .replace(/\*([^*]+?)\*/g, '$1')
      .replace(/\b[A-ZÀ-Ý]{2,}(?:\s+[A-ZÀ-Ý]+)*\b/g, (m) => m.charAt(0) + m.slice(1).toLowerCase())
      .replace(/«\s*/g, '“').replace(/\s*»/g, '”')
      .replace(/\b\d{1,4}\b/g, (n) => inLettere(Number(n))))
    .join('\n\n');
}

// ---------------------------------------------------------------- pronunce

/** Nomi e luoghi riscritti per ElevenLabs (doppiaggio/pronuncia.yaml), a parola intera e i più lunghi prima. */
export const PRONUNCE: Record<string, string> = (() => {
  const f = join(RADICE, 'doppiaggio', 'pronuncia.yaml');
  return existsSync(f) ? (parse(readFileSync(f, 'utf8'))?.pronunce ?? {}) : {};
})();
const RE_PRONUNCE = (() => {
  const chiavi = Object.keys(PRONUNCE).sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return chiavi.length ? new RegExp(`(?<![\\p{L}'’])(${chiavi.join('|')})(?![\\p{L}'’])`, 'gu') : null;
})();
export function pronuncia(testo: string): string {
  const t = testo.replace(/’/g, "'");
  return RE_PRONUNCE ? t.replace(RE_PRONUNCE, (m) => PRONUNCE[m] ?? m) : t;
}

// ---------------------------------------------------------------- selezione

function fileDegliStorylet(): Map<string, string> {
  const out = new Map<string, string>();
  const giro = (d: string): string[] => readdirSync(d).sort().flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? giro(p) : /\.ya?ml$/.test(f) ? [p] : [];
  });
  for (const f of giro(CONTENUTI)) {
    const doc = parse(readFileSync(f, 'utf8')) as { storylet?: { id: string }[] } | null;
    for (const s of doc?.storylet ?? []) out.set(s.id, relative(CONTENUTI, f));
  }
  return out;
}

export function copione(): Pezzo[] {
  const { contenuti: c } = caricaContenuti({ tavole: false });
  const file = fileDegliStorylet();
  const penalita = new Set(c.aree.filter((a) => a.penalita).map((a) => a.id));
  const daDoppiare = (s: TStorylet) => ['fisso', 'seguito', 'prologo'].includes(s.tipo) && !s.ripetibile && !penalita.has(s.area)
    && !(file.get(s.id) ?? '').startsWith('crisi/') && s.id !== 'scelta-mutazione';
  const ordine = (s: TStorylet) => {
    const f = file.get(s.id) ?? '';
    return GRUPPI.findIndex(([r]) => r.test(f));
  };
  // l'ordine dei file e, dentro ogni file, quello in cui gli storylet sono scritti
  const indice = new Map([...file.keys()].map((id, i) => [id, i]));
  const scelti = c.storylet.filter(daDoppiare).sort((a, b) => ordine(a) - ordine(b) || indice.get(a.id)! - indice.get(b.id)!);

  const pezzi: Pezzo[] = [];
  const aggiungi = (p: Omit<Pezzo, 'voce' | 'caratteri' | 'impronta'>) => {
    const base = perLaVoce(p.testo);
    const voce = pronuncia(base);
    // l'impronta segue il testo della scena, non le pronunce: cambiare una pronuncia non rende "da rifare" i pezzi
    pezzi.push({ ...p, voce, caratteri: voce.length, impronta: createHash('sha1').update(base).digest('hex').slice(0, 10) });
  };
  for (const s of scelti) {
    const g = gruppo(file.get(s.id) ?? '');
    aggiungi({ id: s.id, gruppo: g, storylet: s.id, titolo: s.titolo, tipo: 'scena', testo: s.testo });
    s.opzioni.forEach((o, i) => {
      for (const ramo of ['successo', 'fallimento', 'vittoria', 'sconfitta', 'esito'] as const) {
        const e = o[ramo];
        if (!e) continue;
        aggiungi({ id: `${s.id}__${i + 1}-${ramo}`, gruppo: g, storylet: s.id, titolo: e.titolo ?? s.titolo, tipo: 'esito', opzione: o.testo, ramo, testo: e.testo });
      }
    });
  }
  return pezzi;
}

// ---------------------------------------------------------------- esecuzione diretta
if (import.meta.url === `file://${process.argv[1]}`) {
  const pezzi = copione();
  mkdirSync(USCITA, { recursive: true });
  writeFileSync(join(USCITA, 'copione.json'), `${JSON.stringify(pezzi, null, 1)}\n`);
  const md: string[] = ['# Copione per il doppiaggio', '', `Generato da \`npm run doppiaggio\`. ${pezzi.length} pezzi, ${pezzi.reduce((a, p) => a + p.caratteri, 0).toLocaleString('it-IT')} caratteri.`,
    'Ogni file audio si salva come `<id>.mp3`.', ''];
  let g = ''; let st = '';
  for (const p of pezzi) {
    if (p.gruppo !== g) { g = p.gruppo; md.push(`## ${g}`, ''); }
    if (p.storylet !== st) { st = p.storylet; md.push(`### ${p.titolo}`, ''); }
    md.push(`**\`${p.id}\`** · ${p.tipo === 'scena' ? 'scena' : `esito «${p.titolo}» · opzione «${p.opzione}» · ${p.ramo}`} · ${p.caratteri} caratteri`, '', p.voce.split('\n').map((r) => (r ? `> ${r}` : '>')).join('\n'), '');
  }
  writeFileSync(join(USCITA, 'copione.md'), md.join('\n'));
  const per = new Map<string, number>();
  for (const p of pezzi) per.set(p.gruppo, (per.get(p.gruppo) ?? 0) + 1);
  console.log(`${pezzi.length} pezzi, ${pezzi.reduce((a, p) => a + p.caratteri, 0)} caratteri`);
  // le voci già registrate su un testo che poi è cambiato
  const registro = join(USCITA, 'registrati.json');
  if (existsSync(registro)) {
    const reg = JSON.parse(readFileSync(registro, 'utf8')) as Record<string, string>;
    const attuali = new Map(pezzi.map((p) => [p.id, p.impronta]));
    const cambiati = Object.entries(reg).filter(([id, imp]) => attuali.get(id) !== imp).map(([id]) => id);
    console.log(`${Object.keys(reg).length} pezzi registrati${cambiati.length ? `, da riregistrare perché il testo è cambiato o non c'è più:\n  ${cambiati.join('\n  ')}` : ', tutti aggiornati.'}`);
  }
  for (const [k, v] of per) console.log(`  ${k}: ${v}`);
}
