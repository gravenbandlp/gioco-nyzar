// Zekar, il gioco di carte dei tavoli di Qir-Azel (regolamento di Luca, ottobre 2026; Codex, «Zekar di Qir-Azel»).
// Due giocatori pescano a turno dal mazzo comune (carte da 1 a 10) e cercano di avvicinarsi a 20 senza superarlo.
// Ognuno ha quattro carte laterali (da −5 a +5) scelte prima della partita, che valgono per tutta la partita e si
// consumano. Vince la partita chi vince per primo tre round.
//
// Scelte del motore dove il regolamento lascia spazio:
// - il mazzo principale ha quattro copie di ogni carta e si rimescola a ogni round;
// - le quattro laterali sono valori diversi fra loro;
// - si sballa a fine turno: dopo la pesca una laterale negativa può ancora riportarti sotto 20;
// - in un turno si usa al massimo una laterale;
// - se l'avversario sta e tu lo superi senza sballare, vinci subito il round;
// - il primo round lo apre chi esce a sorte, poi si alterna.
import { rngConSeme, type Rng } from './dadi';

export const OBIETTIVO = 20;
export const ROUND_PER_VINCERE = 3;
export const LATERALI = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
export const LATERALI_IN_MANO = 4;
export const LATERALI_PREDEFINITE = [-3, -2, 2, 3];

export interface Avversario {
  id: string;
  nome: string;
  immagine?: string;
  descrizione?: string;
  laterali: number[];
  soglia: number; // sta quando arriva qui e l'altro non sta ancora
  mira: number; // usa una laterale se lo porta almeno a questo totale (fra mira e 20)
}

export interface Carta { v: number; laterale?: boolean }
export interface Giocatore { totale: number; carte: Carta[]; laterali: number[]; sta: boolean; vinti: number }

/** Quello che si vede del tavolo in un momento: serve all'interfaccia per mettere in scena gli eventi uno alla volta. */
export interface Foto { g: [Giocatore, Giocatore]; turno: 0 | 1; round: number; mazzo: number }

export interface EventoZekar {
  tipo: 'pesca' | 'laterale' | 'passa' | 'sta' | 'sballa' | 'round' | 'pareggio' | 'partita' | 'inizio';
  chi: 0 | 1; // 0 sei tu
  valore?: number;
  foto: Foto;
}

export interface StatoZekar {
  avversario: Avversario;
  fase: 'scelta' | 'gioco' | 'finita';
  mazzo: number[];
  g: [Giocatore, Giocatore];
  turno: 0 | 1;
  apre: 0 | 1; // chi ha aperto il round in corso
  round: number;
  lateraleUsata: boolean; // nel turno in corso
  vinto: boolean;
  eventi: EventoZekar[];
  muto?: boolean; // nel simulatore gli eventi non servono
}

const giocatore = (laterali: number[]): Giocatore => ({ totale: 0, carte: [], laterali: [...laterali], sta: false, vinti: 0 });
const altro = (p: 0 | 1): 0 | 1 => (p === 0 ? 1 : 0);

function mescola(rng: Rng): number[] {
  const m: number[] = [];
  for (let v = 1; v <= 10; v++) for (let k = 0; k < 4; k++) m.push(v);
  for (let i = m.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [m[i], m[j]] = [m[j]!, m[i]!]; }
  return m;
}

/** Le quattro laterali sono valide se sono quattro valori diversi fra −5 e +5, zero escluso. */
export function lateraliValide(l: number[]): boolean {
  return l.length === LATERALI_IN_MANO && new Set(l).size === l.length && l.every((v) => LATERALI.includes(v));
}

function foto(zs: StatoZekar): Foto {
  return { g: structuredClone(zs.g), turno: zs.turno, round: zs.round, mazzo: zs.mazzo.length };
}
function annota(zs: StatoZekar, tipo: EventoZekar['tipo'], chi: 0 | 1, valore?: number): void {
  if (zs.muto) return;
  zs.eventi.push({ tipo, chi, ...(valore !== undefined ? { valore } : {}), foto: foto(zs) });
}

/** La partita si apre con la scelta delle laterali; le carte si distribuiscono con `siediti`. */
export function nuovaPartita(avversario: Avversario): StatoZekar {
  return {
    avversario, fase: 'scelta', mazzo: [], g: [giocatore([]), giocatore(avversario.laterali)], turno: 0, apre: 0,
    round: 0, lateraleUsata: false, vinto: false, eventi: [],
  };
}

export function siediti(zs: StatoZekar, laterali: number[], rng: Rng = Math.random): void {
  if (zs.fase !== 'scelta' || !lateraliValide(laterali)) return;
  zs.g[0] = giocatore([...laterali].sort((a, b) => a - b));
  zs.fase = 'gioco';
  zs.apre = rng() < 0.5 ? 0 : 1;
  nuovoRound(zs, zs.apre, rng);
}

function nuovoRound(zs: StatoZekar, apre: 0 | 1, rng: Rng, ripeti = false): void {
  if (!ripeti) zs.round++;
  zs.mazzo = mescola(rng);
  for (const g of zs.g) { g.totale = 0; g.carte = []; g.sta = false; }
  zs.apre = apre;
  annota(zs, 'inizio', apre);
  iniziaTurno(zs, apre, rng);
}

function iniziaTurno(zs: StatoZekar, p: 0 | 1, rng: Rng): void {
  zs.turno = p;
  zs.lateraleUsata = false;
  if (!zs.mazzo.length) zs.mazzo = mescola(rng);
  const v = zs.mazzo.pop()!;
  const g = zs.g[p];
  g.carte.push({ v });
  g.totale += v;
  annota(zs, 'pesca', p, v);
  if (sorpasso(zs, p, rng)) return;
  if (p === 1) giocaAvversario(zs, rng);
}

/** Se l'altro sta e tu lo superi senza sballare, il round è tuo. */
function sorpasso(zs: StatoZekar, p: 0 | 1, rng: Rng): boolean {
  const io = zs.g[p], lui = zs.g[altro(p)];
  if (lui.sta && io.totale > lui.totale && io.totale <= OBIETTIVO) { chiudiRound(zs, p, rng); return true; }
  return false;
}

function chiudiRound(zs: StatoZekar, vincitore: 0 | 1 | null, rng: Rng): void {
  if (vincitore === null) {
    annota(zs, 'pareggio', zs.turno);
    nuovoRound(zs, altro(zs.apre), rng, true); // il round pari si rigioca con lo stesso numero
    return;
  }
  zs.g[vincitore].vinti++;
  annota(zs, 'round', vincitore);
  if (zs.g[vincitore].vinti >= ROUND_PER_VINCERE) {
    zs.fase = 'finita';
    zs.vinto = vincitore === 0;
    annota(zs, 'partita', vincitore);
    return;
  }
  nuovoRound(zs, altro(zs.apre), rng);
}

function fineTurno(zs: StatoZekar, p: 0 | 1, sta: boolean, rng: Rng): void {
  const io = zs.g[p], lui = zs.g[altro(p)];
  if (io.totale > OBIETTIVO) { annota(zs, 'sballa', p); chiudiRound(zs, altro(p), rng); return; }
  if (sta) { io.sta = true; annota(zs, 'sta', p); } else annota(zs, 'passa', p);
  if (io.sta && lui.sta) {
    chiudiRound(zs, io.totale === lui.totale ? null : io.totale > lui.totale ? p : altro(p), rng);
    return;
  }
  // chi sta non pesca più: se l'altro sta già, continui tu
  iniziaTurno(zs, lui.sta ? p : altro(p), rng);
}

function usaLaterale(zs: StatoZekar, p: 0 | 1, i: number, rng: Rng): boolean {
  const g = zs.g[p];
  const v = g.laterali[i];
  if (v === undefined || zs.lateraleUsata || zs.turno !== p) return false;
  g.laterali.splice(i, 1);
  g.carte.push({ v, laterale: true });
  g.totale += v;
  zs.lateraleUsata = true;
  annota(zs, 'laterale', p, v);
  sorpasso(zs, p, rng);
  return true;
}

// ---------------------------------------------------------------- le tue mosse

export type Mossa = { tipo: 'laterale'; indice: number } | { tipo: 'passa' } | { tipo: 'stai' };

/** Applica la tua mossa e lascia giocare l'avversario finché non tocca di nuovo a te o la partita finisce. */
export function muovi(zs: StatoZekar, m: Mossa, rng: Rng = Math.random): boolean {
  if (zs.fase !== 'gioco' || zs.turno !== 0) return false;
  if (m.tipo === 'laterale') return usaLaterale(zs, 0, m.indice, rng);
  fineTurno(zs, 0, m.tipo === 'stai', rng);
  return true;
}

// ---------------------------------------------------------------- l'avversario

/** La laterale che porta il totale nella fascia [min, max] il più in alto possibile, o -1. */
function lateraleVerso(g: Giocatore, min: number, max: number): number {
  let migliore = -1;
  g.laterali.forEach((v, i) => {
    const t = g.totale + v;
    if (t >= min && t <= max && (migliore < 0 || t > g.totale + g.laterali[migliore]!)) migliore = i;
  });
  return migliore;
}

/** Cosa farebbe un giocatore con queste regole di condotta: è anche la strategia del simulatore per te. */
function decidi(zs: StatoZekar, p: 0 | 1, cfg: { soglia: number; mira: number }): Mossa {
  const io = zs.g[p], lui = zs.g[altro(p)];
  if (!zs.lateraleUsata) {
    let i = -1;
    if (io.totale > OBIETTIVO) i = lateraleVerso(io, 0, OBIETTIVO); // salvarsi
    else if (lui.sta && io.totale <= lui.totale) i = lateraleVerso(io, lui.totale + 1, OBIETTIVO); // superarlo
    else if (!lui.sta && io.totale < cfg.mira) i = lateraleVerso(io, cfg.mira, OBIETTIVO); // chiudere in alto
    if (i >= 0) return { tipo: 'laterale', indice: i };
  }
  if (io.totale > OBIETTIVO) return { tipo: 'passa' }; // sballa
  if (lui.sta) {
    if (io.totale > lui.totale) return { tipo: 'stai' };
    if (io.totale === lui.totale) return { tipo: io.totale >= cfg.soglia ? 'stai' : 'passa' }; // il pari si rigioca
    return { tipo: 'passa' };
  }
  return { tipo: io.totale >= cfg.soglia ? 'stai' : 'passa' };
}

function giocaAvversario(zs: StatoZekar, rng: Rng): void {
  const roundPrima = zs.round, vinti = zs.g[0].vinti + zs.g[1].vinti;
  const cambiato = () => zs.round !== roundPrima || zs.g[0].vinti + zs.g[1].vinti !== vinti || zs.fase !== 'gioco';
  for (let passi = 0; passi < 3; passi++) {
    const m = decidi(zs, 1, zs.avversario);
    if (m.tipo === 'laterale') { usaLaterale(zs, 1, m.indice, rng); if (cambiato()) return; continue; }
    fineTurno(zs, 1, m.tipo === 'stai', rng);
    return;
  }
}

// ---------------------------------------------------------------- simulatore

/** Probabilità di vincere la partita contro un avversario giocando con buon senso, con le laterali date. */
export function probabilitaZekar(avv: Avversario, laterali: number[] = LATERALI_PREDEFINITE, prove = 1500, seme = 7): number {
  const rng = rngConSeme(seme);
  const io = { soglia: 17, mira: 19 };
  let vinte = 0;
  for (let k = 0; k < prove; k++) {
    const zs = nuovaPartita(avv);
    zs.muto = true;
    siediti(zs, laterali, rng);
    for (let passi = 0; zs.fase === 'gioco' && passi < 500; passi++) muovi(zs, decidi(zs, 0, io), rng);
    if (zs.vinto) vinte++;
  }
  return vinte / prove;
}
