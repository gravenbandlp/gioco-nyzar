// Il genere del protagonista nei testi (ottobre 2026). Dove la prosa si accorda con chi gioca, il testo porta le due
// forme fra graffe, prima la maschile e poi la femminile:
//   Sei stanc{o|a} e bagnat{o|a} fino alle ossa.
//   «{Ragazzo|Ragazza}, vieni qui.»
//   {Ti dà del fratello|Ti chiama sorella} davanti a tutti.
// Le forme non contengono graffe né altre barre. I titoli restano invariati (Capitano della Guardia).
// Il gioco riscrive i testi dei contenuti per il corpo del personaggio prima di disegnarli: applicaGenere.
import type { TContenuti } from './contenuto';

export type Genere = 'maschile' | 'femminile';

export const RX_GENERE = /\{([^{}|]*)\|([^{}|]*)\}/g;

/** Il testo con la forma del genere al posto di ogni segno. */
export function declina(testo: string, g: Genere): string {
  return testo.includes('|') ? testo.replace(RX_GENERE, (_, m: string, f: string) => (g === 'femminile' ? f : m)) : testo;
}

/** Errori nei segni di genere di un testo, per il controllo dei contenuti. */
export function erroriGenere(testo: string): string[] {
  const errori: string[] = [];
  for (const m of testo.matchAll(/\{[^{}]*\|[^{}]*\}/g)) {
    if ((m[0].match(/\|/g) ?? []).length !== 1) errori.push(`segno di genere con più di due forme: "${m[0]}"`);
  }
  const resto = testo.replace(RX_GENERE, '');
  if (/\{[^{}]*\|/.test(resto) || /\|[^{}]*\}/.test(resto)) errori.push(`segno di genere non chiuso o annidato: "${testo.slice(0, 60)}"`);
  return errori;
}

// i testi con un segno: per ogni oggetto dei contenuti, la chiave e il testo com'è scritto
type Originali = { dove: Record<string | number, unknown>; chiave: string | number; testo: string }[];
const originali = new WeakMap<TContenuti, Originali>();
const applicato = new WeakMap<TContenuti, Genere>();

function raccogli(c: TContenuti): Originali {
  const fuori: Originali = [];
  const visita = (o: unknown) => {
    if (!o || typeof o !== 'object') return;
    const d = o as Record<string | number, unknown>;
    for (const k of Object.keys(d)) {
      const v = d[k];
      if (typeof v === 'string') { if (v.includes('|') && /\{[^{}|]*\|[^{}|]*\}/.test(v)) fuori.push({ dove: d, chiave: k, testo: v }); }
      else visita(v);
    }
  };
  visita(c);
  return fuori;
}

/** Riscrive i testi dei contenuti per il genere del personaggio. Non fa niente se è già quello. */
export function applicaGenere(c: TContenuti, g: Genere): void {
  if (applicato.get(c) === g) return;
  let o = originali.get(c);
  if (!o) { o = raccogli(c); originali.set(c, o); }
  for (const t of o) t.dove[t.chiave] = declina(t.testo, g);
  applicato.set(c, g);
}

/** Il genere dei testi per un aspetto: il corpo femminile, altrimenti maschile (anche i salvataggi di prima). */
export const genereDi = (aspetto: { corpo?: string } | undefined): Genere => (aspetto?.corpo === 'femminile' ? 'femminile' : 'maschile');
