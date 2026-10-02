// Stato del personaggio, requisiti, effetti, crescita, candele e mazzo.
import {
  ATTRIBUTI, TUTTE_LE_ABILITA, attributoDi, SOGLIE_PE, QUOTA_ATTRIBUTO, MAX_GIOCATORE, NEGATIVE, MAX_NEGATIVA,
  REPUTAZIONE_MIN, REPUTAZIONE_MAX, CANDELE_MAX, MINUTI_PER_CANDELA, CODA_MAX, MINUTI_PER_CARTA, MANO_MAX, NOMI,
  type Attributo,
} from './regole';
import type { TContenuti, TEffetti, TOrigine, TStorylet } from './contenuto';
import type { Rng } from './dadi';
import { haProprieta, indossati, migraOggetti, penalita, repertiAttivi, valoreOggetti } from './oggetti';
import { mutazioniAbilita, mutazioneSchermata } from './crisi';
import { OVUNQUE } from './contenuto';
import type { PaginaDiario } from './diario';

export interface Stato {
  versione: 1;
  nome: string;
  origine: string;
  attributi: Record<Attributo, number>;
  abilita: Record<string, number>;
  pe: Record<string, number>; // PE accumulati verso il livello successivo (abilità e attributi)
  quality: Record<string, number>;
  candele: number;
  candeleAl: number; // timestamp dell'ultimo aggiornamento
  coda: number; // carte in attesa di essere pescate
  codaAl: number;
  mano: string[]; // id delle carte in mano
  area: string;
  arma: string;
  armatura: string;
  repertorio: string[]; // incantesimi scelti per il combattimento (vuoto: scelta automatica)
  scudo: string; // '' se nessuno
  accessori: string[]; // al massimo 2
  sospeso?: string; // seguito aperto da un esito e non ancora giocato
  sospesiPrima?: string[]; // seguiti rimasti in attesa sotto quello attuale: tornano in cima quando lo giochi
  diario?: PaginaDiario[]; // le pagine che il giocatore ha scelto di conservare
  tempo?: { totale: number; serie: Record<string, number>; ultimo?: number }; // ms di gioco (motore/tempo.ts)
}

export function nuovoPersonaggio(nome: string, origine: TOrigine, ora: number, areaIniziale: string): Stato {
  const s = creaStato(nome, origine, ora, areaIniziale);
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
    candele: CANDELE_MAX,
    candeleAl: ora,
    coda: CODA_MAX,
    codaAl: ora,
    mano: [],
    area: areaIniziale,
    arma: origine.arma,
    armatura: origine.armatura,
    repertorio: [],
    scudo: '',
    accessori: [],
  };
}

// ---------------------------------------------------------------- valori

export function valore(s: Stato, chiave: string, c?: TContenuti): number {
  if (chiave.startsWith('pe.')) return s.pe[chiave.slice(3)] ?? 0;
  if (chiave.startsWith('origine.')) return s.origine === chiave.slice(8) ? 1 : 0;
  if (c) { const v = valoreOggetti(s, c, chiave); if (v !== undefined) return v; }
  if ((ATTRIBUTI as readonly string[]).includes(chiave)) return s.attributi[chiave as Attributo];
  if (chiave in s.abilita) return s.abilita[chiave] ?? 0;
  if (chiave === 'candele') return s.candele;
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
  return Math.max(0, v);
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

// ---------------------------------------------------------------- candele e mazzo

const MS_CANDELA = MINUTI_PER_CANDELA * 60_000;
const MS_CARTA = MINUTI_PER_CARTA * 60_000;

/** Porta al presente i salvataggi fatti prima di un cambio dei contenuti. */
function migra(s: Stato): void {
  if (s.candele > CANDELE_MAX) s.candele = CANDELE_MAX; // il tetto era più alto
  // l'assenza di Galdrick è diventata un flag (2 ottobre 2026): chi era già nel mezzo del viaggio lo riceve
  const q = s.quality;
  if (q['galdrick.via'] === undefined && (q['pista.tribu'] ?? 0) >= 4 && (q['pista.acciaio'] ?? 0) < 8) q['galdrick.via'] = 1;
}

export function aggiornaTempo(s: Stato, ora: number): void {
  migra(s);
  if (s.candele >= CANDELE_MAX) s.candeleAl = ora;
  else {
    const nuove = Math.floor((ora - s.candeleAl) / MS_CANDELA);
    if (nuove > 0) {
      s.candele = Math.min(CANDELE_MAX, s.candele + nuove);
      s.candeleAl = s.candele >= CANDELE_MAX ? ora : s.candeleAl + nuove * MS_CANDELA;
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

export function msAllaProssimaCandela(s: Stato, ora: number): number | null {
  if (s.candele >= CANDELE_MAX) return null;
  return Math.max(0, s.candeleAl + MS_CANDELA - ora);
}

export function msAllaProssimaCarta(s: Stato, ora: number): number | null {
  if (s.coda >= CODA_MAX) return null;
  return Math.max(0, s.codaAl + MS_CARTA - ora);
}

export function spendiCandele(s: Stato, n: number, ora: number): boolean {
  aggiornaTempo(s, ora);
  if (s.candele < n) return false;
  if (s.candele >= CANDELE_MAX) s.candeleAl = ora; // il timer riparte dal primo consumo
  s.candele -= n;
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

export function cartePescabili(s: Stato, c: TContenuti): TStorylet[] {
  // le carte "ovunque" valgono in città: non nelle aree di penalità né nelle spedizioni
  const qui = c.aree.find((a) => a.id === s.area);
  const chiusa = !!qui && (qui.penalita || !!qui.spedizione);
  return c.storylet.filter(
    (st) => st.tipo === 'carta' && (st.area === s.area || (st.area === OVUNQUE && !chiusa)) && !s.mano.includes(st.id)
      && requisitiSoddisfatti(s, st.requisiti, c),
  );
}

/** Pesca una carta dalla coda nella mano. Restituisce l'id pescato o null. */
export function pesca(s: Stato, c: TContenuti, ora: number, rng: Rng = Math.random): string | null {
  aggiornaTempo(s, ora);
  if (s.coda <= 0 || s.mano.length >= MANO_MAX) return null;
  const mazzo = cartePescabili(s, c);
  if (mazzo.length === 0) return null;
  const carta = mazzo[Math.floor(rng() * mazzo.length)]!;
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
