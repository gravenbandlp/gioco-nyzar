// Stato del personaggio, requisiti, effetti, crescita, rintocchi e mazzo.
import {
  ATTRIBUTI, TUTTE_LE_ABILITA, attributoDi, SOGLIE_PE, QUOTA_ATTRIBUTO, MAX_GIOCATORE, NEGATIVE, MAX_NEGATIVA,
  REPUTAZIONE_MIN, REPUTAZIONE_MAX, RINTOCCHI_MAX, MINUTI_PER_RINTOCCO, CODA_MAX, MINUTI_PER_CARTA, MANO_MAX, NOMI, SCORTA_MAX, PESI_RARITA, TREGUA_INEVITABILI,
  GIORNI_TRA_RISTORI,
  type Attributo,
} from './regole';
import type { TContenuti, TEffetti, TOrigine, TStorylet } from './contenuto';
import type { Rng } from './dadi';
import { haProprieta, indossati, migraOggetti, penalita, repertiAttivi, valoreOggetti } from './oggetti';
import { mutazioniAbilita, mutazioneSchermata } from './crisi';
import { OVUNQUE } from './contenuto';
import type { PaginaDiario } from './diario';

/** L'aspetto del ritratto in pixel art (ui/ritratto): si sceglie alla creazione, o al primo ingresso per chi non l'ha. */
export interface AspettoPg { corpo?: string; pelle: string; capelli: string; coloreCapelli: string; barba: string; coloreBarba: string }

export interface Stato {
  versione: 1;
  nome: string;
  origine: string;
  aspetto?: AspettoPg;
  attributi: Record<Attributo, number>;
  abilita: Record<string, number>;
  pe: Record<string, number>; // PE accumulati verso il livello successivo (abilità e attributi)
  quality: Record<string, number>;
  rintocchi: number;
  rintocchiAl: number; // timestamp dell'ultimo aggiornamento
  coda: number; // carte in attesa di essere pescate
  codaAl: number;
  mano: string[]; // id delle carte in mano
  area: string;
  arma: string;
  armatura: string;
  repertorio: string[]; // incantesimi scelti per il combattimento (vuoto: scelta automatica)
  scudo: string; // '' se nessuno
  accessori: string[]; // al massimo 2
  animale?: string; // '' se nessuno: un cavallo, la lupa o il puma
  sospeso?: string; // seguito aperto da un esito e non ancora giocato
  sospesiPrima?: string[]; // seguiti rimasti in attesa sotto quello attuale: tornano in cima quando lo giochi
  diario?: PaginaDiario[]; // le pagine che il giocatore ha scelto di conservare
  tempo?: { totale: number; serie: Record<string, number>; ultimo?: number }; // ms di gioco (motore/tempo.ts)
  // spedizione in corso: le stanze già superate in questa visita e, per i seguiti aperti da una stanza,
  // la stanza da cui vengono (motore/spedizioni.ts). Si azzerano quando si esce.
  stanzePassate?: string[];
  seguitiDa?: Record<string, string>;
  zekarLaterali?: number[]; // le quattro laterali dell'ultima partita a Zekar, proposte alla successiva
  notati?: string[]; // le pagine «notate» già finite nel diario (motore/inquietudine.ts)
  notatoAl?: number; // ms di gioco dell'ultima pagina notata
  ristori?: Record<string, number>; // quando è stata pescata l'ultima volta ogni carta di ristoro (timestamp)
}

export function nuovoPersonaggio(nome: string, origine: TOrigine, ora: number, areaIniziale: string, aspetto?: AspettoPg): Stato {
  const s = creaStato(nome, origine, ora, areaIniziale);
  if (aspetto) s.aspetto = { ...aspetto };
  s.quality['prologo'] = 1; // prologo da giocare; i salvataggi di prima non lo hanno e lo saltano
  migraOggetti(s); // l'arma e l'armatura di partenza sono anche oggetti posseduti
  return s;
}

function creaStato(nome: string, origine: TOrigine, ora: number, areaIniziale: string): Stato {
  const abilita: Record<string, number> = {};
  for (const a of TUTTE_LE_ABILITA) abilita[a] = origine.abilita[a] ?? 0;
  const attributi = { fisico: 1, sociale: 1, mentale: 1, ...origine.attributi } as Record<Attributo, number>;
  return {
    versione: 1,
    nome,
    origine: origine.id,
    attributi,
    abilita,
    pe: {},
    quality: { ...origine.quality },
    rintocchi: RINTOCCHI_MAX,
    rintocchiAl: ora,
    coda: CODA_MAX,
    codaAl: ora,
    mano: [],
    area: areaIniziale,
    arma: origine.arma,
    armatura: origine.armatura,
    repertorio: [],
    scudo: '',
    accessori: [],
    animale: '',
  };
}

// ---------------------------------------------------------------- valori

export function valore(s: Stato, chiave: string, c?: TContenuti): number {
  if (chiave.startsWith('pe.')) return s.pe[chiave.slice(3)] ?? 0;
  if (chiave.startsWith('origine.')) return s.origine === chiave.slice(8) ? 1 : 0;
  if (c) { const v = valoreOggetti(s, c, chiave); if (v !== undefined) return v; }
  if ((ATTRIBUTI as readonly string[]).includes(chiave)) return s.attributi[chiave as Attributo];
  if (chiave in s.abilita) return s.abilita[chiave] ?? 0;
  if (chiave === 'rintocchi') return s.rintocchi;
  return s.quality[chiave] ?? 0;
}

/** Abilità al netto delle penalità di armatura e scudo, che valgono anche fuori dal combattimento (8.5). */
export function abilitaEffettiva(s: Stato, abilita: string, c: TContenuti): number {
  return Math.max(0, (s.abilita[abilita] ?? 0) + penalita(s, c, abilita) + mutazioniAbilita(s, c, abilita));
}

// ---------------------------------------------------------------- requisiti

const RX_REQ = /^\s*([a-z0-9][a-z0-9.-]*)\s*(>=|<=|==|!=|>|<)\s*(-?\d+(?:\.\d+)?)\s*$/;

export interface Requisito { chiave: string; op: string; n: number }

export function parseRequisito(r: string): Requisito {
  const m = RX_REQ.exec(r);
  if (!m) throw new Error(`Requisito non valido: "${r}" (formato: chiave >= numero)`);
  return { chiave: m[1]!, op: m[2]!, n: Number(m[3]) };
}

export function requisitoSoddisfatto(s: Stato, r: string, c?: TContenuti): boolean {
  const { chiave, op, n } = parseRequisito(r);
  const v = valore(s, chiave, c);
  switch (op) {
    case '>=': return v >= n;
    case '<=': return v <= n;
    case '>': return v > n;
    case '<': return v < n;
    case '==': return v === n;
    case '!=': return v !== n;
  }
  return false;
}

export function requisitiSoddisfatti(s: Stato, reqs: string[] | undefined, c?: TContenuti): boolean {
  return (reqs ?? []).every((r) => requisitoSoddisfatto(s, r, c));
}

export function requisitiMancanti(s: Stato, reqs: string[] | undefined, c?: TContenuti): string[] {
  return (reqs ?? []).filter((r) => !requisitoSoddisfatto(s, r, c));
}

// ---------------------------------------------------------------- effetti

export interface Variazione { chiave: string; prima: number; dopo: number }

function limita(chiave: string, v: number, contenuti: TContenuti): number {
  if ((NEGATIVE as readonly string[]).includes(chiave)) return Math.min(MAX_NEGATIVA, Math.max(0, v));
  const q = contenuti.quality.find((x) => x.id === chiave);
  if (q?.categoria === 'reputazione') return Math.min(REPUTAZIONE_MAX, Math.max(REPUTAZIONE_MIN, v));
  if (q?.categoria === 'consumabile') return Math.min(SCORTA_MAX, Math.max(0, v));
  return Math.max(0, v);
}

/** La scorta di un consumabile è piena: comprarne altro non serve. */
export function scortaPiena(s: Stato, chiave: string, c: TContenuti): boolean {
  return c.quality.find((x) => x.id === chiave)?.categoria === 'consumabile' && (s.quality[chiave] ?? 0) >= SCORTA_MAX;
}

/** I salvataggi di prima del tetto possono avere più consumabili del massimo: scendono al massimo. */
export function limitaScorte(s: Stato, c: TContenuti): void {
  for (const q of c.quality) if (q.categoria === 'consumabile' && (s.quality[q.id] ?? 0) > SCORTA_MAX) s.quality[q.id] = SCORTA_MAX;
}

/** Lucida dimezza il Tormento in arrivo, Schermata la Contaminazione; due fonti di Schermata la azzerano. */
function protezioni(s: Stato, chiave: string, delta: number, c: TContenuti): number {
  if (delta <= 0) return delta;
  const dimezza = (d: number) => Math.floor(d) / 2; // metà, al mezzo punto inferiore
  if (chiave === 'tormento' && haProprieta(s, c, 'lucida')) return dimezza(delta);
  if (chiave === 'contaminazione') {
    const fonti = [...indossati(s, c), ...repertiAttivi(s, c).filter((o) => o.reperto!.tipo === 'passivo')].filter((o) => o.proprieta.schermata).length
      + (mutazioneSchermata(s, c) ? 1 : 0);
    if (fonti >= 2) return 0;
    if (fonti === 1) return dimezza(delta);
  }
  return delta;
}

export function applicaEffetti(s: Stato, effetti: TEffetti | undefined, contenuti: TContenuti): Variazione[] {
  const out: Variazione[] = [];
  for (const [chiave, grezzo] of Object.entries(effetti ?? {})) {
    // le carte di ristoro ridanno rintocchi, mai oltre il tetto
    if (chiave === 'rintocchi') {
      const prima = s.rintocchi;
      s.rintocchi = Math.max(0, Math.min(RINTOCCHI_MAX, prima + grezzo));
      if (s.rintocchi !== prima) out.push({ chiave, prima, dopo: s.rintocchi });
      continue;
    }
    const delta = protezioni(s, chiave, grezzo, contenuti);
    const prima = s.quality[chiave] ?? 0;
    const dopo = limita(chiave, prima + delta, contenuti);
    s.quality[chiave] = dopo;
    if (dopo !== prima) out.push({ chiave, prima, dopo });
  }
  return out;
}

// ---------------------------------------------------------------- crescita

export interface Crescita { chiave: string; pe: number; nuovoLivello?: number }

function aggiungiPE(s: Stato, chiave: string, pe: number, livello: number, imposta: (l: number) => void): Crescita {
  const c: Crescita = { chiave, pe };
  if (livello >= MAX_GIOCATORE) return c;
  let accumulati = (s.pe[chiave] ?? 0) + pe;
  let l = livello;
  while (l < MAX_GIOCATORE && accumulati >= SOGLIE_PE[l]!) {
    accumulati -= SOGLIE_PE[l]!;
    l++;
  }
  s.pe[chiave] = l >= MAX_GIOCATORE ? 0 : accumulati;
  if (l !== livello) { imposta(l); c.nuovoLivello = l; }
  return c;
}

/** PE alla prova: all'abilità usata e un quarto al suo attributo (3.5). */
export function assegnaPE(s: Stato, abilita: string, pe: number): Crescita[] {
  const out = [aggiungiPE(s, abilita, pe, s.abilita[abilita] ?? 0, (l) => (s.abilita[abilita] = l))];
  const attr = attributoDi(abilita);
  out.push(aggiungiPE(s, attr, pe * QUOTA_ATTRIBUTO, s.attributi[attr], (l) => (s.attributi[attr] = l)));
  return out;
}

export function progressoPE(s: Stato, chiave: string): { pe: number; soglia: number } {
  const livello = valore(s, chiave);
  return { pe: s.pe[chiave] ?? 0, soglia: SOGLIE_PE[livello] ?? 0 };
}

// ---------------------------------------------------------------- rintocchi e mazzo

const MS_RINTOCCO = MINUTI_PER_RINTOCCO * 60_000;
const MS_CARTA = MINUTI_PER_CARTA * 60_000;

/** Porta al presente i salvataggi fatti prima di un cambio dei contenuti. */
function migra(s: Stato): void {
  // le candele sono diventate rintocchi (2 ottobre 2026): i salvataggi vecchi portano ancora i campi con il nome di prima
  const vecchio = s as Stato & { candele?: number; candeleAl?: number };
  if (vecchio.candele !== undefined) {
    s.rintocchi ??= vecchio.candele;
    s.rintocchiAl ??= vecchio.candeleAl ?? Date.now();
    delete vecchio.candele;
    delete vecchio.candeleAl;
  }
  if (s.rintocchi > RINTOCCHI_MAX) s.rintocchi = RINTOCCHI_MAX; // il tetto era più alto
  // l'assenza di Galdrick è diventata un flag (2 ottobre 2026): chi era già nel mezzo del viaggio lo riceve
  const q = s.quality;
  if (q['galdrick.via'] === undefined && (q['pista.tribu'] ?? 0) >= 4 && (q['pista.acciaio'] ?? 0) < 8) q['galdrick.via'] = 1;
}

export function aggiornaTempo(s: Stato, ora: number): void {
  migra(s);
  if (s.rintocchi >= RINTOCCHI_MAX) s.rintocchiAl = ora;
  else {
    const nuove = Math.floor((ora - s.rintocchiAl) / MS_RINTOCCO);
    if (nuove > 0) {
      s.rintocchi = Math.min(RINTOCCHI_MAX, s.rintocchi + nuove);
      s.rintocchiAl = s.rintocchi >= RINTOCCHI_MAX ? ora : s.rintocchiAl + nuove * MS_RINTOCCO;
    }
  }
  if (s.coda >= CODA_MAX) s.codaAl = ora;
  else {
    const nuove = Math.floor((ora - s.codaAl) / MS_CARTA);
    if (nuove > 0) {
      s.coda = Math.min(CODA_MAX, s.coda + nuove);
      s.codaAl = s.coda >= CODA_MAX ? ora : s.codaAl + nuove * MS_CARTA;
    }
  }
}

export function msAlProssimoRintocco(s: Stato, ora: number): number | null {
  if (s.rintocchi >= RINTOCCHI_MAX) return null;
  return Math.max(0, s.rintocchiAl + MS_RINTOCCO - ora);
}

export function msAllaProssimaCarta(s: Stato, ora: number): number | null {
  if (s.coda >= CODA_MAX) return null;
  return Math.max(0, s.codaAl + MS_CARTA - ora);
}

export function spendiRintocchi(s: Stato, n: number, ora: number): boolean {
  aggiornaTempo(s, ora);
  if (s.rintocchi < n) return false;
  if (s.rintocchi >= RINTOCCHI_MAX) s.rintocchiAl = ora; // il timer riparte dal primo consumo
  s.rintocchi -= n;
  return true;
}

export function storyletDisponibili(s: Stato, c: TContenuti): TStorylet[] {
  // uno storylet presso un luogo che non si vede (requisiti del luogo non soddisfatti) non è disponibile
  const chiuso = (id?: string) => {
    if (!id) return false;
    const l = c.luoghi.find((x) => x.id === id);
    return !!l && !requisitiSoddisfatti(s, l.requisiti, c);
  };
  return c.storylet.filter((st) => st.area === s.area && st.tipo === 'fisso' && !chiuso(st.presso) && requisitiSoddisfatti(s, st.requisiti, c));
}

const ristoriDi = new WeakMap<TContenuti, Set<string>>();
/** Le carte di ristoro: quelle con un esito che ridà rintocchi. */
export function carteDiRistoro(c: TContenuti): Set<string> {
  let r = ristoriDi.get(c);
  if (!r) {
    const esiti = (st: TStorylet) => st.opzioni.flatMap((o) => [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta]);
    r = new Set(c.storylet.filter((st) => st.tipo === 'carta' && esiti(st).some((e) => (e?.effetti?.['rintocchi'] ?? 0) > 0)).map((st) => st.id));
    ristoriDi.set(c, r);
  }
  return r;
}

const MS_TRA_RISTORI = GIORNI_TRA_RISTORI * 24 * 60 * 60_000;

/** Con l'ora, una carta di ristoro pescata da meno di GIORNI_TRA_RISTORI giorni non torna nel mazzo. */
export function cartePescabili(s: Stato, c: TContenuti, ora?: number): TStorylet[] {
  // le carte "ovunque" valgono in città: non nelle aree di penalità, nelle spedizioni o fuori città
  const qui = c.aree.find((a) => a.id === s.area);
  const chiusa = !!qui && (qui.penalita || !!qui.spedizione || qui.fuori);
  const tregua = (s.quality[TREGUA] ?? 0) > 0;
  const ristori = carteDiRistoro(c);
  const recente = (id: string) => ora !== undefined && ristori.has(id) && ora - (s.ristori?.[id] ?? -Infinity) < MS_TRA_RISTORI;
  return c.storylet.filter(
    (st) => st.tipo === 'carta' && (st.area === s.area || (st.area === OVUNQUE && !chiusa)) && !s.mano.includes(st.id)
      && !(tregua && st.inevitabile) && !recente(st.id) && requisitiSoddisfatti(s, st.requisiti, c),
  );
}

/** Quante pescate mancano prima che possa arrivare un'altra carta inevitabile. */
export const TREGUA = 'tregua.inevitabili';

/** Pesca pesata con la rarità: comune 3, insolita 2, rara 1. */
function scegliCarta(mazzo: TStorylet[], rng: Rng): TStorylet {
  const peso = (st: TStorylet) => PESI_RARITA[st.rarita ?? 'comune'];
  let x = rng() * mazzo.reduce((t, st) => t + peso(st), 0);
  for (const st of mazzo) { x -= peso(st); if (x < 0) return st; }
  return mazzo[mazzo.length - 1]!;
}

/** Pesca una carta dalla coda nella mano. Restituisce l'id pescato o null. */
export function pesca(s: Stato, c: TContenuti, ora: number, rng: Rng = Math.random): string | null {
  aggiornaTempo(s, ora);
  if (s.coda <= 0 || s.mano.length >= MANO_MAX) return null;
  const mazzo = cartePescabili(s, c, ora);
  if (mazzo.length === 0) return null;
  const carta = scegliCarta(mazzo, rng);
  if (carteDiRistoro(c).has(carta.id)) s.ristori = { ...s.ristori, [carta.id]: ora };
  if ((s.quality[TREGUA] ?? 0) > 0) s.quality[TREGUA] = s.quality[TREGUA]! - 1;
  if (carta.inevitabile) s.quality[TREGUA] = TREGUA_INEVITABILI;
  if (s.coda >= CODA_MAX) s.codaAl = ora;
  s.coda -= 1;
  s.mano.push(carta.id);
  return carta.id;
}

export function scarta(s: Stato, id: string): void {
  s.mano = s.mano.filter((x) => x !== id);
}

// ---------------------------------------------------------------- presentazione

export function nomeDi(chiave: string, c: TContenuti): string {
  return NOMI[chiave] ?? c.quality.find((q) => q.id === chiave)?.nome ?? chiave;
}
