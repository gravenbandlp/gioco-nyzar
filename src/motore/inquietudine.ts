// La venatura horror (ottobre 2026): quello che il gioco fa quando il personaggio sta male, quando è notte fonda
// e, di rado, quando qualcosa lo nota. Qui le regole pure; i suoni e gli effetti a schermo stanno in ui/inquietudine.ts.
// - Tormento da SOGLIA_INQUIETUDINE in su: l'orlo dello schermo scurisce, una parola della prosa cambia per un
//   istante, una campana lontana suona stonata.
// - Tormento da SOGLIA_NARRATORE in su: le opzioni che hanno una descrizione `inquieta` a volte mostrano quella.
// - Ferite da SOGLIA_INQUIETUDINE in su: un battito sotto la musica, più veloce quanto più sono alte.
// - Fra mezzanotte e le quattro, ora del giocatore: i paragrafi `{mezzanotte}` compaiono.
// - Una volta ogni molte ore di gioco, il diario si ritrova una pagina che il personaggio non ha scritto.
import { MAX_NEGATIVA } from './regole';
import { annota } from './diario';
import type { Stato } from './personaggio';
import type { TContenuti, TOpzione, TStorylet } from './contenuto';

export const SOGLIA_INQUIETUDINE = 5;
export const SOGLIA_NARRATORE = 6;
/** Fra due pagine «notate» passano almeno tre ore di gioco. */
export const PAUSA_NOTATI = 3 * 60 * 60 * 1000;
/** Ogni scelta ha una possibilità su quaranta di lasciare la pagina, quando la pausa è passata. */
export const PROBABILITA_NOTATO = 1 / 40;

/** Quanto pesa una statistica negativa, da 0 (sotto la soglia) a 1 (al massimo). */
export function intensita(valore: number, da = SOGLIA_INQUIETUDINE): number {
  if (valore < da) return 0;
  return Math.min(1, (valore - da + 1) / (MAX_NEGATIVA - da + 1));
}

export interface Inquietudine {
  tormento: number; // 0..1
  ferite: number; // 0..1
}

export function inquietudineDi(s: Stato): Inquietudine {
  return {
    tormento: intensita(s.quality['tormento'] ?? 0),
    ferite: intensita(s.quality['ferite'] ?? 0),
  };
}

/** Notte fonda per chi gioca: dalla mezzanotte alle quattro, ora locale. */
export function notteFonda(d: Date = new Date()): boolean {
  return d.getHours() < 4;
}

function hash(t: string): number {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * La descrizione da mostrare: quella `inquieta` se il Tormento è alto e il caso (fisso per dieci minuti, così non
 * cambia a ogni ridisegno) lo vuole; altrimenti la normale. Cambia il tono, mai gli effetti.
 */
export function descrizioneDi(s: Stato, st: TStorylet, i: number, o: TOpzione, ora: number): string | undefined {
  if (o.inquieta && (s.quality['tormento'] ?? 0) >= SOGLIA_NARRATORE && hash(`${st.id}#${i}#${Math.floor(ora / 600000)}`) % 2 === 0) return o.inquieta;
  return o.descrizione;
}

/**
 * Dopo una scelta, di rado, una pagina che il personaggio non ha scritto finisce nel diario. Una riga sola, mai
 * la stessa due volte. Restituisce l'id della riga, o niente.
 */
export function forseNotato(s: Stato, c: Pick<TContenuti, 'notati' | 'aree'>, ora: number, caso: () => number = Math.random, verifica: (r: string[]) => boolean = () => true): string | undefined {
  const giocato = s.tempo?.totale ?? 0;
  const usati = new Set(s.notati ?? []);
  if (giocato - (s.notatoAl ?? 0) < PAUSA_NOTATI) return undefined;
  if (caso() >= PROBABILITA_NOTATO) return undefined;
  const liberi = c.notati.filter((n) => !usati.has(n.id) && verifica(n.requisiti));
  if (!liberi.length) return undefined;
  const n = liberi[Math.floor(caso() * liberi.length)]!;
  s.notati = [...usati, n.id];
  s.notatoAl = giocato;
  annota(s, {
    quando: ora,
    storylet: `notato.${n.id}`,
    scena: '',
    luogo: c.aree.find((a) => a.id === s.area)?.nome ?? '',
    titolo: '',
    testo: n.testo.replaceAll('{nome}', s.nome),
  });
  return n.id;
}
