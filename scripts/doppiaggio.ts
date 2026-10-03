// Il copione per il doppiaggio: le scene dei prologhi e delle dieci storie principali (quelle a passi, con una pista in
// «Le tue storie»), con i loro esiti, pronte da incollare in ElevenLabs. Il resto non si doppia: la città viva, le
// occasioni, le azioni ripetibili, le crisi, le aree di penalità, commerci e averi.
// Una scena è nel copione se è un prologo, se sta in un file di piste/ di una storia principale (stanze di spedizione
// comprese) o se fa avanzare una di quelle piste da un altro file (per esempio i passi in Città Bassa della Dama).
//
// Ogni pezzo ha un id stabile, che diventa il nome del file audio:
//   <storylet>                 la scena
//   <storylet>__<n>-<esito>    l'esito dell'opzione n (da 1), esito = successo | fallimento | vittoria | sconfitta | esito
// e un'impronta del testo e della sua regia: se l'una o l'altra cambia dopo la registrazione, il pezzo è da rifare.
//
// La regia (doppiaggio/regia/*.yaml) è il testo per la voce con i tag di ElevenLabs (emozioni, toni, respiri, effetti
// sonori fra quadre): si scrive a parte, così i testi del gioco non cambiano. Toglie i tag e deve ridare parola per parola
// il testo della scena; se la scena cambia, la regia di quel pezzo è superata e il copione torna al testo semplice.
// Le regole della regia sono in doppiaggio/regia.md.
//
// Uso: npm run doppiaggio   →  doppiaggio/copione.json e doppiaggio/copione.md
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse } from 'yaml';
import { caricaContenuti } from './build-contenuti';
import type { TStorylet } from '../src/motore/contenuto';

const RADICE = fileURLToPath(new URL('..', import.meta.url));
const CONTENUTI = join(RADICE, 'contenuti');
const USCITA = join(RADICE, 'doppiaggio');
const REGIA = join(USCITA, 'regia');

/** Le dieci storie principali: la chiave della pista (pista.<chiave>, file piste/<chiave>*.yaml) e il nome, in ordine di gioco. */
export const STORIE: [string, string][] = [
  ['dama-argento', "La Dama d'Argento"],
  ['acciaio', 'Acciaio e Ira'],
  ['sepolcro', 'Il Sepolcro violato'],
  ['corin', 'La caccia di Corin'],
  ['teatro', "La Promessa dell'Arpia"],
  ['registro', 'Il registro del custode'],
  ['tribu', 'Le cinque tribù'],
  ['arena', "L'Arena di Qir-Azel"],
  ['capomozzo', 'Capomozzo'],
  ['pelle', 'Sotto la pelle di Qir-Azel'],
];
const PROLOGHI = 'I prologhi';
const GRUPPI = [PROLOGHI, ...STORIE.map(([, n]) => n)];

/** La storia principale di una scena, dal file o dalla pista che fa avanzare; null se non è da doppiare. */
function gruppoDi(s: TStorylet, file: string): string | null {
  if (s.tipo === 'prologo' || file.startsWith('prologo/')) return PROLOGHI;
  const daFile = STORIE.find(([k]) => file.startsWith(`piste/${k}`));
  if (daFile) return daFile[1];
  const opz = JSON.stringify(s.opzioni);
  return STORIE.find(([k]) => opz.includes(`"pista.${k}":`))?.[1] ?? null;
}

export interface Pezzo {
  id: string;
  gruppo: string;
  storylet: string;
  titolo: string; // titolo della scena, o dell'esito
  tipo: 'scena' | 'esito';
  opzione?: string; // per gli esiti: il testo del pulsante che porta lì
  ramo?: string; // successo, fallimento, vittoria, sconfitta, esito
  testo: string; // il testo com'è nel gioco
  base: string; // il testo per la voce senza regia (numeri in lettere, pensieri sussurrati), prima delle pronunce
  voce: string; // il testo da incollare in ElevenLabs: la regia se c'è ed è aggiornata, con le pronunce
  regia: 'fatta' | 'mancante' | 'superata';
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

// ---------------------------------------------------------------- regia

/** I tag della regia: [qualcosa] fra quadre. */
export const RE_TAG = /\[[^\]\n]+\]/g;
/** Spazi normalizzati: uno solo fra le parole, nessuno attorno agli a capo. */
const normale = (t: string): string => t.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
/** Il testo di una regia senza tag, a spazi normalizzati: deve coincidere con la base del pezzo. */
export const senzaTag = (t: string): string => normale(t.replace(RE_TAG, ' ')).replace(/ ([,.;:!?…])/g, '$1');

/** La regia di ogni pezzo: id → testo con i tag (doppiaggio/regia/*.yaml, una chiave per pezzo). */
export function leggiRegia(): Map<string, string> {
  const out = new Map<string, string>();
  if (!existsSync(REGIA)) return out;
  for (const f of readdirSync(REGIA).filter((x) => /\.ya?ml$/.test(x)).sort()) {
    const doc = parse(readFileSync(join(REGIA, f), 'utf8')) as { regia?: Record<string, string> } | null;
    for (const [id, voce] of Object.entries(doc?.regia ?? {})) out.set(id, String(voce).trim());
  }
  return out;
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
    // percorsi con la barra dritta anche su Windows: i gruppi si riconoscono dal percorso
    for (const s of doc?.storylet ?? []) out.set(s.id, relative(CONTENUTI, f).split(sep).join('/'));
  }
  return out;
}

export function copione(): Pezzo[] {
  const { contenuti: c } = caricaContenuti({ tavole: false });
  const file = fileDegliStorylet();
  const regia = leggiRegia();
  const penalita = new Set(c.aree.filter((a) => a.penalita).map((a) => a.id));
  const candidato = (s: TStorylet) => ['fisso', 'seguito', 'prologo'].includes(s.tipo) && !s.ripetibile && !penalita.has(s.area)
    && !(file.get(s.id) ?? '').startsWith('crisi/') && s.id !== 'scelta-mutazione';
  // l'ordine delle storie e, dentro ogni storia, quello dei file e degli storylet come sono scritti
  const indice = new Map([...file.keys()].map((id, i) => [id, i]));
  const scelti = c.storylet
    .filter(candidato)
    .map((s) => ({ s, g: gruppoDi(s, file.get(s.id) ?? '') }))
    .filter((x): x is { s: TStorylet; g: string } => x.g !== null)
    .sort((a, b) => GRUPPI.indexOf(a.g) - GRUPPI.indexOf(b.g) || indice.get(a.s.id)! - indice.get(b.s.id)!);

  const pezzi: Pezzo[] = [];
  const aggiungi = (p: Omit<Pezzo, 'base' | 'voce' | 'regia' | 'caratteri' | 'impronta'>) => {
    const base = perLaVoce(p.testo);
    const r = regia.get(p.id);
    // la base ha già il sussurro dei pensieri: si confrontano le parole, senza tag da nessuna delle due parti
    const stato: Pezzo['regia'] = !r ? 'mancante' : senzaTag(r) === senzaTag(base) ? 'fatta' : 'superata';
    const voce = pronuncia(stato === 'fatta' ? r! : base);
    // l'impronta segue il testo della scena e la sua regia, non le pronunce: cambiare una pronuncia non rende da rifare
    const impronta = createHash('sha1').update(stato === 'fatta' ? `${base}\n§regia§\n${r}` : base).digest('hex').slice(0, 10);
    pezzi.push({ ...p, base, voce, regia: stato, caratteri: voce.length, impronta });
  };
  for (const { s, g } of scelti) {
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
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
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
  const conta = (r: Pezzo['regia']) => pezzi.filter((p) => p.regia === r).length;
  console.log(`regia: ${conta('fatta')} fatte, ${conta('mancante')} mancanti, ${conta('superata')} superate (la scena è cambiata)`);
  for (const p of pezzi.filter((x) => x.regia === 'superata')) console.log(`  regia superata: ${p.id}`);
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
