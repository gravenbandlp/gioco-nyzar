// Il diario: le scene che il giocatore sceglie di conservare per rileggerle (come il Journal di Fallen London).
import type { Stato } from './personaggio';

export interface PaginaDiario {
  quando: number; // ora reale in cui è stata annotata
  storylet: string;
  scena: string; // titolo dello storylet
  luogo: string; // nome dell'area
  titolo: string; // titolo dell'esito
  testo: string; // testo dell'esito
  prima?: string; // testo della scena che ha portato all'esito
  immagine?: string;
  esito?: 'successo' | 'fallimento';
}

export const DIARIO_MAX = 300;

const chiave = (p: Pick<PaginaDiario, 'storylet' | 'titolo' | 'testo'>) => `${p.storylet}|${p.titolo}|${p.testo.length}|${p.testo.slice(0, 40)}`;

export function nelDiario(s: Stato, p: Pick<PaginaDiario, 'storylet' | 'titolo' | 'testo'>): boolean {
  const k = chiave(p);
  return (s.diario ?? []).some((x) => chiave(x) === k);
}

/** Annota una pagina. Se è già nel diario non la duplica; oltre il limite toglie la più vecchia. */
export function annota(s: Stato, p: PaginaDiario): boolean {
  if (nelDiario(s, p)) return false;
  s.diario = [...(s.diario ?? []), p];
  if (s.diario.length > DIARIO_MAX) s.diario.splice(0, s.diario.length - DIARIO_MAX);
  return true;
}

export function strappa(s: Stato, quando: number): void {
  s.diario = (s.diario ?? []).filter((x) => x.quando !== quando);
}
