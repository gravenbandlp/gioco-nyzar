// Il tempo di gioco: si conta fra un clic e l'altro, per il totale e per la serie della scena aperta.
// Una pausa lunga (la scheda in background, il giocatore che si alza) conta al massimo un minuto, così il
// contatore misura il gioco e non il tempo con la pagina aperta.
import type { Stato } from './personaggio';

export const PAUSA_MAX = 5 * 60 * 1000; // oltre i cinque minuti senza un clic, il giocatore era altrove
const PAUSA_CONTATA = 60 * 1000;

export interface TempoDiGioco { totale: number; serie: Record<string, number>; ultimo?: number }

export function tempoDi(s: Stato): TempoDiGioco {
  return (s.tempo ??= { totale: 0, serie: {} });
}

/** Un'azione del giocatore: aggiunge il tempo dall'azione precedente al totale e, se c'è, alla serie. */
export function segnaTempo(s: Stato, ora: number, serie?: string): void {
  const t = tempoDi(s);
  if (t.ultimo !== undefined) {
    const d = ora - t.ultimo;
    const conta = d <= 0 ? 0 : d <= PAUSA_MAX ? d : PAUSA_CONTATA;
    t.totale += conta;
    if (serie && conta) t.serie[serie] = (t.serie[serie] ?? 0) + conta;
  }
  t.ultimo = ora;
}

/** La pagina va in background: chiude il conto fino a ora e lo riapre al ritorno. */
export function sospendiTempo(s: Stato, ora: number, serie?: string): void {
  segnaTempo(s, ora, serie);
  delete tempoDi(s).ultimo;
}
