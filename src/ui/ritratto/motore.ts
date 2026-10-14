// Il ritratto del personaggio in pixel art, disegnato tutto da codice: nessuna immagine, nessuna IA.
// Ogni pezzo è una forma (righe di pixel [y, x0, x1]) con un materiale; il motore le dà il tono secondo la luce
// fredda che viene dall'alto a sinistra, le fa proiettare un'ombra a destra e sotto, e alla fine traccia il
// contorno del colore del materiale. La figura sta in 48×72 pixel; con un compagno la tela si allarga a destra.
// Cosa disegnare per ogni oggetto del gioco lo decide aspetti.ts.
import { RAMPE, PELLI, CHIOME, EMISSIVI, type Rampa } from './tavolozza';

export const ALTEZZA = 72;
export const LARGHEZZA = 48;
export const LARGHEZZA_COMPAGNO = 84;

export const TAGLI = ['rasati', 'corti', 'arruffati', 'lunghi', 'raccolti'] as const;
export const BARBE = ['nessuna', 'ispida', 'baffi', 'corta', 'lunga'] as const;
export const CORPI = ['maschile', 'femminile'] as const;
export type Taglio = (typeof TAGLI)[number];
export type Barba = (typeof BARBE)[number];
export type Corpo = (typeof CORPI)[number];

export interface Aspetto {
  /** Senza, maschile: i salvataggi di prima della scelta. */
  corpo?: Corpo;
  pelle: string;
  capelli: Taglio;
  coloreCapelli: string;
  barba: Barba;
  coloreBarba: string;
}

export type FormaArma =
  | 'mani' | 'tirapugni' | 'pugnale' | 'stiletto' | 'spillone' | 'coltelloCurvo' | 'spadaCorta' | 'sciabola' | 'bastoneAnimato'
  | 'spada' | 'spadaCurva' | 'spadone' | 'lancia' | 'mazza' | 'bastone' | 'verga' | 'ascia' | 'piccozza' | 'bipenne' | 'falce'
  | 'martello' | 'arcoCorto' | 'arcoLungo' | 'balestra' | 'fionda' | 'coltelli' | 'roncola';

export interface VisArma {
  forma: FormaArma;
  /** Varianti di forma: per la lancia la punta, per la mazza le borchie, per il martello la testa, ecc. */
  variante?: string;
  lama?: string; manico?: string; elsa?: string; pomo?: string; testa?: string; impugnatura?: string;
  /** Il colore di un dettaglio: cristalli, rune, incisioni, linfa. */
  dettaglio?: string;
}

export interface VisArmatura {
  forma: 'strada' | 'giaco' | 'cuoio' | 'maglia' | 'piastre';
  corpo?: string;
  sotto?: string;
  borchie?: string | null;
  /** Falde lunghe fino al ginocchio: cappe, soprabiti, pellicce. */
  lungo?: boolean;
  /** Collo di pelo, o tutta la giubba di pelo se `pelliccia`. */
  pelo?: string;
  pelliccia?: boolean;
  muschio?: boolean;
  brigantina?: boolean;
  /** Emblema sul petto: bilance, torre, nodo, spirale, cerchio. */
  stemma?: { forma: 'bilance' | 'torre' | 'spirale' | 'cerchio'; mat: string };
  /** Anelli di un altro metallo: sulle spalle, o a zig-zag sul petto. */
  anelli?: { dove: 'spalle' | 'zigzag'; mat: string };
  irregolare?: boolean;
  spalleLarghe?: boolean;
}

export interface VisScudo {
  forma: 'scudo' | 'torre' | 'tondo' | 'disco' | 'placca';
  faccia?: string;
  bordo?: string;
  emblema?: 'rombo' | 'osso' | 'nessuno';
  specchio?: boolean;
}

export type VisAccessorio =
  | { tipo: 'mantello'; mat: string; riflesso?: string }
  | { tipo: 'cappuccio'; mat: string }
  | { tipo: 'velo'; mat: string }
  | { tipo: 'maschera'; forma: 'volto' | 'senzaBocca' | 'incrinata' | 'corteccia' | 'erbe'; mat: string; dettaglio?: string }
  | { tipo: 'pendente'; forma: 'piastra' | 'disco' | 'goccia' | 'cristalli' | 'catena' | 'canna' | 'ruota' | 'scheggia' | 'piuma' | 'simbolo' | 'ghianda'; mat: string; filo: string; luce?: string }
  | { tipo: 'anello'; mat: string; gemma?: string }
  | { tipo: 'bracciale'; mat: string; dettaglio?: string; luce?: boolean }
  | { tipo: 'innesto' }
  | { tipo: 'guanti'; mat: string }
  | { tipo: 'spilla'; mat: string; forma: 'placca' | 'anelli' | 'luna' | 'filo' }
  | { tipo: 'cintura'; mat: string; fibbia: string }
  | { tipo: 'petto'; forma: 'sfera' | 'piastra'; mat: string; luce?: string }
  | { tipo: 'capelli'; forma: 'filo' | 'penna'; mat: string }
  | { tipo: 'orecchio'; mat: string }
  | { tipo: 'lanterna'; forma: 'ronda' | 'cieca' | 'custode' | 'pontile' }
  | { tipo: 'fianco'; forma: 'taccuino' | 'borsa' | 'astuccio' | 'chiavi' | 'corda' | 'ventaglio' | 'lettera' | 'gabbia' | 'uovo' | 'stella' | 'penna' | 'specchio' | 'cilindro' | 'lente' | 'reticolo' | 'fischietto'; mat?: string; luce?: string }
  | { tipo: 'compagno'; specie: 'lupa' | 'puma' | 'cavallo'; manto?: 'baio' | 'morello' | 'grigio'; finimenti?: boolean };

export type Segno = 'occhi' | 'vene' | 'unghie' | 'pelle';

/**
 * Come sta in piedi la figura: dritta a mani vuote; in guardia con un'arma a una mano o uno scudo; con le due mani
 * sull'arma da mischia a due mani; in mira con l'arco o la balestra.
 */
export type Posa = 'dritta' | 'guardia' | 'dueMani' | 'mira';

export interface Figura {
  aspetto: Aspetto;
  /** Senza: dritta, o in guardia se c'è uno scudo. */
  posa?: Posa;
  arma: VisArma;
  armatura: VisArmatura;
  scudo?: VisScudo;
  accessori: VisAccessorio[];
  segni: Segno[];
}

export interface Luce { x: number; y: number; r: number; colore: [number, number, number]; forza: number; tipo: 'fiamma' | 'fredda' }
export interface Ritratto { W: number; H: number; pixel: Uint8ClampedArray<ArrayBuffer>; luci: Luce[] }

type Riga = [number, number, number];
type RGB = [number, number, number];

const OCCHIO = '#8a8478', OCCHIO_LUCE = '#e4f7f4', VENA = '#7cc0c8', UNGHIA = '#8d9a9e', BUIO = '#05080a';
const hex = (c: string): RGB => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mescola = (a: RGB, b: RGB, k: number): RGB => [0, 1, 2].map((i) => Math.round(a[i]! + (b[i]! - a[i]!) * k)) as RGB;
const COLORI_LUCE: Record<string, RGB> = { luce: [222, 170, 96], luceVelata: [200, 140, 70], cristallo: [143, 195, 203], mana: [198, 58, 74], luceBianca: [212, 228, 226] };

interface OpzForma {
  tono?: number | ((x: number, y: number) => number);
  luce?: number; retino?: boolean; piatto?: boolean; maglia?: boolean; scuro?: number; ombra?: boolean;
}

export function disegna(f: Figura, opz: { palpebre?: boolean } = {}): Ritratto {
  const compagni = f.accessori.filter((a): a is Extract<VisAccessorio, { tipo: 'compagno' }> => a.tipo === 'compagno');
  const W = compagni.length ? LARGHEZZA_COMPAGNO : LARGHEZZA, H = ALTEZZA;
  // si disegna su strati: il fondo, il corpo, l'arma, lo scudo; alla fine si compongono sulla tela. Uno strato può
  // essere più alto della tela (l'arma, che si disegna appesa alla mano e poi si gira): `oy` righe sopra lo zero
  interface Strato { M: (string | null)[]; T: Int8Array; R: (string | null)[]; V: ([string, number] | null)[]; oy: number; h: number }
  const strato = (h = H, oy = 0): Strato => ({ M: new Array(W * h).fill(null), T: new Int8Array(W * h), R: new Array(W * h).fill(null), V: new Array(W * h).fill(null), oy, h });
  const tela = strato();
  let M = tela.M, T = tela.T, R = tela.R, V = tela.V, OY = 0, HS = H;
  const usa = (s: Strato) => { M = s.M; T = s.T; R = s.R; V = s.V; OY = s.oy; HS = s.h; };
  const luci: Luce[] = [];
  const a = f.aspetto;
  const acc = <K extends VisAccessorio['tipo']>(t: K) => f.accessori.filter((x): x is Extract<VisAccessorio, { tipo: K }> => x.tipo === t);
  const segni = new Set(f.segni);
  const inb = (x: number, y: number) => x >= 0 && y + OY >= 0 && x < W && y + OY < HS;
  const id = (x: number, y: number) => (y + OY) * W + x;
  const rett = (x0: number, y0: number, x1: number, y1: number): Riga[] => { const r: Riga[] = []; for (let y = y0; y <= y1; y++) r.push([y, x0, x1]); return r; };
  const spec = (sp: Riga[]): Riga[] => sp.map(([y, x0, x1]) => [y, LARGHEZZA - 1 - x1, LARGHEZZA - 1 - x0]);
  const sposta = (sp: Riga[], dx: number, dy = 0): Riga[] => sp.map(([y, x0, x1]) => [y + dy, x0 + dx, x1 + dx]);

  function forma(sp: Riga[], mat: string, o: OpzForma = {}): void {
    const dentro = new Set<number>(), est = new Map<number, [number, number]>();
    for (const [y, x0, x1] of sp) {
      for (let x = x0; x <= x1; x++) if (inb(x, y)) dentro.add(id(x, y));
      const e = est.get(y); est.set(y, e ? [Math.min(e[0], x0), Math.max(e[1], x1)] : [x0, x1]);
    }
    const ha = (x: number, y: number) => inb(x, y) && dentro.has(id(x, y));
    const fatti: number[] = [];
    for (const [y, x0, x1] of sp) for (let x = x0; x <= x1; x++) {
      if (!inb(x, y)) continue;
      let t: number;
      if (o.tono !== undefined) t = typeof o.tono === 'function' ? o.tono(x, y) : o.tono;
      else {
        const [ea, eb] = est.get(y)!, L = eb - ea + 1, q = L > 1 ? (x - ea) / (L - 1) : 0.5;
        t = 2;
        if (L >= 3 && q <= (o.luce ?? 0.2)) t = 3;
        if (L >= 2 && q >= 0.67) t = 1;
        if (L >= 6 && q >= 0.9) t = 0;
        if (o.retino && L >= 4 && q >= 0.5 && q < 0.67 && (x + y) % 2 === 0) t = 1;
        if (!o.piatto) { if (!ha(x, y - 1)) t = Math.min(3, t + 1); if (!ha(x, y + 1)) t = Math.max(0, t - 1); }
        if (o.maglia && (x + y) % 2 === 1) t = Math.max(0, t - 1);
        t = Math.max(0, t - (o.scuro ?? 0));
      }
      const i = id(x, y); M[i] = mat; T[i] = Math.max(0, Math.min(3, t)); R[i] = null; V[i] = null; fatti.push(i);
    }
    if (o.ombra !== false && !EMISSIVI.has(mat)) {
      const visti = new Set<number>();
      for (const i of fatti) {
        const x = i % W, y = ((i / W) | 0) - OY;
        for (const [nx, ny] of [[x + 1, y], [x, y + 1]] as const) {
          if (!inb(nx, ny) || ha(nx, ny)) continue;
          const j = id(nx, ny), m = M[j];
          if (visti.has(j) || !m || m === 'raw' || EMISSIVI.has(m)) continue;
          visti.add(j); T[j] = Math.max(0, T[j]! - 1);
        }
      }
    }
  }
  const px = (x: number, y: number, mat: string, t: number) => { if (!inb(x, y)) return; const i = id(x, y); M[i] = mat; T[i] = Math.max(0, Math.min(3, t)); R[i] = null; V[i] = null; };
  const raw = (x: number, y: number, c: string) => { if (!inb(x, y)) return; const i = id(x, y); M[i] = 'raw'; R[i] = c; V[i] = null; };
  const vela = (x: number, y: number, quale: string, k: number) => { if (inb(x, y) && M[id(x, y)] === 'pelle') V[id(x, y)] = [quale, k]; };
  const tono = (x: number, y: number, t: number | '-' | '+', mat?: string) => {
    if (!inb(x, y)) return; const i = id(x, y), m = M[i];
    if (!m || m === 'raw' || (mat && m !== mat)) return;
    T[i] = t === '-' ? Math.max(0, T[i]! - 1) : t === '+' ? Math.min(3, T[i]! + 1) : t;
  };
  const mat = (x: number, y: number) => (inb(x, y) ? M[id(x, y)] ?? null : null);
  const togli = (x: number, y: number) => { if (inb(x, y)) { const i = id(x, y); M[i] = null; R[i] = null; V[i] = null; } };
  const erodi = (sp: Riga[]): Riga[] => {
    const S = new Set<number>(); for (const [y, x0, x1] of sp) for (let x = x0; x <= x1; x++) S.add(y * 1000 + x);
    const out: Riga[] = [];
    for (const [y, x0, x1] of sp) for (let x = x0; x <= x1; x++)
      if (S.has((y - 1) * 1000 + x) && S.has((y + 1) * 1000 + x) && S.has(y * 1000 + x - 1) && S.has(y * 1000 + x + 1)) out.push([y, x, x]);
    return out;
  };
  const linea = (x0: number, y0: number, x1: number, y1: number, m: string, t: number) => {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) { px(x0, y0, m, t); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  };
  const lama = (x0: number, x1: number, y0: number, y1: number, m: string, toni: number[]) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) px(x, y, m, toni[x - x0] ?? 1);
  };
  const accendi = (x: number, y: number, m: string, r: number, forza: number, tipo: Luce['tipo'] = 'fredda') => {
    luci.push({ x, y, r, colore: COLORI_LUCE[m] ?? [143, 195, 203], forza, tipo });
  };

  const guanti = acc('guanti')[0];
  const cappuccio = acc('cappuccio')[0], velo = acc('velo')[0];
  const testaCoperta = !!cappuccio || !!velo;
  const lanterne = acc('lanterna');
  const conScudo = !!f.scudo;
  const arco = f.arma.forma === 'arcoCorto' || f.arma.forma === 'arcoLungo';
  let manoMat = 'pelle';

  // ================================================================ compagni (dietro)
  /** Le righe di una forma scritta in coordinate relative, spostata di `o` a destra. */
  const qui = (o: number, sp: Riga[]): Riga[] => sp.map(([y, x0, x1]) => [y, x0 + o, x1 + o]);
  function cavallo(c: Extract<VisAccessorio, { tipo: 'compagno' }>): void {
    const o = 38;
    const manto = c.manto === 'morello' ? 'morello' : c.manto === 'grigio' ? 'grigioPomellato' : 'baio';
    const crin = c.manto === 'grigio' ? 'lupo' : 'criniera';
    const balzane = c.manto === 'baio' ? 'criniera' : manto; // il baio ha le estremità nere
    const zampaAnt = (dx: number): Riga[] => [...rett(27 + dx, 41, 31 + dx, 47), ...rett(28 + dx, 48, 30 + dx, 50), [51, 28 + dx, 31 + dx], ...rett(29 + dx, 52, 30 + dx, 60), ...rett(28 + dx, 61, 31 + dx, 62), ...rett(29 + dx, 63, 31 + dx, 64)];
    const zampaPost = (dx: number): Riga[] => [...rett(3 + dx, 40, 10 + dx, 46), ...rett(5 + dx, 47, 9 + dx, 50), [51, 5 + dx, 9 + dx], [52, 5 + dx, 8 + dx], ...rett(7 + dx, 53, 8 + dx, 60), ...rett(6 + dx, 61, 9 + dx, 62), ...rett(7 + dx, 63, 9 + dx, 64)];
    const zoccolo = (x0: number, scuro: number) => forma(rett(o + x0, 65, o + x0 + 4, 68), 'zoccolo', { scuro });
    // coda
    forma(qui(o, [[27, 1, 3], [28, 0, 3], [29, -1, 2], [30, -1, 2], [31, -1, 2], ...rett(-1, 32, 1, 40), ...rett(-2, 41, 1, 47), [48, -1, 2], [49, 0, 2], [50, 0, 1]]), crin, { scuro: 1 });
    // zampe lontane
    forma(qui(o, zampaAnt(-4)), manto, { scuro: 2 }); zoccolo(24, 2);
    forma(qui(o, zampaPost(4)), manto, { scuro: 2 }); zoccolo(10, 2);
    for (let y = 55; y <= 64; y++) { tono(o + 26, y, 0); tono(o + 12, y, 0); }
    // corpo e collo
    const corpo: Riga[] = [[24, 24, 28], [25, 6, 12], [25, 22, 30], [26, 4, 31], [27, 3, 32]];
    for (let y = 28; y <= 36; y++) corpo.push([y, 2, 33]);
    corpo.push([37, 2, 32], [38, 2, 32], [39, 2, 32], [40, 3, 31], [41, 5, 29], [42, 8, 27]);
    forma(qui(o, corpo), manto, { luce: 0.15 });
    const collo: Riga[] = [[14, 31, 35], [15, 30, 36], [16, 29, 36], [17, 29, 37], [18, 28, 37], [19, 28, 37], [20, 27, 37], [21, 27, 37], [22, 27, 37], [23, 27, 36], [24, 28, 36], [25, 29, 36], [26, 30, 35], [27, 31, 35], [28, 32, 35], [29, 33, 35], [30, 33, 34]];
    forma(qui(o, collo), manto, { luce: 0.3 });
    const testaC: Riga[] = [[10, 33, 37], [11, 33, 38], [12, 34, 39], [13, 35, 40], [14, 36, 41], [15, 37, 42], [16, 38, 43], [17, 38, 44], [18, 39, 44], [19, 40, 44], [20, 41, 43]];
    forma(qui(o, testaC), manto, { luce: 0.3 });
    forma(qui(o, [[8, 34, 34], [9, 33, 34]]), manto, { luce: 0.5 });
    // criniera lungo la cresta del collo
    for (let y = 11; y <= 25; y++) {
      const x0 = collo.find((r) => r[0] === y)?.[1] ?? 33;
      px(o + x0, y, crin, y % 3 ? 1 : 2); px(o + x0 - 1, y, crin, 0);
    }
    px(o + 36, 10, crin, 2); px(o + 37, 11, crin, 1);
    raw(o + 37, 12, c.manto === 'morello' ? '#c8d0d4' : '#1a0e08');
    px(o + 43, 17, manto, 0); for (const x of [42, 43, 44]) tono(o + x, 19, '-', manto);
    tono(o + 32, 16, '-', manto); tono(o + 31, 17, '-', manto);
    if (c.manto === 'morello') for (const [x, y] of [[10, 28], [14, 27], [20, 28], [31, 16], [35, 11], [6, 30]] as const) raw(o + x, y, '#4a6a7a');
    if (c.manto === 'grigio') for (let y = 28; y <= 40; y += 3) for (let x = 5; x <= 30; x += 4) tono(o + x + (y % 2 ? 2 : 0), y, '-', manto);
    // zampe vicine
    forma(qui(o, zampaPost(0)), manto); zoccolo(6, 0);
    forma(qui(o, zampaAnt(0)), manto); zoccolo(28, 0);
    for (let y = 55; y <= 64; y++) for (const x of [7, 8, 29, 30, 31]) if (mat(o + x, y) === manto) px(o + x, y, balzane, x === 7 || x === 29 ? 2 : 1);
    if (c.finimenti) {
      forma(qui(o, [[26, 13, 25], ...rett(13, 27, 25, 31), [32, 14, 24]]), 'lanaRossa');
      forma(qui(o, [[23, 15, 22], [24, 14, 23], [25, 14, 24]]), 'cuoio2', { luce: 0.3 });
      linea(o + 20, 26, o + 20, 41, 'cuoio', 1);
      linea(o + 18, 32, o + 18, 43, 'cuoio', 0); px(o + 17, 44, 'ferro', 3); px(o + 18, 44, 'ferro', 2); px(o + 19, 44, 'ferro', 1);
      linea(o + 37, 11, o + 41, 19, 'cuoio', 0); linea(o + 34, 13, o + 40, 17, 'cuoio', 0);
      linea(o + 40, 18, o + 25, 24, 'cuoio', 1);
      px(o + 41, 18, 'ferro', 3);
    }
  }
  if (compagni.some((c) => c.specie === 'cavallo')) cavallo(compagni.find((c) => c.specie === 'cavallo')!);

  // ================================================================ dietro la figura
  const mantelli = acc('mantello');
  const mantello = mantelli[mantelli.length - 1];
  if (mantello) {
    const sp: Riga[] = [];
    for (let y = 18; y <= 65; y++) {
      let x0: number, x1: number;
      if (y === 18) { x0 = 16; x1 = 31; } else if (y < 25) { x0 = 13; x1 = 34; } else { const d = Math.floor((y - 25) / 9); x0 = 13 - d; x1 = 34 + d; }
      sp.push([y, x0, x1]);
    }
    forma(sp, mantello.mat, { retino: true, ombra: false });
    for (const [y, x0, x1] of sp) if (y >= 33) { tono(x0 + 2, y, '-', mantello.mat); tono(x1 - 2, y, 0, mantello.mat); tono(23, y, 0, mantello.mat); }
    for (let y = 42; y <= 65; y++) { tono(23, y, 0, mantello.mat); tono(24, y, 0, mantello.mat); }
    if (mantello.riflesso) for (const [y, x0] of sp) if (y >= 30 && y % 4 === 0) raw(x0 + 1, y, mantello.riflesso);
    for (let x = 8; x <= 40; x++) if (x % 3 === 0) togli(x, 65); else if (x % 3 === 1) tono(x, 65, 0, mantello.mat);
  }
  if (arco) {
    forma([[11, 30, 30], [11, 32, 32], [12, 30, 32], [13, 30, 32]], 'piuma', { luce: 0.3 });
    for (let y = 14; y <= 15; y++) { px(30, y, 'legno', 2); px(32, y, 'legno', 1); }
    forma(rett(29, 16, 33, 24), 'cuoio2', { ombra: false });
  }
  if (cappuccio) forma([...rett(18, 7, 29, 20), [21, 17, 30]], cappuccio.mat, { scuro: 1, ombra: false });
  else if (velo) forma([...rett(18, 8, 29, 22), [23, 17, 30], [24, 17, 30]], velo.mat, { scuro: 1, ombra: false });
  else if (a.capelli === 'lunghi') forma([...rett(19, 8, 28, 22), [23, 20, 27], [24, 21, 26]], 'capelli', { scuro: 1, ombra: false });

  // ================================================================ corpo
  function busto(m: string, orlo: number, o: OpzForma = {}): void {
    const sp: Riga[] = [[19, 17, 30]];
    for (let y = 20; y <= 30; y++) sp.push([y, 16, 31]);
    for (let y = 31; y <= Math.min(orlo, 42); y++) sp.push([y, 17, 30]);
    for (let y = 43; y <= orlo; y++) { const d = y >= 49 ? 2 : y >= 43 ? 1 : 0; sp.push([y, 17 - d, 30 + d]); }
    forma(sp, m, o);
    if (orlo >= 46) for (let y = 45; y <= orlo; y++) { tono(23, y, 0, m); tono(24, y, 0, m); }
  }
  function braccia(m: string, y0: number, y1: number, o: OpzForma = {}): void {
    const L: Riga[] = [], Rr: Riga[] = [];
    if (y0 <= 19) { L.push([19, 14, 15]); Rr.push([19, 32, 33]); }
    for (let y = Math.max(20, y0); y <= y1; y++) { L.push([y, 13, 15]); Rr.push([y, 32, 34]); }
    forma(L, m, o); forma(Rr, m, { ...o, scuro: (o.scuro ?? 0) + 1 });
  }
  function avambracci(m: string, y0: number, y1: number): void {
    forma(rett(13, y0, 15, y1), m); forma(rett(32, y0, 34, y1), m, { scuro: 1 });
  }
  function mani(m = 'pelle'): void {
    if (m === 'pelle' && guanti) m = guanti.mat;
    manoMat = m;
    forma([...rett(13, 40, 15, 42), [43, 13, 14]], m);
    forma([...rett(32, 40, 34, 42), [43, 33, 34]], m, { scuro: 1 });
  }
  function cintura(): void {
    const c = acc('cintura')[0];
    const m = c?.mat ?? 'cuoio';
    forma(rett(17, 38, 30, 38), m, { piatto: true, tono: (x) => (x > 26 ? 1 : 2) });
    if (c) { px(22, 38, c.fibbia, 2); px(23, 38, c.fibbia, 3); px(24, 38, c.fibbia, 2); px(25, 38, c.fibbia, 1); px(23, 37, c.fibbia, 2); px(24, 37, c.fibbia, 1); }
    else { px(23, 38, 'ferro', 3); px(24, 38, 'ferro', 1); }
  }
  function stivali(m: string): void {
    forma([...rett(17, 57, 22, 66), [67, 16, 22]], m);
    forma([...rett(25, 57, 30, 66), [67, 25, 31]], m, { scuro: 1 });
    forma(rett(16, 68, 22, 68), m, { tono: 0 }); forma(rett(25, 68, 31, 68), m, { tono: 0 });
    for (let x = 17; x <= 22; x++) tono(x, 59, '-'); for (let x = 25; x <= 30; x++) tono(x, 59, '-');
  }
  function gambe(): void {
    forma(rett(18, 39, 29, 42), 'braghe');
    forma(rett(18, 41, 22, 61), 'braghe');
    forma(rett(25, 41, 29, 61), 'braghe', { scuro: 1 });
    for (const y of [50, 51]) { tono(20, y, '-'); tono(27, y, '-'); }
    stivali('cuoio');
  }
  function stemma(s: NonNullable<VisArmatura['stemma']>, cx: number, cy: number): void {
    const p: [number, number, number][] =
      s.forma === 'bilance' ? [[cx - 2, cy, 2], [cx - 1, cy - 1, 3], [cx, cy - 2, 3], [cx + 1, cy - 1, 2], [cx + 2, cy, 1], [cx, cy - 1, 2], [cx, cy, 2], [cx - 2, cy + 1, 1], [cx + 2, cy + 1, 1]]
      : s.forma === 'torre' ? [[cx - 1, cy - 2, 3], [cx + 1, cy - 2, 2], [cx - 1, cy - 1, 3], [cx, cy - 1, 2], [cx + 1, cy - 1, 2], [cx - 1, cy, 3], [cx, cy, 2], [cx + 1, cy, 1], [cx - 1, cy + 1, 2], [cx, cy + 1, 1], [cx + 1, cy + 1, 1]]
      : s.forma === 'spirale' ? [[cx, cy, 3], [cx + 1, cy, 2], [cx + 1, cy + 1, 2], [cx, cy + 1, 2], [cx - 1, cy + 1, 1], [cx - 1, cy, 2], [cx - 1, cy - 1, 2], [cx, cy - 1, 3], [cx + 1, cy - 1, 2], [cx + 2, cy - 1, 1]]
      : [[cx - 1, cy - 1, 3], [cx - 2, cy, 2], [cx - 2, cy + 1, 2], [cx - 1, cy + 2, 2], [cx, cy + 2, 1], [cx + 1, cy + 2, 1], [cx + 2, cy + 1, 1], [cx + 2, cy, 1]];
    for (const [x, y, t] of p) px(x, y, s.mat, t);
  }

  type ArmaturaFatta = { scollo: 'v' | 'tondo' | null; dopoTesta?: () => void; orlo?: number };
  function armatura(v: VisArmatura): ArmaturaFatta {
    const sotto = v.sotto ?? 'lana';
    switch (v.forma) {
      case 'strada': {
        const m = v.corpo ?? 'lana';
        busto(m, v.lungo ? 52 : 44, { retino: true });
        for (const [x, y] of [[20, 42], [20, 43], [19, 44], [27, 41], [27, 42], [28, 43], [28, 44]] as const) tono(x, y, 0, m);
        forma(rett(26, 27, 28, 29), 'braghe', { piatto: true, tono: 2 });
        for (const [x, y] of [[25, 27], [25, 29], [29, 28]] as const) px(x, y, 'lino', 2);
        braccia(m, 19, 35, { retino: true });
        forma(rett(13, 36, 15, 39), 'pelle'); forma(rett(32, 36, 34, 39), 'pelle', { scuro: 1 });
        tono(14, 35, 3, m); tono(33, 35, 2, m);
        mani(); cintura();
        return { scollo: 'v', orlo: v.lungo ? 52 : undefined };
      }
      case 'giaco': {
        const m = v.corpo ?? 'lino';
        busto(m, v.lungo ? 54 : 44);
        if (!v.lungo) for (const y of [22, 25, 28, 31, 34, 41]) for (let x = 16; x <= 31; x++) tono(x, y, '-', m);
        for (let y = 20; y <= (v.lungo ? 54 : 44); y++) tono(23, y, '-', m);
        braccia(m, 19, 39);
        if (!v.lungo) for (const y of [23, 27, 31, 35]) for (const x of [13, 14, 15, 32, 33, 34]) tono(x, y, '-', m);
        else for (const y of [36, 37]) { tono(14, y, '-', m); tono(33, y, '-', m); }
        if (v.lungo) for (const [x, y] of [[22, 21], [22, 24], [22, 27], [22, 30], [22, 33]] as const) px(x, y, 'argentoBrunito', 2);
        if (v.stemma) stemma(v.stemma, 18, 22);
        mani(); cintura();
        return { scollo: null, dopoTesta: () => forma([[18, 21, 26], [19, 20, 27]], m), orlo: v.lungo ? 54 : undefined };
      }
      case 'cuoio': {
        const m = v.corpo ?? 'cuoio2';
        busto(sotto, 42);
        braccia(sotto, 19, 39);
        const orlo = v.lungo || v.pelliccia ? 54 : 40;
        const c: Riga[] = [[19, 18, 29]];
        for (let y = 20; y <= 37; y++) c.push([y, 17, 30]);
        if (orlo <= 40) c.push([38, 18, 29], [39, 18, 29], [40, 19, 28]);
        else for (let y = 38; y <= orlo; y++) { const d = y >= 49 ? 2 : y >= 43 ? 1 : 0; c.push([y, 17 - d, 30 + d]); }
        forma(c, m, { retino: !!v.pelliccia });
        if (orlo > 40) for (let y = 41; y <= orlo; y++) { tono(23, y, 0, m); tono(24, y, 0, m); }
        if (v.pelliccia) {
          // ciocche di pelo: tratti verticali più scuri, e l'orlo sfrangiato
          const ciocche = (x0: number, x1: number, y0: number, y1: number) => {
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ((x * 5 + Math.floor(y / 3) * 3) % 4 === 0) tono(x, y, '-', m);
          };
          ciocche(16, 31, 20, orlo);
          for (let x = 15; x <= 32; x++) if (x % 3 !== 1) px(x, orlo + 1, m, x % 3 ? 1 : 0);
          braccia(m, 19, 39);
          ciocche(13, 15, 20, 39); ciocche(32, 34, 20, 39);
          for (const y of [24, 29, 34]) { px(12, y, m, 1); px(35, y, m, 0); }
        } else {
          for (let y = 21; y <= 37; y++) { tono(20, y, '-', m); tono(27, y, '-', m); }
          for (let x = 17; x <= 30; x++) tono(x, 29, '-', m);
        }
        if (v.brigantina) for (let y = 21; y <= 36; y += 3) for (let x = 18; x <= 29; x += 3) px(x + (y % 2), y, v.borchie ?? 'ferro', x < 24 ? 3 : 1);
        else if (v.borchie !== null) for (const [x, y] of [[18, 22], [18, 26], [29, 22], [29, 26], [18, 33], [29, 33]] as const) px(x, y, v.borchie ?? 'ferro', x < 24 ? 3 : 2);
        const sp: Riga[] = v.spalleLarghe
          ? [[17, 13, 17], [18, 12, 18], [19, 11, 18], [20, 11, 17], [21, 11, 17], [22, 12, 16], [23, 13, 15]]
          : [[18, 13, 17], [19, 12, 17], [20, 12, 17], [21, 12, 16], [22, 13, 15]];
        forma(sp, m, { luce: 0.3 }); forma(spec(sp), m, { scuro: 1 });
        if (v.borchie !== null && !v.pelliccia) { const b = v.borchie ?? 'ferro'; px(14, 19, b, 3); px(16, 20, b, 2); px(33, 19, b, 2); px(31, 20, b, 1); }
        if (!v.pelliccia) { avambracci(m, 33, 39); for (const y of [35, 37]) { tono(14, y, '-'); tono(33, y, '-'); } }
        if (v.stemma) stemma(v.stemma, v.stemma.forma === 'spirale' ? 21 : 23, 25);
        if (v.muschio) {
          const ciuffi: [number, number][] = [[13, 18], [15, 17], [17, 19], [30, 18], [32, 17], [34, 19], [19, 24], [27, 28], [21, 31], [26, 35], [18, 38], [29, 41], [20, 45], [27, 48], [14, 25], [33, 27], [12, 20], [35, 21]];
          for (const [x, y] of ciuffi) if (mat(x, y)) { px(x, y, 'muschio', x < 24 ? 3 : 2); px(x + 1, y, 'muschio', 1); if (y > 18) px(x, y - 1, 'muschio', 2); }
        }
        mani(); cintura();
        return {
          scollo: 'tondo',
          orlo: orlo > 40 ? orlo + 1 : undefined,
          dopoTesta: v.pelo ? () => forma([[16, 20, 27], [17, 18, 29], [18, 16, 31], [19, 15, 32], [20, 15, 32], [21, 16, 18], [21, 29, 31]], v.pelo!, { retino: true, luce: 0.25 }) : undefined,
        };
      }
      case 'maglia': {
        const m = v.corpo ?? 'maglia';
        busto(sotto, 45);
        const sp: Riga[] = [[19, 17, 30]];
        for (let y = 20; y <= 30; y++) sp.push([y, 16, 31]);
        for (let y = 31; y <= 42; y++) sp.push([y, 17, 30]);
        sp.push([43, 16, 31]);
        forma(sp, m, { maglia: true });
        for (let x = 16; x <= 31; x += 2) { togli(x, 43); px(x, 43, sotto, 1); }
        braccia(m, 19, 30, { maglia: true });
        forma(rett(13, 31, 15, 39), sotto); forma(rett(32, 31, 34, 39), sotto, { scuro: 1 });
        if (v.anelli?.dove === 'spalle') {
          for (let y = 19; y <= 23; y++) for (const x of [13, 14, 15, 16, 17, 30, 31, 32, 33, 34]) if (mat(x, y) === m && (x + y) % 2 === 0) px(x, y, v.anelli.mat, x < 24 ? 3 : 1);
          for (let y = 34; y <= 40; y++) if (mat(30, y) === m && y % 2 === 0) px(30, y, v.anelli.mat, 1);
        }
        if (v.anelli?.dove === 'zigzag') for (let x = 16; x <= 31; x++) { const y = 27 + (x % 4 < 2 ? x % 2 : 1 - (x % 2)) ; px(x, y, v.anelli.mat, x < 22 ? 3 : x < 27 ? 2 : 1); px(x, y + 6, v.anelli.mat, x < 22 ? 2 : 1); }
        if (v.spalleLarghe) { const p: Riga[] = [[18, 13, 17], [19, 12, 17], [20, 12, 17], [21, 13, 16]]; forma(p, 'cuoio2', { luce: 0.3 }); forma(spec(p), 'cuoio2', { scuro: 1 }); for (const x of [13, 15, 32, 34]) tono(x, 20, '-'); }
        mani(); cintura();
        return { scollo: 'tondo' };
      }
      case 'piastre': {
        const m = v.corpo ?? 'acciaio';
        const sottoM = v.sotto ?? 'maglia';
        busto(sottoM, 44, { maglia: sottoM === 'maglia' });
        braccia(sottoM, 19, 39, { maglia: sottoM === 'maglia' });
        const p: Riga[] = [[19, 18, 29]];
        for (let y = 20; y <= 33; y++) p.push([y, 17, 30]);
        p.push([34, 18, 29], [35, 19, 28], [36, 20, 27]);
        forma(p, m, { luce: 0.25 });
        for (let y = 20; y <= 35; y++) { tono(23, y, 3, m); tono(24, y, 1, m); }
        if (v.irregolare) {
          for (const [x0, x1, y] of [[17, 22, 26], [24, 30, 29], [18, 23, 32]] as const) for (let x = x0; x <= x1; x++) tono(x, y, 0, m);
          for (const [x, y] of [[18, 21], [21, 21], [26, 23], [29, 23], [18, 28], [22, 31], [27, 31], [19, 34]] as const) px(x, y, 'ferro', x < 24 ? 3 : 2);
        } else if (m === 'acciaio' || m === 'acciaioChiaro') { raw(19, 21, '#9fb3ba'); raw(18, 22, '#9fb3ba'); raw(23, 24, '#c5d3d6'); }
        if (v.stemma) stemma(v.stemma, 21, 25);
        const fa: Riga[] = []; for (let y = 37; y <= 42; y++) fa.push([y, 17, 30]);
        forma(fa, m);
        for (const y of [39, 41]) for (let x = 17; x <= 30; x++) tono(x, y, 0, m);
        const sp: Riga[] = [[17, 14, 17], [18, 12, 18], [19, 12, 18], [20, 12, 17], [21, 12, 17], [22, 12, 16], [23, 13, 16], [24, 13, 15]];
        forma(sp, m, { luce: 0.3 }); forma(spec(sp), m, { scuro: 1 });
        for (const y of [21, 23]) for (const x of [12, 13, 14, 15, 16, 17, 30, 31, 32, 33, 34, 35]) tono(x, y, '-', m);
        if (m === 'acciaio') raw(13, 18, '#9fb3ba');
        forma(rett(13, 28, 15, 39), m); forma(rett(32, 28, 34, 39), m, { scuro: 1 });
        forma([[26, 13, 15], [27, 12, 16]], m); forma([[26, 32, 34], [27, 31, 35]], m, { scuro: 1 });
        mani(m);
        forma(rett(18, 51, 22, 58), m); forma(rett(25, 51, 29, 58), m, { scuro: 1 });
        forma([[48, 19, 21], [49, 18, 22], [50, 19, 21]], m, { luce: 0.4 });
        forma([[48, 26, 28], [49, 25, 29], [50, 26, 28]], m, { scuro: 1 });
        stivali(m);
        return { scollo: null, dopoTesta: () => forma([[16, 22, 25], [17, 21, 26], [18, 20, 27]], m, { luce: 0.3 }) };
      }
    }
  }

  // ================================================================ testa
  function testa(scollo: ArmaturaFatta['scollo']): void {
    const collo = rett(22, 16, 25, 18);
    if (scollo === 'v') collo.push([19, 22, 25], [20, 23, 24]);
    if (scollo === 'tondo') collo.push([19, 21, 26]);
    forma(collo, 'pelle', { tono: (x, y) => (y <= 17 || x >= 25 ? 0 : 1), ombra: false });
    // il volto femminile ha il mento più stretto
    const h: Riga[] = [[6, 21, 26]]; for (let y = 7; y <= (femmina ? 13 : 14); y++) h.push([y, 20, 27]);
    if (femmina) h.push([14, 21, 26], [15, 22, 25], [16, 23, 24]); else h.push([15, 21, 26], [16, 22, 25]);
    forma(h, 'pelle', { luce: 0.15 });
    px(19, 11, 'pelle', 2); px(19, 12, 'pelle', 1); px(28, 11, 'pelle', 1); px(28, 12, 'pelle', 0);
  }
  function volto(): void {
    if (femmina) { px(21, 10, 'capelli', 1); px(22, 9, 'capelli', 2); px(25, 9, 'capelli', 1); px(26, 10, 'capelli', 0); }
    else { px(21, 10, 'capelli', 1); px(22, 10, 'capelli', 1); px(25, 10, 'capelli', 1); px(26, 10, 'capelli', 0); }
    tono(21, 11, 0); tono(26, 11, 0);
    tono(21, 12, 1); tono(22, 12, 1); tono(25, 12, 0); tono(26, 12, 0);
    if (opz.palpebre) { tono(22, 11, 1); tono(25, 11, 0); } else { raw(22, 11, OCCHIO); raw(25, 11, OCCHIO); }
    tono(23, 12, 3); tono(24, 12, 1); tono(24, 13, 0); tono(23, 13, 2);
    tono(22, 14, 1); tono(23, 14, 0); tono(24, 14, 0); tono(25, 14, 1);
    if (femmina) { vela(23, 14, 'scarlatto', 0.45); vela(24, 14, 'scarlatto', 0.4); tono(22, 14, 2); tono(25, 14, 1); tono(22, 15, 2); tono(25, 15, 0); }
    else { tono(21, 15, 2); tono(26, 15, 0); }
  }
  const CAPELLI: Record<Taglio, () => void> = {
    rasati() {
      for (let y = 6; y <= 9; y++) for (let x = 20; x <= 27; x++) {
        if (y === 9 && x > 20 && x < 27) continue;
        if (y === 8 && x > 21 && x < 26) { if (x % 2) vela(x, y, 'capelli', 0.3); continue; }
        vela(x, y, 'capelli', y <= 7 ? 0.62 : 0.5);
      }
      vela(20, 10, 'capelli', 0.45); vela(27, 10, 'capelli', 0.45);
    },
    corti() {
      forma([[5, 22, 25], [6, 20, 27], [7, 19, 28], [8, 19, 21], [8, 26, 28], [9, 19, 20], [9, 27, 28], [10, 20, 20], [10, 27, 27]], 'capelli');
      px(23, 8, 'capelli', 2); px(25, 8, 'capelli', 1); tono(22, 6, '-', 'capelli'); tono(25, 7, '-', 'capelli');
    },
    arruffati() {
      const sp: Riga[] = [[3, 21, 21], [3, 24, 24], [3, 26, 26], [4, 20, 27], [5, 19, 28]];
      for (let y = 6; y <= 8; y++) sp.push([y, 18, 29]);
      sp.push([9, 18, 20], [9, 22, 23], [9, 26, 29], [10, 18, 19], [10, 22, 22], [10, 28, 29]);
      for (let y = 11; y <= 13; y++) sp.push([y, 18, 19], [y, 28, 29]);
      sp.push([14, 18, 18], [14, 29, 29], [15, 29, 29]);
      forma(sp, 'capelli', { luce: 0.25 });
      for (const [x, y] of [[22, 5], [25, 6], [20, 7], [27, 5], [24, 8], [19, 12]] as const) tono(x, y, '-', 'capelli');
    },
    lunghi() {
      const sp: Riga[] = [[4, 21, 26], [5, 20, 27]];
      for (let y = 6; y <= 8; y++) sp.push([y, 19, 28]);
      sp.push([9, 19, 21], [9, 26, 28]);
      for (let y = 10; y <= 13; y++) sp.push([y, 19, 19], [y, 28, 28]);
      for (let y = 14; y <= 18; y++) sp.push([y, 18, 19], [y, 28, 29]);
      for (let y = 19; y <= 23; y++) sp.push([y, 17, 19], [y, 28, 30]);
      sp.push([24, 17, 18], [24, 29, 30], [25, 17, 17], [25, 30, 30]);
      forma(sp, 'capelli');
      tono(23, 4, 0, 'capelli'); tono(23, 5, 0, 'capelli'); tono(23, 6, 1, 'capelli'); tono(22, 8, '-', 'capelli');
      for (let y = 15; y <= 24; y += 3) { tono(18, y, '-', 'capelli'); tono(29, y + 1, '-', 'capelli'); }
    },
    raccolti() {
      forma([[1, 23, 24], [2, 22, 25], [3, 22, 25]], 'capelli', { luce: 0.3 });
      px(23, 4, 'cuoio', 2); px(24, 4, 'cuoio', 1);
      forma([[5, 21, 26], [6, 20, 27], [7, 20, 27], [8, 20, 21], [8, 26, 27], [9, 20, 20], [9, 27, 27]], 'capelli');
      for (const [x, y] of [[22, 6], [24, 6], [21, 7], [26, 7]] as const) tono(x, y, '-', 'capelli');
    },
  };
  const CORTA: Riga[] = [[12, 20, 20], [12, 27, 27], [13, 20, 27], [14, 20, 21], [14, 26, 27], [15, 20, 27], [16, 21, 26], [17, 22, 25]];
  const BARBE_F: Record<Barba, () => void> = {
    nessuna() { /* niente */ },
    ispida() {
      for (let y = 12; y <= 17; y++) for (let x = 20; x <= 27; x++) {
        if ((y === 12 && x > 20 && x < 27) || ((y === 13 || y === 14) && x >= 23 && x <= 24)) continue;
        vela(x, y, 'barba', y <= 13 ? 0.32 : 0.48);
      }
    },
    baffi() {
      forma([[13, 22, 25]], 'barba', { piatto: true });
      px(21, 14, 'barba', 2); px(21, 15, 'barba', 1); px(26, 14, 'barba', 1); px(26, 15, 'barba', 0);
    },
    corta() { forma(CORTA, 'barba'); tono(23, 16, '-', 'barba'); tono(25, 15, '-', 'barba'); },
    lunga() {
      const sp: Riga[] = [...CORTA.slice(0, 6)];
      for (let y = 16; y <= 21; y++) sp.push([y, 21, 26]);
      sp.push([22, 22, 25], [23, 22, 25], [24, 23, 24]);
      forma(sp, 'barba');
      for (let y = 17; y <= 23; y += 2) { tono(23, y, '-', 'barba'); tono(25, y + 1, '-', 'barba'); }
    },
  };

  // ================================================================ accessori sulla figura
  function maschera(m: Extract<VisAccessorio, { tipo: 'maschera' }>): void {
    if (m.forma === 'erbe') {
      forma([[12, 20, 27], [13, 20, 27], [14, 20, 27], [15, 21, 26], [16, 22, 25]], m.mat, { luce: 0.2 });
      for (let x = 20; x <= 27; x += 2) tono(x, 14, '-', m.mat);
      linea(19, 11, 20, 12, 'canapa', 1); linea(28, 11, 27, 12, 'canapa', 0);
      return;
    }
    const sp: Riga[] = [[7, 21, 26], [8, 20, 27], [9, 20, 27], [10, 20, 27], [11, 20, 27], [12, 20, 27], [13, 20, 27], [14, 21, 26], [15, 22, 25]];
    forma(sp, m.mat, { luce: 0.25 });
    for (const x of [21, 22, 25, 26]) px(x, 11, 'ossidiana', 0);
    if (m.forma === 'volto') { tono(23, 12, 3, m.mat); tono(24, 13, 0, m.mat); for (const x of [22, 23, 24, 25]) tono(x, 14, 0, m.mat); if (m.dettaglio) { raw(22, 11, m.dettaglio); raw(25, 11, m.dettaglio); } }
    if (m.forma === 'senzaBocca') { tono(23, 12, 3, m.mat); if (m.dettaglio) for (let y = 12; y <= 14; y++) { raw(22, y, m.dettaglio); raw(25, y, m.dettaglio); } }
    if (m.forma === 'incrinata') { for (const [x, y] of [[21, 8], [22, 9], [22, 10], [24, 12], [25, 13], [26, 14]] as const) px(x, y, 'ossidiana', 1); if (m.dettaglio) { raw(23, 13, m.dettaglio); raw(24, 13, m.dettaglio); } }
    if (m.forma === 'corteccia') {
      for (const [x, y] of [[21, 8], [24, 9], [26, 13], [20, 13], [23, 14]] as const) px(x, y, 'muschio', 2);
      for (const [x, y] of [[22, 9], [22, 10], [25, 13], [25, 14]] as const) px(x, y, m.dettaglio ?? 'ferro', 3);
      raw(23, 12, '#8a1a12');
    }
  }
  function cappuccioDavanti(m: string): void {
    const sp: Riga[] = [[4, 21, 26], [5, 20, 27], [6, 19, 28], [7, 18, 29], [8, 18, 20], [8, 27, 29]];
    for (let y = 9; y <= 15; y++) sp.push([y, 18, 19], [y, 28, 29]);
    sp.push([16, 18, 21], [16, 26, 29], [17, 17, 21], [17, 26, 30], [18, 16, 21], [18, 26, 31], [19, 16, 20], [19, 27, 31], [20, 15, 19], [20, 28, 32]);
    forma(sp, m, { luce: 0.2 });
    for (let x = 20; x <= 27; x++) { tono(x, 7, '-', 'pelle'); tono(x, 8, '-', 'pelle'); tono(x, 9, '-', 'pelle'); }
    for (const [x, y] of [[20, 10], [27, 10], [20, 11], [27, 11]] as const) tono(x, y, 0, 'pelle');
  }
  function veloDavanti(m: string): void {
    const sp: Riga[] = [[4, 21, 26], [5, 20, 27], [6, 19, 28], [7, 19, 28], [8, 19, 20], [8, 27, 28]];
    for (let y = 9; y <= 17; y++) sp.push([y, 18, 19], [y, 28, 29]);
    for (let y = 18; y <= 24; y++) sp.push([y, 16, 20], [y, 27, 31]);
    forma(sp, m, { luce: 0.2, retino: true });
    for (let y = 9; y <= 24; y += 3) { tono(18, y, '-', m); tono(29, y + 1, '-', m); }
  }
  function pendente(p: Extract<VisAccessorio, { tipo: 'pendente' }>, lungo: boolean): void {
    const fondo = lungo ? 25 : 21;
    linea(22, 17, 22, fondo - 1, p.filo, 0); linea(25, 17, 24, fondo - 1, p.filo, 0);
    const cx = 23, y = fondo;
    switch (p.forma) {
      case 'piastra': for (const [x, yy, t] of [[22, y, 3], [23, y, 2], [24, y, 1], [22, y + 1, 1], [24, y + 1, 0], [22, y + 2, 1], [23, y + 2, 1], [24, y + 2, 0]] as const) px(x, yy, p.mat, t); break;
      case 'disco': forma([[y, 23, 24], [y + 1, 22, 25], [y + 2, 23, 24]], p.mat, { luce: 0.3 }); break;
      case 'goccia': forma([[y, 23, 24], [y + 1, 23, 24], [y + 2, 22, 25], [y + 3, 23, 24]], p.mat, { luce: 0.3 }); break;
      case 'cristalli': for (const [x, yy] of [[21, y - 1], [23, y], [24, y], [26, y - 1]] as const) { px(x, yy, p.mat, 3); px(x, yy + 1, p.mat, 2); } break;
      case 'catena': for (let x = 20; x <= 27; x++) px(x, y - 3 + Math.round(Math.abs(x - 23.5) * -0.6 + 2), p.mat, x % 2 ? 3 : 1); px(23, y, 'oro', 3); px(24, y, 'oro', 2); break;
      case 'canna': forma(rett(23, y, 24, y + 4), p.mat, { luce: 0.5 }); break;
      case 'ruota': forma([[y, 23, 24], [y + 1, 22, 25], [y + 2, 22, 25], [y + 3, 23, 24]], p.mat, { luce: 0.3 }); px(22, y, p.mat, 1); px(25, y + 3, p.mat, 0); px(21, y + 2, p.mat, 2); break;
      case 'scheggia': forma([[y, 23, 23], [y + 1, 23, 24], [y + 2, 23, 24], [y + 3, 24, 24]], p.mat, { luce: 0.5 }); break;
      case 'piuma': forma([[y, 24, 24], [y + 1, 23, 24], [y + 2, 23, 24], [y + 3, 23, 23], [y + 4, 22, 23]], p.mat, { luce: 0.5 }); px(24, y - 1, 'bronzo', 2); break;
      case 'simbolo': forma([[y, 23, 24], [y + 1, 22, 25], [y + 2, 23, 24], [y + 3, 23, 24]], p.mat, { luce: 0.3 }); px(25, y + 1, 'ferroNero', 0); break;
      case 'ghianda': forma([[y, 22, 25], [y + 1, 22, 25], [y + 2, 23, 24]], p.mat, { luce: 0.3 }); for (const x of [22, 23, 24, 25]) px(x, y, 'corteccia', 2); break;
    }
    if (p.luce) { for (const [x, yy] of [[cx, y + 1], [cx + 1, y + 1]] as const) if (mat(x, yy) === p.mat) px(x, yy, p.luce, 3); accendi(cx + 0.5, y + 1, p.luce, 5, 0.3); }
  }
  function spilla(s: Extract<VisAccessorio, { tipo: 'spilla' }>): void {
    const [x, y] = [27, 21];
    if (s.forma === 'placca') forma([[y, x, x + 1], [y + 1, x, x + 1], [y + 2, x, x + 1]], s.mat, { luce: 0.4 });
    if (s.forma === 'anelli') { px(x, y, s.mat, 3); px(x + 1, y, s.mat, 2); px(x, y + 1, s.mat, 2); px(x + 1, y + 1, s.mat, 1); px(x + 2, y, s.mat, 1); }
    if (s.forma === 'luna') { px(x + 1, y, s.mat, 3); px(x, y + 1, s.mat, 2); px(x + 1, y + 2, s.mat, 1); }
    if (s.forma === 'filo') { px(x, y, s.mat, 3); px(x + 1, y + 1, s.mat, 2); px(x, y + 2, s.mat, 2); px(x + 2, y + 1, s.mat, 1); }
  }
  function lanterna(forma_: Extract<VisAccessorio, { tipo: 'lanterna' }>['forma'], lx: number, ly: number): void {
    const telaio = forma_ === 'cieca' ? 'latta' : forma_ === 'custode' ? 'ferro' : forma_ === 'pontile' ? 'ferroNero' : 'ferro';
    const fiamma = forma_ === 'pontile' || forma_ === 'custode' ? 'luceVelata' : 'luce';
    px(lx + 2, ly, telaio, 2);
    forma([[ly + 1, lx + 1, lx + 3]], telaio);
    for (let y = ly + 2; y <= ly + 5; y++) {
      px(lx, y, telaio, 2); px(lx + 4, y, telaio, 0);
      for (let x = lx + 1; x <= lx + 3; x++) {
        const chiuso = forma_ === 'ronda' ? y <= ly + 3 : forma_ === 'cieca' ? x !== lx + 2 : false;
        if (chiuso) px(x, y, telaio, y === ly + 2 ? 2 : 1);
        else if (forma_ === 'custode' && (x + y) % 2 === 0) px(x, y, 'rame', 2);
        else px(x, y, fiamma, x === lx + 2 ? 3 : 2);
      }
    }
    forma([[ly + 6, lx, lx + 4]], telaio);
    accendi(lx + 2, ly + 4.5, fiamma, forma_ === 'cieca' ? 6 : 10, forma_ === 'cieca' ? 0.3 : 0.5, 'fiamma');
  }
  // gli oggetti alla cintura: prima il fianco sinistro (a schermo), poi il destro
  const fianchi: [number, number][] = [[17, 39], [26, 39]];
  let fianco = 0;
  function aFianco(o: Extract<VisAccessorio, { tipo: 'fianco' }>): void {
    const [x, y] = fianchi[fianco++ % 2]!;
    const m = o.mat ?? 'cuoio2';
    switch (o.forma) {
      case 'taccuino': forma(rett(x, y, x + 2, y + 3), m); px(x + 3, y + 1, 'carta', 3); px(x + 3, y + 2, 'carta', 2); px(x + 1, y - 1, 'cuoio', 0); break;
      case 'borsa': forma([[y, x, x + 2], [y + 1, x - 1, x + 3], [y + 2, x - 1, x + 3], [y + 3, x, x + 2]], m); px(x + 1, y + 1, 'ottone', 3); break;
      case 'astuccio': forma(rett(x + 1, y, x + 2, y + 4), m); px(x + 1, y - 1, 'ottone', 3); px(x + 2, y - 1, 'ottone', 1); break;
      case 'chiavi': px(x + 1, y, 'rame', 3); px(x + 2, y, 'rame', 2); for (const dx of [0, 1, 2]) { px(x + dx, y + 1, 'ferro', 2); px(x + dx, y + 2, 'ferro', 1); px(x + dx, y + 3 + (dx % 2), 'ferro', dx === 0 ? 3 : 1); } break;
      case 'corda': for (let yy = y; yy <= y + 9; yy++) px(x + 1 + (yy % 3 === 0 ? 0 : 0), yy, 'canapa', yy % 2 ? 3 : 1); break;
      case 'ventaglio': forma([[y, x + 1, x + 1], [y + 1, x, x + 2], [y + 2, x, x + 2], [y + 3, x - 1, x + 3]], 'carta', { luce: 0.3 }); for (const dx of [-1, 1, 3]) tono(x + dx, y + 3, 0, 'carta'); px(x + 1, y - 1, 'osso', 2); break;
      case 'lettera': forma(rett(x, y, x + 2, y + 2), 'carta', { luce: 0.3 }); px(x + 1, y + 1, 'mana', 1); break;
      case 'gabbia': forma(rett(x, y + 1, x + 2, y + 3), 'ottone', { tono: (xx, yy) => ((xx + yy) % 2 ? 1 : 3) }); px(x + 1, y + 2, 'cristallo', 3); px(x + 1, y, 'ottone', 2); accendi(x + 1, y + 2, 'cristallo', 4, 0.25); break;
      case 'uovo': forma([[y, x + 1, x + 1], [y + 1, x, x + 2], [y + 2, x, x + 2], [y + 3, x + 1, x + 1]], 'cristallo', { luce: 0.4 }); accendi(x + 1, y + 2, 'cristallo', 6, 0.35); break;
      case 'stella': for (const [dx, dy, mm] of [[1, 0, 'oro'], [0, 1, 'argento'], [1, 1, 'oro'], [2, 1, 'argento'], [1, 2, 'oro'], [0, 3, 'argento'], [2, 3, 'oro']] as const) px(x + dx, y + dy, mm, 3 - (dx === 2 ? 1 : 0)); break;
      case 'penna': px(x + 1, y - 1, 'osso', 3); px(x + 1, y, 'osso', 2); px(x + 1, y + 1, 'osso', 2); px(x + 1, y + 2, 'acciaio', 1); break;
      case 'specchio': forma([[y, x, x + 1], [y + 1, x - 1, x + 2], [y + 2, x, x + 1]], 'argento', { luce: 0.5 }); px(x, y + 1, 'vetro', 3); break;
      case 'cilindro': forma(rett(x, y, x + 2, y + 3), 'precursoreGrigio', { luce: 0.3 }); px(x + 1, y + 1, 'precursore', 3); break;
      case 'lente': forma([[y, x, x + 1], [y + 1, x, x + 1]], 'ottone', { luce: 0.4 }); px(x + 2, y, 'ottone', 1); px(x, y, 'vetro', 3); break;
      case 'reticolo': forma(rett(x, y, x + 2, y + 2), 'vetro', { tono: (xx, yy) => ((xx + yy) % 2 ? 1 : 3) }); px(x + 1, y + 1, 'cristallo', 3); accendi(x + 1, y + 1, 'cristallo', 4, 0.2); break;
      case 'fischietto': px(x + 1, y, 'osso', 3); px(x + 1, y + 1, 'osso', 2); px(x + 1, y + 2, 'osso', 2); px(x + 2, y + 1, 'ossidiana', 0); break;
    }
    if (o.luce) accendi(x + 1, y + 2, o.luce, 5, 0.3);
  }

  // ================================================================ scudi
  function scudoCon(sp: Riga[], bordo: string, faccia: string): Riga[] {
    forma(sp, bordo);
    const inn = erodi(sp);
    forma(inn, faccia, { luce: 0.3 });
    return inn;
  }
  function scudo(v: VisScudo): void {
    const bordo = v.bordo ?? 'ferro';
    switch (v.forma) {
      case 'scudo': {
        const faccia = v.faccia ?? 'legno';
        const sp: Riga[] = [[25, 30, 38]]; for (let y = 26; y <= 34; y++) sp.push([y, 29, 39]);
        sp.push([35, 30, 38], [36, 30, 38], [37, 31, 37], [38, 32, 36], [39, 33, 35], [40, 34, 34]);
        scudoCon(sp, bordo, faccia);
        if (faccia === 'legno') for (let y = 26; y <= 37; y++) { tono(32, y, '-', faccia); tono(36, y, '-', faccia); }
        if ((v.emblema ?? 'rombo') === 'rombo') for (const [x, y, t] of [[34, 28, 3], [33, 29, 2], [35, 29, 2], [32, 30, 2], [36, 30, 1], [33, 31, 2], [34, 32, 1]] as const) px(x, y, 'vernice', t);
        break;
      }
      case 'torre': {
        const faccia = v.faccia ?? 'legno';
        const sp: Riga[] = [[22, 30, 38]]; for (let y = 23; y <= 47; y++) sp.push([y, 29, 39]); sp.push([48, 30, 38]);
        scudoCon(sp, bordo, faccia);
        forma(rett(29, 27, 39, 27), bordo, { piatto: true }); forma(rett(29, 43, 39, 43), bordo, { piatto: true });
        for (let y = 24; y <= 46; y++) for (const x of [31, 34, 37]) tono(x, y, '-', faccia);
        forma([[33, 33, 35], [34, 32, 36], [35, 32, 36], [36, 33, 35]], bordo, { luce: 0.3 });
        for (const [x, y] of [[30, 27], [38, 27], [30, 43], [38, 43]] as const) px(x, y, bordo, 3);
        break;
      }
      case 'tondo': case 'disco': {
        const sp: Riga[] = [[25, 32, 37], [26, 31, 38], [27, 30, 39]];
        for (let y = 28; y <= 34; y++) sp.push([y, 29, 40]);
        sp.push([35, 30, 39], [36, 31, 38], [37, 32, 37]);
        if (v.forma === 'disco') {
          const m = v.faccia ?? 'precursore';
          forma(sp, m, { luce: 0.3 });
          if (v.specchio) { for (const [x, y] of [[31, 28], [32, 27], [31, 29], [32, 28], [33, 27], [30, 31]] as const) px(x, y, m, 3); raw(32, 28, '#e4f0f0'); raw(33, 27, '#c0d4d6'); }
          px(29, 31, m, 3); px(40, 31, m, 0);
        } else {
          const inn = scudoCon(sp, bordo, v.faccia ?? 'legno');
          void inn;
          if (v.emblema === 'osso') forma([[28, 33, 36], [29, 32, 37], [30, 31, 38], [31, 31, 38], [32, 32, 37], [33, 33, 36]], 'osso', { luce: 0.3 });
          px(34, 31, bordo, 3); px(35, 31, bordo, 1);
        }
        break;
      }
      case 'placca': {
        const sp: Riga[] = [[23, 31, 36], [24, 30, 38]];
        for (let y = 25; y <= 30; y++) sp.push([y, 29, 39]);
        for (let y = 31; y <= 38; y++) sp.push([y, 29, 40]);
        sp.push([39, 30, 39], [40, 30, 39], [41, 30, 38], [42, 31, 38], [43, 31, 37], [44, 33, 35]);
        const inn = scudoCon(sp, bordo, v.faccia ?? 'unghia');
        for (const [y] of inn) if (y % 3 === 0) for (let x = 33 + ((y * 7) % 4); x <= 39 - ((y * 5) % 3); x++) tono(x, y, '-', v.faccia ?? 'unghia');
        px(31, 27, v.faccia ?? 'unghia', 3); px(30, 31, v.faccia ?? 'unghia', 3);
        break;
      }
    }
  }

  // ================================================================ armi (mano sinistra a schermo: x 13..15, y 40..43)
  function arma(v: VisArma): void {
    const m = { lama: 'acciaio', manico: 'legno', elsa: 'ferro', pomo: 'ferro', testa: 'ferro', impugnatura: 'cuoio', ...v } as Required<Omit<VisArma, 'variante' | 'dettaglio'>> & VisArma;
    // le mani le mette la posa, sopra l'arma: qui l'impugnatura si disegna intera
    const asta = (x0: number, y0: number, y1: number, mm = m.manico) => { for (let y = y0; y <= y1; y++) { px(x0, y, mm, 2); px(x0 + 1, y, mm, 1); } };
    switch (v.forma) {
      case 'mani': return;
      case 'tirapugni': px(13, 41, m.testa, 3); px(14, 41, m.testa, 2); px(15, 41, m.testa, 1); px(13, 42, m.testa, 1); return;
      case 'pugnale':
        px(14, 39, m.pomo, 3); forma([[43, 12, 16]], m.elsa);
        lama(14, 15, 44, 50, m.lama, [3, 1]); px(14, 51, m.lama, 2);
        if (v.dettaglio) { raw(14, 39, v.dettaglio === 'madreperla' ? '#c8d0cc' : v.dettaglio); }
        return;
      case 'stiletto':
        px(14, 39, m.pomo, 2); forma([[43, 13, 15]], m.elsa);
        for (let y = 44; y <= 53; y++) px(14, y, m.lama, y % 3 ? 3 : 2);
        return;
      case 'spillone':
        forma([[36, 14, 15], [37, 13, 15], [38, 14, 15]], m.pomo, { luce: 0.4 });
        px(14, 39, m.lama, 2);
        for (let y = 43; y <= 52; y++) px(14, y, m.lama, y < 48 ? 3 : 2);
        return;
      case 'coltelloCurvo':
        px(14, 39, m.manico, 3);
        for (const [x, y, t] of [[14, 44, 3], [14, 45, 3], [13, 46, 3], [13, 47, 2], [12, 48, 2], [11, 48, 1], [12, 47, 1], [15, 44, 1], [15, 45, 1], [14, 46, 1]] as const) px(x, y, m.lama, t);
        return;
      case 'spadaCorta':
        px(14, 38, m.pomo, 3); px(15, 38, m.pomo, 1); px(14, 39, m.impugnatura, 2); px(15, 39, m.impugnatura, 1);
        forma([[43, 11, 18]], m.elsa);
        lama(14, 15, 44, 56, m.lama, [3, 1]); px(14, 57, m.lama, 2);
        return;
      case 'sciabola':
        px(14, 38, m.pomo, 3); px(15, 38, m.pomo, 1); px(14, 39, m.impugnatura, 2);
        forma([[43, 12, 17]], m.elsa); for (let y = 39; y <= 42; y++) px(16, y, m.elsa, y === 39 ? 3 : 1);
        for (let y = 44; y <= 57; y++) { const d = Math.floor((y - 44) / 5); px(14 - d, y, m.lama, 3); px(15 - d, y, m.lama, 1); }
        px(11, 58, m.lama, 2);
        return;
      case 'bastoneAnimato':
        forma([[37, 13, 15], [38, 14, 15], [39, 14, 15]], m.pomo, { luce: 0.4 });
        for (let y = 43; y <= 66; y++) { px(14, y, m.manico, 2); px(15, y, m.manico, 1); }
        px(14, 67, 'ferro', 2); px(15, 67, 'ferro', 1);
        return;
      case 'spada': case 'spadaCurva': {
        forma(rett(14, 37, 15, 38), m.pomo); px(14, 39, m.impugnatura, 2); px(15, 39, m.impugnatura, 1);
        forma([[43, 10, 19]], m.elsa); px(10, 44, m.elsa, 1); px(19, 44, m.elsa, 0);
        const curva = v.forma === 'spadaCurva';
        const toni = m.lama === 'neroLama' ? [2, 1] : [3, 1];
        for (let y = 44; y <= 60; y++) {
          const d = curva ? Math.round(((y - 44) / 16) ** 2 * 3) : 0;
          px(14 - d, y, m.lama, toni[0]!); px(15 - d, y, m.lama, toni[1]!);
          if (curva && v.dettaglio && y % 3 === 0 && y < 58) { px(16 - d, y, v.dettaglio, 3); }
        }
        const dt = curva ? 3 : 0;
        px(14 - dt, 61, m.lama, toni[0]!); px(15 - dt, 61, m.lama, 0); px(14 - dt, 62, m.lama, toni[1]!);
        if (!curva && v.dettaglio) { px(14, 47, v.dettaglio, 3); px(15, 48, v.dettaglio, 3); px(14, 49, v.dettaglio, 3); }
        if (v.variante === 'ammaccata') { tono(14, 54, 1); tono(14, 55, 0); }
        if (v.dettaglio && EMISSIVI.has(v.dettaglio)) accendi(curva ? 14 : 15, 50, v.dettaglio, 7, 0.25);
        return;
      }
      case 'spadone': {
        forma(rett(14, 34, 15, 35), m.pomo);
        for (let y = 36; y <= 39; y++) { px(14, y, m.impugnatura, y % 2 ? 2 : 1); px(15, y, m.impugnatura, y % 2 ? 1 : 0); }
        forma([[43, 9, 20]], m.elsa); px(9, 44, m.elsa, 1); px(20, 44, m.elsa, 0);
        const largo = v.variante === 'largo' || v.variante === 'storto';
        for (let y = 44; y <= 74; y++) {
          const d = v.variante === 'storto' && y > 54 && y < 68 ? 1 : 0;
          if (largo) lama(12 - d, 16 - d, y, y, m.lama, [3, 2, 2, 1, 0]);
          else lama(13, 16, y, y, m.lama, [3, 2, 1, 0]);
        }
        if (!largo) for (let y = 45; y <= 66; y++) px(14, y, m.lama, 1);
        lama(14, 15, 75, 76, m.lama, [2, 0]);
        if (v.dettaglio) { for (const y of [47, 51, 55, 59, 63, 67]) px(14, y, v.dettaglio, 3); if (EMISSIVI.has(v.dettaglio)) accendi(14.5, 57, v.dettaglio, 8, 0.22); }
        return;
      }
      case 'lancia': case 'bastone': {
        // asta tenuta dritta accanto al corpo, la mano la stringe
        const x = 11;
        const cima = v.forma === 'bastone' ? 8 : 6;
        for (let y = cima; y <= 69; y++) { px(x, y, m.manico, 2); px(x + 1, y, m.manico, 1); }
        const pt = m.lama;
        switch (v.forma === 'bastone' ? 'bastone' : v.variante ?? 'foglia') {
          case 'foglia': forma([[0, 11, 12], [1, 10, 13], [2, 10, 13], [3, 10, 13], [4, 11, 12], [5, 11, 12]], pt, { luce: 0.3 }); forma(rett(11, 6, 12, 7), m.testa); break;
          case 'stretta': forma([[0, 11, 11], [1, 11, 12], [2, 11, 12], [3, 11, 12], [4, 11, 12], [5, 10, 13]], pt, { luce: 0.3 }); forma(rett(11, 6, 12, 7), m.testa); break;
          case 'tridente': for (const xx of [9, 11, 12, 14]) { px(xx, 1, pt, 3); px(xx, 2, pt, 2); } px(12, 0, pt, 3); forma([[3, 9, 14], [4, 10, 13]], pt, { luce: 0.3 }); forma(rett(11, 5, 12, 6), m.testa); break;
          case 'ritorto': for (const [xx, y, t] of [[11, 1, 3], [12, 2, 2], [11, 3, 3], [12, 4, 1], [11, 5, 2]] as const) px(xx, y, pt, t); forma(rett(11, 6, 12, 7), m.testa); break;
          case 'dente': forma([[0, 11, 11], [1, 11, 12], [2, 10, 12], [3, 10, 13], [4, 10, 13], [5, 10, 13], [6, 11, 13], [7, 11, 12]], pt, { luce: 0.3 }); px(12, 3, 'cristallo', 2); break;
          case 'ramo': for (const [xx, y] of [[10, 18], [13, 30], [10, 46], [13, 58]] as const) px(xx, y, m.manico, 1); forma([[1, 11, 11], [2, 11, 12], [3, 11, 12], [4, 11, 12], [5, 11, 12]], pt, { luce: 0.3 }); break;
          case 'asta': forma([[2, 11, 11], [3, 11, 12], [4, 11, 12], [5, 11, 12]], pt, { luce: 0.3 }); break;
          case 'bastone':
            forma(rett(11, 7, 12, 8), 'ottone');
            if (v.variante === 'cristallo') forma([[4, 11, 12], [5, 10, 13], [6, 11, 12]], v.dettaglio ?? 'vetro', { luce: 0.4 });
            break;
        }
        if (v.dettaglio && v.forma === 'lancia' && EMISSIVI.has(v.dettaglio)) accendi(11.5, 3, v.dettaglio, 5, 0.25);
        return;
      }
      case 'mazza':
        px(14, 39, m.pomo, 2);
        asta(14, 43, 52);
        if (v.variante === 'borchie') { forma(rett(13, 53, 16, 58), m.testa); for (const [x, y] of [[12, 54], [12, 57], [17, 54], [17, 57]] as const) px(x, y, m.testa, x < 14 ? 3 : 0); }
        else {
          forma(rett(13, 53, 16, 58), m.testa);
          for (const y of [54, 57]) { px(12, y, m.testa, 3); px(17, y, m.testa, 0); }
          if (v.dettaglio) { px(13, 55, v.dettaglio, 3); px(16, 56, v.dettaglio, 2); }
        }
        px(14, 59, m.testa, 2); px(15, 59, m.testa, 0);
        return;
      case 'verga':
        for (let y = 37; y <= 39; y++) px(14, y, m.manico, y === 37 ? 3 : 2);
        for (let y = 43; y <= 52; y++) { px(14, y, m.manico, 2); px(15, y, m.manico, 1); }
        if (v.dettaglio) { px(14, 52, v.dettaglio, 3); accendi(14.5, 51, v.dettaglio, 5, 0.25); }
        return;
      case 'ascia':
        px(14, 39, m.manico, 3);
        if (v.variante === 'corta') {
          asta(14, 43, 53);
          forma([[47, 12, 13], [48, 11, 13], [49, 10, 13], [50, 10, 13], [51, 10, 13], [52, 11, 13], [53, 12, 13]], m.lama, { luce: 0.3 });
        } else {
          asta(14, 43, 63);
          forma([[54, 12, 13], [55, 11, 13], [56, 10, 13], [57, 9, 13], [58, 9, 13], [59, 10, 13], [60, 11, 13], [61, 12, 13]], m.lama, { luce: 0.3 });
          forma([[56, 16, 17], [57, 16, 18], [58, 16, 17]], m.testa);
        }
        return;
      case 'piccozza':
        px(14, 39, m.manico, 3);
        asta(14, 43, 62);
        forma([[55, 8, 21], [56, 9, 20]], m.lama, { luce: 0.2 });
        px(8, 56, m.lama, 0); px(7, 56, m.lama, 1); px(21, 54, m.lama, 2); px(22, 54, m.lama, 1);
        if (v.dettaglio) { px(14, 55, v.dettaglio, 3); px(15, 56, v.dettaglio, 2); }
        return;
      case 'bipenne':
        px(14, 39, m.manico, 3);
        asta(14, 43, 80);
        {
          const t = 14; // la testa scende in fondo al manico
          const ala: Riga[] = [[52, 12, 13], [53, 10, 13], [54, 9, 13], [55, 8, 13], [56, 8, 13], [57, 8, 13], [58, 9, 13], [59, 10, 13], [60, 12, 13]].map(([y, x0, x1]) => [y! + t, x0!, x1!] as Riga);
          forma(ala, m.lama, { luce: 0.3 });
          forma(spec(ala).map(([y, x0, x1]) => [y, x0 - 18, x1 - 18] as Riga), m.lama, { scuro: 1 });
          if (v.variante === 'scure') { for (let x = 16; x <= 21; x++) for (let y = 52 + t; y <= 60 + t; y++) togli(x, y); forma([[52 + t, 16, 16], [53 + t, 16, 17], [54 + t, 16, 17], [55 + t, 16, 18]], m.testa); }
          if (v.dettaglio) { for (const [x, y] of [[9, 55], [8, 57], [10, 59], [11, 53]] as const) px(x, y + t, v.dettaglio, 3); }
        }
        return;
      case 'falce': {
        const x = 11;
        for (let y = 4; y <= 69; y++) { px(x, y, m.manico, 2); px(x + 1, y, m.manico, 1); }
        forma([[0, 12, 12], [1, 12, 13], [2, 12, 14], [3, 12, 14], [4, 12, 14], [5, 12, 14], [6, 12, 14], [7, 12, 14], [8, 12, 13], [9, 12, 13]], m.lama, { luce: 0.4 });
        forma(rett(11, 10, 12, 11), m.testa);
        return;
      }
      case 'martello': {
        // un'arma a due mani: il manico è lungo, la testa sta in fondo
        const t = 14;
        px(14, 39, m.manico, 3);
        asta(14, 43, 61 + t);
        if (v.variante === 'maglio') { forma(rett(11, 55 + t, 17, 59 + t), m.testa, { luce: 0.2 }); forma(sposta([[56, 18, 19], [57, 18, 20], [58, 18, 19]], 0, t), m.testa, { scuro: 1 }); }
        else if (v.variante === 'piccone') { forma(sposta([[55, 7, 21], [56, 8, 20], [57, 12, 17]], 0, t), m.testa, { luce: 0.25 }); px(7, 56 + t, m.testa, 1); px(21, 56 + t, m.testa, 0); }
        else if (v.variante === 'battente') {
          for (let y = 43; y <= 58 + t; y++) { px(14, y, m.manico, y % 2 ? 3 : 1); px(15, y, m.manico, y % 2 ? 1 : 0); }
          forma(sposta([[57, 12, 17], [58, 11, 18], [59, 11, 18], [60, 11, 18], [61, 12, 17]], 0, t), m.testa, { luce: 0.3 });
        } else if (v.variante === 'feltro') { forma(rett(11, 55 + t, 18, 59 + t), m.testa, { luce: 0.25, retino: true }); }
        else { forma(rett(11, 55 + t, 18, 59 + t), m.testa, { luce: 0.25 }); forma([[57 + t, 19, 20]], m.lama); }
        if (v.dettaglio) { px(13, 56 + t, v.dettaglio, 3); px(14, 57 + t, v.dettaglio, 2); }
        return;
      }
      case 'arcoCorto': case 'arcoLungo': {
        const [y0, y1, amp] = v.forma === 'arcoLungo' ? [18, 66, 5] : [26, 58, 4];
        const mezzo = (y0 + y1) / 2;
        for (let y = y0; y <= y1; y++) {
          const x = 10 + Math.round(amp * Math.sin(Math.PI * (y - y0) / (y1 - y0)));
          const legno = v.variante === 'composito' && Math.abs(y - mezzo) > 16 ? 'corno' : m.manico;
          px(x, y, legno, 2); if (Math.abs(y - mezzo) <= 6) px(x - 1, y, legno, 3);
          if (y > y0 && y < y1) px(10 - (amp - 4), y, m.impugnatura === 'cuoio' ? 'corda' : m.impugnatura, 3);
        }
        if (v.variante === 'composito') for (const y of [mezzo - 9, mezzo + 9]) { const x = 10 + Math.round(amp * Math.sin(Math.PI * (y - y0) / (y1 - y0))); px(x, y, 'ottone', 3); }
        px(10, y0 - 1, 'osso', 3); px(10, y1 + 1, 'osso', 2);
        return;
      }
      case 'balestra': {
        const pesante = v.variante !== 'leggera';
        for (let y = 37; y <= 58; y++) { if (y >= 40 && y <= 42) continue; px(14, y, m.manico, 2); px(15, y, m.manico, 1); }
        const [a0, a1] = pesante ? [7, 22] : [9, 20];
        for (let x = a0; x <= a1; x++) { const dy = Math.round(Math.abs(x - 14.5) / 3); px(x, 57 - dy, m.lama, x < 15 ? 3 : 1); }
        for (let x = a0 + 1; x <= a1 - 1; x++) px(x, 55, 'corda', 2);
        if (pesante) { for (let y = 45; y <= 51; y++) px(16, y, 'ferro', y === 45 ? 3 : 1); px(17, 51, 'ferro', 1); }
        if (v.dettaglio) { px(14, 47, v.dettaglio, 3); px(15, 48, v.dettaglio, 2); }
        return;
      }
      case 'fionda':
        for (let y = 43; y <= 52; y++) px(14, y, 'corda', y % 2 ? 3 : 2);
        forma([[53, 13, 15], [54, 13, 15], [55, 14, 14]], m.impugnatura);
        px(14, 53, 'pietra', 3);
        return;
      case 'coltelli': {
        px(14, 39, m.impugnatura, 2); forma([[43, 13, 15]], m.elsa); lama(14, 14, 44, 49, m.lama, [3]); px(15, 44, m.lama, 1);
        if (v.dettaglio) { px(15, 46, v.dettaglio, 2); px(15, 48, v.dettaglio, 2); }
        return;
      }
      case 'roncola': {
        asta(14, 43, 50);
        px(15, 51, m.manico, 1);
        for (let g = 40; g <= 215; g += 3) {
          const r = (g * Math.PI) / 180, cx = 10, cy = 48;
          px(Math.round(cx + 6 * Math.cos(r)), Math.round(cy + 6 * Math.sin(r)), m.lama, g > 120 && g < 175 ? 3 : 2);
          if (g < 160) px(Math.round(cx + 5 * Math.cos(r)), Math.round(cy + 5 * Math.sin(r)), m.lama, 1);
        }
        return;
      }
    }
  }

  /** I coltelli di scorta, infilati nella cintura. */
  function coltelliAllaCintura(v: VisArma): void {
    const imp = v.impugnatura ?? 'cuoio', lm = v.lama ?? 'acciaio';
    for (const dx of [0, 2]) { px(18 + dx, 38, imp, 2); px(18 + dx, 39, imp, 1); px(18 + dx, 40, lm, 3); px(18 + dx, 41, lm, 2); px(18 + dx, 42, lm, 1); }
  }

  // ================================================================ arco e balestra in mira (verso sinistra)
  /** L'arco teso: dritto nella mano sinistra, la corda tirata fino alla mano destra, la freccia in mezzo. */
  function arcoInMira(v: VisArma, mn: Record<'sx' | 'dx', [number, number]>): void {
    const legnoArco = v.manico ?? 'legno';
    const gx = Math.round(mn.sx[0]) - 1, gy = Math.round(mn.sx[1]), cx = Math.round(mn.dx[0]);
    const [mezza, amp] = v.forma === 'arcoLungo' ? [22, 5] : [15, 4];
    const y0 = gy - mezza, y1 = gy + mezza;
    const punte: [number, number][] = [];
    for (let y = y0; y <= y1; y++) {
      const q = Math.abs(y - gy) / mezza;
      const x = gx + Math.round(amp * q * q);
      const legno = v.variante === 'composito' && q > 0.7 ? 'corno' : legnoArco;
      px(x, y, legno, q < 0.3 ? 3 : 2); if (q < 0.3) px(x - 1, y, legno, 2);
    }
    if (v.variante === 'composito') for (const y of [gy - 15, gy + 15]) px(gx + Math.round(amp * (15 / mezza) ** 2), y, 'ottone', 3);
    punte.push([gx + amp, y0], [gx + amp, y1]);
    px(gx + amp, y0 - 1, 'osso', 3); px(gx + amp, y1 + 1, 'osso', 2);
    for (const [x, y] of punte) linea(x, y, cx, gy, 'corda', 1);
    // la freccia: l'asta fino alla punta oltre l'arco
    for (let x = gx - 3; x < cx; x++) px(x, gy, 'legno', 2);
    px(gx - 4, gy, 'ferro', 3); px(gx - 3, gy - 1, 'ferro', 2); px(gx - 3, gy + 1, 'ferro', 1);
  }
  /** Le penne della freccia, davanti alla mano che tira. */
  function frecciaInMira(v: VisArma, mn: Record<'sx' | 'dx', [number, number]>): void {
    if (v.forma === 'balestra') return;
    const cx = Math.round(mn.dx[0]), gy = Math.round(mn.sx[1]);
    for (const dx of [-5, -4, -3]) { px(cx + dx, gy - 1, 'piuma', dx === -5 ? 2 : 3); px(cx + dx, gy + 1, 'piuma', 1); }
  }
  /** La balestra imbracciata: il calcio alla spalla, il fusto teso verso sinistra, l'arco d'acciaio in punta. */
  function balestraInMira(v: VisArma, mn: Record<'sx' | 'dx', [number, number]>): void {
    const pesante = v.variante !== 'leggera';
    const gy = Math.round(mn.sx[1]), cx = Math.round(mn.dx[0]), fx = Math.round(mn.sx[0]) - 3;
    const legno = v.manico ?? 'legno', arcoM = v.lama ?? 'acciaio';
    // il fusto, e il calcio più alto contro la spalla
    forma([[gy, fx, cx + 2], [gy + 1, fx + 1, cx + 2]], legno);
    forma([[gy - 1, cx - 1, cx + 3], [gy + 2, cx - 1, cx + 3], [gy + 3, cx, cx + 3]], legno, { scuro: 1 });
    // l'arco: verticale in punta, le punte piegate verso chi tira
    const mezza = pesante ? 9 : 7;
    for (let y = gy - mezza; y <= gy + mezza; y++) { const d = Math.abs(y - gy); px(fx + Math.round((d * d) / (mezza * 3)), y, arcoM, d < 3 ? 3 : 2); }
    const tx = fx + Math.round(mezza / 3), noce = fx + (pesante ? 11 : 9);
    linea(tx, gy - mezza, noce, gy - 1, 'corda', 2); linea(tx, gy + mezza, noce, gy + 1, 'corda', 2);
    // il quadrello sopra il fusto
    for (let x = fx - 2; x <= noce; x++) px(x, gy - 1, 'ferro', x < fx ? 3 : 1);
    if (pesante) { px(cx - 4, gy + 2, 'ferro', 2); px(cx - 4, gy + 3, 'ferro', 1); px(cx - 5, gy + 3, 'ferro', 1); px(fx - 1, gy + 1, 'ferro', 2); px(fx - 2, gy + 1, 'ferro', 1); }
    if (v.dettaglio) { px(fx + 6, gy, v.dettaglio, 3); px(fx + 7, gy, v.dettaglio, 2); }
  }

  // ================================================================ compagni (davanti)
  function bestia(c: Extract<VisAccessorio, { tipo: 'compagno' }>): void {
    const o = 50;
    if (c.specie === 'puma') {
      const m = 'puma';
      forma(qui(o, [[53, 1, 4], [54, -1, 1], [55, -3, -1], [56, -5, -3], [57, -7, -5], [56, -8, -7], [55, -8, -7], [54, -8, -7], [53, -8, -7], [52, -7, -6]]), m, { scuro: 1 });
      forma(qui(o, [...rett(21, 57, 22, 66), [67, 20, 23]]), m, { scuro: 2 });
      forma(qui(o, [...rett(8, 57, 10, 61), ...rett(8, 62, 9, 66), [67, 8, 11]]), m, { scuro: 2 });
      forma(qui(o, [[51, 5, 9], [51, 18, 22], [52, 4, 23], ...rett(3, 53, 24, 57), [58, 5, 23], [59, 14, 22]]), m, { luce: 0.15 });
      forma(qui(o, [[50, 21, 24], [51, 22, 25], [52, 23, 26], [53, 24, 26]]), m, { luce: 0.3 });
      forma(qui(o, [[48, 24, 27], [49, 23, 29], [50, 23, 30], [51, 24, 30], [52, 25, 28]]), m, { luce: 0.3 });
      px(o + 24, 47, m, 2); px(o + 27, 47, m, 1);
      raw(o + 28, 49, '#c8a040'); px(o + 30, 50, 'criniera', 0);
      // il pelo che ai fianchi si accende di rosso
      for (let y = 54; y <= 57; y++) for (let x = 7; x <= 19; x++) if ((x * 7 + y * 3) % 5 < 2) raw(o + x, y, RAMPE['pumaFuoco']![y === 56 ? 2 : 1]);
      forma(qui(o, [...rett(3, 53, 8, 59), ...rett(4, 60, 6, 66), [67, 4, 7]]), m);
      forma(qui(o, [...rett(18, 56, 21, 60), ...rett(19, 61, 21, 66), [67, 18, 22]]), m);
      return;
    }
    const m = 'lupo';
    forma(qui(o, [[50, 1, 4], [51, 0, 3], ...rett(-1, 52, 2, 56), [57, 0, 2], [58, 0, 2], [59, 0, 1], [60, 1, 1]]), m, { scuro: 1, retino: true });
    forma(qui(o, [...rett(14, 57, 15, 66), [67, 14, 16]]), m, { scuro: 2 });
    forma(qui(o, [...rett(6, 56, 8, 59), ...rett(7, 60, 8, 66), [67, 7, 9]]), m, { scuro: 2 });
    forma(qui(o, [[50, 6, 17], [51, 4, 19], ...rett(3, 52, 20, 55), [56, 4, 19], [57, 11, 18]]), m, { luce: 0.15, retino: true });
    forma(qui(o, rett(17, 46, 22, 52)), m, { luce: 0.3 });
    forma(qui(o, [[45, 19, 24], [46, 18, 26], [47, 18, 28], [48, 19, 28], [49, 20, 25]]), m, { luce: 0.3 });
    forma(qui(o, [[42, 20, 20], [43, 19, 20], [44, 19, 21], [42, 23, 23], [43, 22, 23], [44, 22, 23]]), m, { luce: 0.5 });
    raw(o + 23, 46, '#b8b088'); px(o + 28, 47, 'criniera', 1); px(o + 27, 48, 'criniera', 0);
    for (const [x, y] of [[20, 50], [21, 50], [21, 51], [20, 49]] as const) px(o + x, y, 'peloBianco', 2);
    forma(qui(o, [...rett(3, 52, 7, 57), ...rett(4, 58, 6, 60), ...rett(5, 61, 6, 66), [67, 5, 7]]), m);
    forma(qui(o, [...rett(16, 56, 18, 60), ...rett(16, 61, 17, 66), [67, 16, 18]]), m);
  }

  // ================================================================ pose
  // La figura si disegna sempre dritta, con le braccia lungo i fianchi e l'arma appesa alla mano sinistra (a schermo).
  // Per le altre pose le braccia si staccano dal corpo e si rimontano a pezzi (braccio, avambraccio) fra la spalla, il
  // gomito e la mano della posa; le armature e gli accessori sulle braccia vanno con loro. L'arma si disegna su uno
  // strato suo e si porta nella mano, ribaltata e inclinata a scaletta, così i pixel restano puliti.
  type Punto = [number, number];
  /** Una trasformazione: da un punto della figura dritta al suo posto nella posa, e ritorno. */
  interface Mappa { avanti: (x: number, y: number) => Punto; indietro: (x: number, y: number) => Punto }
  /** Il tratto di braccio da (asse, y0) a (asse, y1) della figura dritta, portato sul segmento da `da` ad `a`. */
  function tratto(asse: number, y0: number, y1: number, da: Punto, a: Punto): Mappa {
    const dx = a[0] - da[0], dy = a[1] - da[1], l = Math.hypot(dx, dy) || 1;
    const ux = dx / l, uy = dy / l, s = l / (y1 - y0);
    return {
      avanti: (x, y) => [da[0] + (y - y0) * s * ux + (x - asse) * uy, da[1] + (y - y0) * s * uy - (x - asse) * ux],
      indietro: (x, y) => { const wx = x - da[0], wy = y - da[1]; return [asse + wx * uy - wy * ux, y0 + (wx * ux + wy * uy) / s]; },
    };
  }
  /** L'arma: il punto `g` della presa va in `h`; ribaltata (la punta in su) e inclinata di `k` pixel per riga. */
  function presa(g: Punto, h: Punto, ribalta: boolean, k: number): Mappa {
    const sg = ribalta ? -1 : 1;
    return {
      avanti: (x, y) => { const dy = y - g[1]; return [h[0] + (x - g[0]) + sg * k * dy, h[1] + sg * dy]; },
      indietro: (x, y) => { const dy = sg * (y - h[1]); return [g[0] + (x - h[0]) - sg * k * dy, g[1] + dy]; },
    };
  }
  /** Copia sulla tela i pixel di `src` portati da `m`, nel rettangolo [x0, y0, x1, y1] della tela; `dentro` filtra l'origine. */
  function porta(src: Strato, m: Mappa, box: [number, number, number, number], dentro: (x: number, y: number) => boolean = () => true): void {
    usa(tela);
    for (let y = Math.max(0, Math.floor(box[1])); y <= Math.min(H - 1, Math.ceil(box[3])); y++)
      for (let x = Math.max(0, Math.floor(box[0])); x <= Math.min(W - 1, Math.ceil(box[2])); x++) {
        const [fx, fy] = m.indietro(x, y), sx = Math.round(fx), sy = Math.round(fy);
        if (!dentro(sx, sy) || sx < 0 || sx >= W || sy + src.oy < 0 || sy + src.oy >= src.h) continue;
        const j = (sy + src.oy) * W + sx;
        if (!src.M[j]) continue;
        const i = id(x, y); M[i] = src.M[j]!; T[i] = src.T[j]!; R[i] = src.R[j]!; V[i] = src.V[j]!;
      }
  }
  /** Il rettangolo che contiene i punti portati da `m`, con un margine. */
  function scatola(m: Mappa, angoli: Punto[], margine = 3): [number, number, number, number] {
    const p = angoli.map(([x, y]) => m.avanti(x, y));
    return [Math.min(...p.map((q) => q[0])) - margine, Math.min(...p.map((q) => q[1])) - margine, Math.max(...p.map((q) => q[0])) + margine, Math.max(...p.map((q) => q[1])) + margine];
  }

  // le armi: come si tengono. `g` è il punto dell'arma dritta sotto la mano sinistra; per le due mani `g2` quello
  // sotto la destra, più vicino al fondo dell'impugnatura
  const ASTE = new Set<FormaArma>(['lancia', 'bastone', 'falce']);
  const SENZA_GIRO = new Set<FormaArma>(['mani', 'tirapugni', 'fionda']);
  const presaDi = (v: VisArma, p: Posa): { g: Punto; g2: Punto; ribalta: boolean } => {
    if (ASTE.has(v.forma)) return p === 'dueMani' ? { g: [11.5, 37], g2: [11.5, 46], ribalta: false } : { g: [11.5, 41], g2: [11.5, 41], ribalta: false };
    if (v.forma === 'spadone') return { g: [14.5, 41.5], g2: [14.5, 37.5], ribalta: true };
    if (v.forma === 'bipenne' || v.forma === 'martello') return { g: [14.5, 47.5], g2: [14.5, 41.5], ribalta: true };
    return { g: [14.5, 41.5], g2: [14.5, 41.5], ribalta: !SENZA_GIRO.has(v.forma) };
  };

  // ================================================================ composizione
  const posa: Posa = f.posa ?? (conScudo ? 'guardia' : 'dritta');
  const femmina = a.corpo === 'femminile';
  const sh = femmina ? 1 : 0; // le braccia più vicine al busto
  const corpo = strato();
  usa(corpo);
  const luciCorpo = luci.length;
  gambe();
  const fatta = armatura(f.armatura);
  if (femmina) restringi();
  if (arco) linea(30, 20, 17, 37, 'cuoio', 1);
  testa(fatta.scollo); volto();
  if (fatta.dopoTesta) fatta.dopoTesta();
  if (!testaCoperta) CAPELLI[a.capelli]();
  else if (cappuccio && a.capelli !== 'rasati') forma([[7, 20, 22], [8, 20, 21]], 'capelli', { scuro: 1 });
  if (!femmina) BARBE_F[a.barba]();
  for (const cp of acc('capelli')) {
    if (testaCoperta) continue;
    if (cp.forma === 'filo') for (const [x, y, t] of [[19, 9, 3], [19, 10, 2], [18, 11, 3], [19, 12, 2], [18, 13, 3], [19, 14, 2], [18, 15, 1]] as const) px(x, y, cp.mat, t);
    else for (const [x, y, t] of [[27, 6, 2], [28, 5, 3], [29, 4, 3], [30, 3, 2], [31, 2, 3], [32, 1, 2], [29, 5, 1], [31, 3, 1]] as const) px(x, y, cp.mat, t);
  }
  for (const ms of acc('maschera')) maschera(ms);
  for (const o of acc('orecchio')) forma([[10, 28, 29], [11, 28, 30], [12, 28, 30], [13, 29, 29]], o.mat, { luce: 0.4 });
  if (cappuccio) cappuccioDavanti(cappuccio.mat);
  else if (velo) veloDavanti(velo.mat);
  if (mantello) {
    forma([[18, 19, 21], [18, 26, 28], [19, 17 + sh, 21], [19, 26, 30 - sh], [20, 16 + sh, 18], [20, 29, 31 - sh]], mantello.mat);
    px(22, 19, 'oro', 3); px(25, 19, 'oro', 2); px(23, 19, 'oro', 1); px(24, 19, 'oro', 1);
    if (mantello.mat === 'scarlatto') { raw(28, 19, '#b07a5a'); raw(30 - sh, 20, '#b07a5a'); }
  }
  acc('pendente').forEach((p, i) => pendente(p, i > 0 || (!femmina && a.barba === 'lunga')));
  for (const s of acc('spilla')) spilla(s);
  for (const p of acc('petto')) {
    if (p.forma === 'sfera') { forma([[26, 22, 24], [27, 21, 25], [28, 21, 25], [29, 22, 24]], p.mat, { luce: 0.3 }); px(23, 27, p.luce ?? 'luceBianca', 3); px(22, 28, p.luce ?? 'luceBianca', 2); accendi(23, 27.5, p.luce ?? 'luceBianca', 7, 0.35); }
    else { forma(rett(21, 25, 25, 28), p.mat, { luce: 0.3 }); for (let x = 21; x <= 25; x += 2) tono(x, 26, 0, p.mat); }
  }
  acc('bracciale').forEach((b, i) => {
    const [x0, x1, s] = i === 0 ? [13 + sh, 15 + sh, 0] : [32 - sh, 34 - sh, 1];
    forma(rett(x0, 37, x1, 38), b.mat, { scuro: s, luce: 0.4 });
    if (b.dettaglio) { px(x0 + 1, 37, b.dettaglio, 3 - s); px(x0, 38, b.dettaglio, 2 - s); px(x1, 38, b.dettaglio, 1); }
    if (b.luce && b.dettaglio) accendi((x0 + x1) / 2, 37.5, b.dettaglio, 4, 0.25);
  });
  for (const _ of acc('innesto')) {
    for (const [x, y, t] of [[14, 34, 2], [14, 35, 1], [15, 36, 2], [14, 37, 1], [14, 38, 2], [15, 39, 1]] as const) px(x + sh, y, 'legnoNero', t);
    raw(14 + sh, 36, '#6a8a3a');
  }
  for (const o of acc('fianco')) aFianco(o);
  if (f.arma.forma === 'coltelli') coltelliAllaCintura(f.arma);
  acc('anello').forEach((r, i) => {
    const [x, y] = i === 0 ? [13 + sh, 41] : conScudo ? [15 + sh, 41] : [33 - sh, 41];
    px(x, y, r.mat, 3);
    if (r.gemma) { px(x, y + 1, r.gemma, 3); if (EMISSIVI.has(r.gemma)) accendi(x, y + 1, r.gemma, 3, 0.25); }
  });

  // segni della Marea
  if (segni.has('occhi') && !opz.palpebre && !acc('maschera').some((m) => m.forma !== 'erbe')) {
    for (const [x, y] of [[22, 11], [25, 11]] as const) if (mat(x, y) === 'raw') raw(x, y, OCCHIO_LUCE);
    luci.push({ x: 23.5, y: 11, r: 5, colore: [143, 195, 203], forza: 0.35, tipo: 'fredda' });
  }
  if (segni.has('vene')) {
    for (const [x, y] of [[22, 17], [23, 18], [22, 16], [20, 9], [20, 10], [14 + sh, 38], [15 + sh, 39], [14 + sh, 40], [33 - sh, 38], [33 - sh, 39], [34 - sh, 40], [23, 19], [24, 20]] as const)
      if (mat(x, y) === 'pelle') raw(x, y, VENA);
  }
  if (segni.has('unghie')) for (const [x, y] of [[13 + sh, 43], [14 + sh, 43], [33 - sh, 43], [34 - sh, 43]] as const) if (mat(x, y) === 'pelle') raw(x, y, UNGHIA);
  if (segni.has('pelle')) for (let i = 0; i < W * H; i++) if (M[i] === 'pelle') { const x = i % W, y = (i / W) | 0; if (y > 16 && (x * 3 + y * 5) % 4 === 0) T[i] = Math.max(0, T[i]! - 1); else if ((x + y) % 5 === 0 && x !== 22 && x !== 25) T[i] = Math.max(0, T[i]! - 1); }

  // le braccia: dove sono nella figura dritta, e dove vanno nella posa
  const assi = { sx: 14 + sh, dx: 33 - sh };
  const spalle: Record<'sx' | 'dx', Punto> = { sx: [assi.sx, 24.5], dx: [assi.dx, 24.5] };
  const nelBraccio = (lato: 'sx' | 'dx') => (x: number, y: number) =>
    y >= 25 && y <= 44 && (lato === 'sx' ? x <= (y >= 43 ? 15 : 15 + sh) && x >= 7 : x >= (y >= 43 ? 32 : 32 - sh) && x <= 40);
  const manoDritta: Record<'sx' | 'dx', Punto> = { sx: [assi.sx, 41.5], dx: [assi.dx + 0.5, 41.5] };
  let palmi: Record<'sx' | 'dx', Punto> = manoDritta;
  const conArma = f.arma.forma !== 'mani';
  const lanternaInMano = !!lanterne.length && !conScudo && (posa === 'dritta' || posa === 'guardia');

  if (posa !== 'dritta') {
    // gomiti e mani della posa; per le due mani le mani stanno dove l'arma ha l'impugnatura
    const p = presaDi(f.arma, posa);
    let gomiti: Record<'sx' | 'dx', Punto>;
    let mArma: Mappa | undefined;
    if (posa === 'guardia') {
      palmi = { sx: [9, 37], dx: conScudo ? [35, 36] : [37, 41] };
      gomiti = { sx: [11, 31], dx: conScudo ? [37, 31] : [36, 32] };
      if (conArma) mArma = presa(p.g, [palmi.sx[0] + 0.5, palmi.sx[1]], p.ribalta, ASTE.has(f.arma.forma) ? 0 : 1 / 3);
    } else if (posa === 'dueMani') {
      const k = ASTE.has(f.arma.forma) ? 1 / 3 : 1 / 2;
      mArma = presa(p.g2, [26.5, 41], p.ribalta, k);
      const [gx, gy] = mArma.avanti(p.g[0], p.g[1]);
      palmi = { sx: [gx - 0.5, gy], dx: [26, 41] };
      gomiti = { sx: [11, 32], dx: [36, 33] };
    } else {
      palmi = { sx: [4, 24], dx: [28, 24] };
      gomiti = { sx: [9, 24], dx: [38, 28] };
    }
    // l'arma, appesa alla mano come nella figura dritta, su uno strato suo
    let armaS: Strato | undefined, sue: Luce[] = [];
    if (mArma) {
      armaS = strato(H + 80, 40);
      usa(armaS);
      const l0 = luci.length;
      arma(f.arma);
      sue = luci.splice(l0);
      usa(corpo);
    }
    // le braccia lasciano il corpo
    const braccia = strato();
    for (let y = 25; y <= 44; y++) for (let x = 0; x < W; x++) {
      if (!nelBraccio('sx')(x, y) && !nelBraccio('dx')(x, y)) continue;
      const i = id(x, y);
      if (!corpo.M[i]) continue;
      braccia.M[i] = corpo.M[i]!; braccia.T[i] = corpo.T[i]!; braccia.R[i] = corpo.R[i]!; braccia.V[i] = corpo.V[i]!;
      togli(x, y);
    }
    const pezzi = (['sx', 'dx'] as const).flatMap((lato) => [
      { lato, m: tratto(assi[lato], 24.5, 31.5, spalle[lato], gomiti[lato]), y0: 25, y1: 32 },
      { lato, m: tratto(assi[lato], 31.5, 41.5, gomiti[lato], palmi[lato]), y0: 31, y1: 44 },
    ]);
    // le luci sulle braccia (bracciali, gemme) vanno con loro
    for (const l of luci.slice(luciCorpo)) {
      const lato = nelBraccio('sx')(Math.round(l.x), Math.round(l.y)) ? 'sx' : nelBraccio('dx')(Math.round(l.x), Math.round(l.y)) ? 'dx' : null;
      if (!lato) continue;
      const pz = pezzi.find((q) => q.lato === lato && l.y >= q.y0 && l.y <= q.y1)!;
      [l.x, l.y] = pz.m.avanti(l.x, l.y);
    }
    // le gambe si aprono
    divarica(posa === 'guardia' ? 3 : 4, fatta.orlo);
    usa(corpo);
    lanterneAllaCintura(lanternaInMano);
    incolla(corpo);
    if (armaS && mArma) {
      porta(armaS, mArma, scatola(mArma, [[0, -40], [W - 1, -40], [0, H + 39], [W - 1, H + 39]], 1));
      for (const l of sue) { const [x, y] = mArma.avanti(l.x, l.y); luci.push({ ...l, x, y }); }
    }
    if (posa === 'mira') { if (f.arma.forma === 'balestra') balestraInMira(f.arma, palmi); else arcoInMira(f.arma, palmi); }
    // prima il braccio lontano dall'arma, poi l'altro; dentro ogni braccio prima il braccio, poi l'avambraccio
    for (const pz of pezzi) {
      const angoli: Punto[] = [[assi[pz.lato] - 4, pz.y0], [assi[pz.lato] + 4, pz.y0], [assi[pz.lato] - 4, pz.y1], [assi[pz.lato] + 4, pz.y1]];
      porta(braccia, pz.m, scatola(pz.m, angoli), (x, y) => y >= pz.y0 && y <= pz.y1 && nelBraccio(pz.lato)(x, y));
    }
    if (posa === 'mira') frecciaInMira(f.arma, palmi);
  } else {
    usa(corpo);
    lanterneAllaCintura(lanternaInMano);
    incolla(corpo);
  }
  usa(tela);
  if (f.scudo) {
    const sc = strato();
    usa(sc);
    const l0 = luci.length;
    scudo(f.scudo);
    const sue = luci.splice(l0);
    const d: Punto = [Math.round(palmi.dx[0] - manoDritta.dx[0]), Math.round(palmi.dx[1] - manoDritta.dx[1])];
    porta(sc, { avanti: (x, y) => [x + d[0], y + d[1]], indietro: (x, y) => [x - d[0], y - d[1]] }, [0, 0, W - 1, H - 1]);
    for (const l of sue) luci.push({ ...l, x: l.x + d[0], y: l.y + d[1] });
  }
  if (lanternaInMano) {
    const [hx, hy] = palmi.dx;
    px(Math.round(hx - 0.5), Math.round(hy + 2.5), 'ferro', 2); px(Math.round(hx - 0.5), Math.round(hy + 3.5), 'ferro', 1);
    lanterna(lanterne[0]!.forma, Math.round(hx - 2.5), Math.round(hy + 4.5));
  }
  for (const c of compagni) if (c.specie !== 'cavallo') { bestia(c); break; }

  // ---------------------------------------------------------------- aiuti della composizione
  type Px = readonly [string | null, number, string | null, [string, number] | null];
  function leggi(x: number, y: number): Px { const i = id(x, y); return [M[i] ?? null, T[i] ?? 0, R[i] ?? null, V[i] ?? null]; }
  function scrivi(x: number, y: number, k: Px): void { const i = id(x, y); M[i] = k[0]; T[i] = k[1]; R[i] = k[2]; V[i] = k[3]; }
  /** Copia uno strato sulla tela; dove copre il fondo, il fondo prende la sua ombra a destra e sotto. */
  function incolla(src: Strato): void {
    usa(tela);
    const sotto = new Set<number>();
    for (let i = 0; i < W * H; i++) if (src.M[i]) { M[i] = src.M[i]!; T[i] = src.T[i]!; R[i] = src.R[i]!; V[i] = src.V[i]!; }
    for (let i = 0; i < W * H; i++) {
      if (!src.M[i]) continue;
      const x = i % W, y = (i / W) | 0;
      for (const [nx, ny] of [[x + 1, y], [x, y + 1]] as const) {
        if (!inb(nx, ny)) continue;
        const j = id(nx, ny);
        if (src.M[j] || !M[j] || M[j] === 'raw' || EMISSIVI.has(M[j]!) || sotto.has(j)) continue;
        sotto.add(j); T[j] = Math.max(0, T[j]! - 1);
      }
    }
  }
  /** Le gambe si aprono: ogni riga sotto i fianchi si sposta in fuori di `n` pixel in fondo. Un orlo lungo resta chiuso. */
  function divarica(n: number, orlo?: number): void {
    usa(corpo);
    for (let y = 42; y < H; y++) {
      const off = Math.round((n * (y - 41)) / 27);
      if (!off) continue;
      const riga = Array.from({ length: W }, (_, x) => leggi(x, y));
      for (let x = 0; x < W; x++) togli(x, y);
      const metti = (x: number, k: Px) => { if (x >= 0 && x < W && k[0]) scrivi(x, y, k); };
      for (let x = 0; x < W; x++) metti(x < 24 ? x - off : x + off, riga[x]!);
      if (orlo && y <= orlo && riga[23]![0] && riga[23]![0] === riga[24]![0]) {
        // la falda si allarga: la stoffa di qua e di là della cucitura riempie lo spazio, la cucitura resta al centro
        for (let x = 24 - off; x <= 23 + off; x++) metti(x, riga[x < 24 ? 22 : 25]!);
        for (const x of [23, 24]) if (leggi(x, y)[0]) tono(x, y, '-');
      }
    }
  }
  /** Le lanterne che non stanno in mano pendono dalla cintura. */
  function lanterneAllaCintura(primaInMano: boolean): void {
    lanterne.forEach((l, i) => {
      if (i === 0 && primaInMano) return;
      const [x, y] = fianchi[fianco++ % 2]!; px(x + 2, y - 1, 'ferro', 1); lanterna(l.forma, x - 1, y);
    });
  }
  /**
   * Il corpo femminile: le spalle perdono un pixel per parte e le braccia si avvicinano, così il busto scende dritto
   * invece che a cuneo; il seno è accennato con l'ombra. Il busto è già vestito: si stringe con quello che indossa.
   */
  function restringi(): void {
    for (let y = 17; y <= 44; y++) {
      const riga = Array.from({ length: W }, (_, x) => leggi(x, y));
      for (let x = 0; x < W; x++) togli(x, y);
      const metti = (x: number, k: Px) => { if (x >= 0 && x < W && k[0]) scrivi(x, y, k); };
      for (let x = 0; x <= 15; x++) metti(x + 1, riga[x]!);
      for (let x = 32; x < W; x++) metti(x - 1, riga[x]!);
      if (y > 30) { for (let x = 16; x <= 31; x++) metti(x, riga[x]!); continue; }
      for (let x = 17; x <= 30; x++) metti(x, riga[16 + Math.round(((x - 17) * 15) / 13)]!);
    }
    for (let x = 18; x <= 29; x++) if (x !== 23 && x !== 24) tono(x, 28, '-');
    for (const x of [19, 20, 26]) tono(x, 25, '+');
  }

  // ================================================================ colori
  const rampa = (m: string): Rampa => (m === 'pelle' ? PELLI[a.pelle] ?? PELLI['chiara']! : m === 'capelli' ? CHIOME[a.coloreCapelli] ?? CHIOME['castano']!
    : m === 'barba' ? CHIOME[a.coloreBarba] ?? CHIOME['castano']! : RAMPE[m] ?? RAMPE['ferro']!);
  const C: (RGB | null)[] = new Array(W * H).fill(null);
  for (let i = 0; i < W * H; i++) {
    const m = M[i];
    if (!m) continue;
    let c = hex(m === 'raw' ? R[i]! : rampa(m)[T[i]!]!);
    const v = V[i];
    if (v && m === 'pelle') c = mescola(c, hex(rampa(v[0])[Math.max(0, T[i]! - 1)]!), v[1]);
    C[i] = c;
  }
  // contorno: dal lato della luce più chiaro, dal lato in ombra quasi nero; sempre del colore del materiale
  const buio = hex(BUIO);
  const O: (RGB | null)[] = new Array(W * H).fill(null);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = id(x, y); if (M[i]) continue;
    const vic = (nx: number, ny: number) => (inb(nx, ny) && M[id(nx, ny)] ? id(nx, ny) : -1);
    const sx = vic(x - 1, y), su = vic(x, y - 1), dx = vic(x + 1, y), giu = vic(x, y + 1);
    const lOmbra = sx >= 0 ? sx : su, lLuce = dx >= 0 ? dx : giu;
    const j = lOmbra >= 0 ? lOmbra : lLuce; if (j < 0) continue;
    const mj = M[j]!;
    const base = mj === 'raw' ? buio : hex(rampa(mj)[0]);
    O[i] = mescola(base, buio, lOmbra >= 0 ? 0.78 : 0.4);
  }
  // la luce calda delle fiamme sulle cose vicine
  for (const l of luci) {
    if (l.tipo !== 'fiamma') continue;
    for (let i = 0; i < W * H; i++) {
      const c = C[i], m = M[i];
      if (!c || (m && EMISSIVI.has(m))) continue;
      const d = Math.hypot((i % W) - l.x, ((i / W) | 0) - l.y);
      if (d < l.r) C[i] = mescola(c, l.colore, (1 - d / l.r) ** 2 * 0.42);
    }
  }
  const pixel = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const c = C[i] ?? O[i]; if (!c) continue;
    pixel[i * 4] = c[0]; pixel[i * 4 + 1] = c[1]; pixel[i * 4 + 2] = c[2]; pixel[i * 4 + 3] = 255;
  }
  // il pavimento: lastre scure e l'ombra dei piedi
  const pav = RAMPE['pietra']!.map(hex);
  for (let y = 69; y < H; y++) for (let x = 2; x < W - 2; x++) {
    const i = id(x, y); if (pixel[i * 4 + 3]) continue;
    const bordo = Math.min(x - 2, W - 3 - x);
    if (bordo < 3 && (x + y) % 2 === 0) continue;
    if (bordo < 3 && (x * 7 + y) % 3 === 0) continue;
    let c = pav[y === 69 ? 2 : 1]!;
    if ((x === 11 || x === 33 || x === 58) && y > 69) c = pav[0]!;
    if (y === 69 && x % 9 === 4) c = pav[3]!;
    const ex = (x - 23.5) / 12, ey = (y - 69.5) / 1.6;
    if (ex * ex + ey * ey < 1) c = pav[0]!;
    if (compagni.length) { const qx = (x - 62) / 18; if (qx * qx + ey * ey < 1) c = pav[0]!; }
    pixel[i * 4] = c[0]; pixel[i * 4 + 1] = c[1]; pixel[i * 4 + 2] = c[2]; pixel[i * 4 + 3] = 255;
  }
  return { W, H, pixel, luci };
}
