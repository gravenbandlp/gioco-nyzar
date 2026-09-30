// Spedizioni: luoghi fuori città e sotterranei (docs/piano-capitolo-1.md, "Sistemi da aggiungere").
// Ci si entra da uno storylet con `vai`. I ripetibili dell'area sono stanze: se ne vedono alcune alla
// volta, scelte a caso e rimescolate ogni volta che la profondità sale. Uscendo la profondità si azzera.
import type { TArea, TContenuti, TStorylet } from './contenuto';
import { storyletDisponibili, type Stato } from './personaggio';
import { hash } from './crisi';

export const chiaveProfondita = (area: string) => `profondita.${area}`;

export function areaAttuale(s: Stato, c: TContenuti): TArea | undefined {
  return c.aree.find((a) => a.id === s.area);
}

export const inSpedizione = (s: Stato, c: TContenuti) => !!areaAttuale(s, c)?.spedizione;

/** Aree da cui non si esce con la mappa: penalità e spedizioni. */
export const areaChiusa = (a?: TArea) => !!a && (a.penalita || !!a.spedizione);

export function profondita(s: Stato, area: string): number {
  return s.quality[chiaveProfondita(area)] ?? 0;
}

/** Le stanze visibili adesso: fra i ripetibili disponibili, N a caso secondo la profondità. */
export function stanzeVisibili(s: Stato, c: TContenuti): TStorylet[] {
  const a = areaAttuale(s, c);
  const ripetibili = storyletDisponibili(s, c).filter((st) => st.ripetibile);
  if (!a?.spedizione) return ripetibili;
  const seme = hash(`${s.nome}|${a.id}|${profondita(s, a.id)}`);
  return ripetibili
    .map((st) => ({ st, k: hash(`${seme}|${st.id}`) }))
    .sort((x, y) => x.k - y.k)
    .slice(0, a.spedizione.stanze)
    .map((x) => x.st);
}

/** Cambia area; se si lascia una spedizione la sua profondità torna a zero. */
export function cambiaArea(s: Stato, nuova: string, c: TContenuti): void {
  const vecchia = areaAttuale(s, c);
  if (vecchia?.spedizione && nuova !== vecchia.id) delete s.quality[chiaveProfondita(vecchia.id)];
  s.area = nuova;
}

/** Torna indietro da una spedizione: si perde la profondità raggiunta. */
export function ritirati(s: Stato, c: TContenuti): boolean {
  const a = areaAttuale(s, c);
  if (!a?.spedizione) return false;
  cambiaArea(s, a.spedizione.ritorno, c);
  return true;
}
