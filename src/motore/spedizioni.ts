// Spedizioni: luoghi fuori città e sotterranei (docs/piano-capitolo-1.md, "Sistemi da aggiungere").
// Ci si entra da uno storylet con `vai`. I ripetibili dell'area sono stanze: se ne vedono alcune alla
// volta, scelte a caso e rimescolate ogni volta che la profondità sale. Una stanza superata (un esito che
// alza la profondità) non ricompare nella stessa visita. Uscendo la profondità e le stanze superate si
// azzerano. L'ordine delle stanze (l'ingresso prima, il piano di sopra dopo) si dà con i requisiti sulla
// profondità.
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
  const passate = new Set(s.stanzePassate ?? []);
  const seme = hash(`${s.nome}|${a.id}|${profondita(s, a.id)}`);
  return ripetibili
    .filter((st) => !passate.has(st.id))
    .map((st) => ({ st, k: hash(`${seme}|${st.id}`) }))
    .sort((x, y) => x.k - y.k)
    .slice(0, a.spedizione.stanze)
    .map((x) => x.st);
}

/** Cambia area; se si lascia una spedizione la sua profondità torna a zero. */
export function cambiaArea(s: Stato, nuova: string, c: TContenuti): void {
  const vecchia = areaAttuale(s, c);
  if (vecchia?.spedizione && nuova !== vecchia.id) {
    delete s.quality[chiaveProfondita(vecchia.id)];
    delete s.stanzePassate;
    delete s.seguitiDa;
  }
  s.area = nuova;
}

/**
 * Dopo un esito giocato in spedizione: se la profondità è salita, la stanza è superata e non ricompare
 * in questa visita. Se l'esito era di un seguito aperto da una stanza, è superata anche quella. Un esito che
 * apre un seguito si ricorda la stanza da cui parte.
 */
export function segnaStanza(s: Stato, c: TContenuti, da: string, profonditaPrima: number, segue?: string): void {
  const a = areaAttuale(s, c);
  if (!a?.spedizione) return;
  if (segue) s.seguitiDa = { ...(s.seguitiDa ?? {}), [segue]: s.seguitiDa?.[da] ?? da };
  if (profondita(s, a.id) <= profonditaPrima) return;
  const passate = new Set(s.stanzePassate ?? []);
  passate.add(da);
  const origine = s.seguitiDa?.[da];
  if (origine) passate.add(origine);
  s.stanzePassate = [...passate];
}

/** Torna indietro da una spedizione: si perde la profondità raggiunta. */
export function ritirati(s: Stato, c: TContenuti): boolean {
  const a = areaAttuale(s, c);
  if (!a?.spedizione) return false;
  cambiaArea(s, a.spedizione.ritorno, c);
  return true;
}
