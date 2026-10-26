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
  // con `rimescola` il seme prende anche il valore di quella quality: a ogni discesa stanze diverse
  const rimescola = a.spedizione.rimescola ? `|${s.quality[a.spedizione.rimescola] ?? 0}` : '';
  const seme = hash(`${s.nome}|${a.id}|${profondita(s, a.id)}${rimescola}`);
  return ripetibili
    .filter((st) => !passate.has(st.id))
    .map((st) => ({ st, k: hash(`${seme}|${st.id}`) }))
    .sort((x, y) => x.k - y.k)
    .slice(0, a.spedizione.stanze)
    .map((x) => x.st);
}

/** Il piano a cui sei, per le spedizioni che contano i piani (`piani`); altrimenti undefined. */
export function piano(s: Stato, c: TContenuti): number | undefined {
  const a = areaAttuale(s, c);
  if (a?.spedizione?.piani === undefined) return undefined;
  return a.spedizione.piani + Math.floor(profondita(s, a.id) / (a.spedizione.stanzePerPiano ?? 1)) + 1;
}

/**
 * L'usura del campanile rovescio (docs/piano-torre.md): ogni Ferita sono 2 PF in meno all'inizio di uno scontro, ogni
 * due punti di Tormento un dado in meno alla difesa mentale e ogni due di Contaminazione uno alla difesa fisica.
 */
export function usura(s: Stato, c: TContenuti): { pf: number; mentale: number; fisica: number } | undefined {
  if (!areaAttuale(s, c)?.spedizione?.usura) return undefined;
  const q = (k: string) => s.quality[k] ?? 0;
  return { pf: Math.round(q('ferite') * 2), mentale: Math.floor(q('tormento') / 2), fisica: Math.floor(q('contaminazione') / 2) };
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
  scartaSeguitiRimasti(s, c);
}

// per ogni seguito, le aree delle scene che lo aprono
const apertiDa = new WeakMap<TContenuti, Map<string, Set<string | undefined>>>();

/** Un seguito della spedizione: sta nella sua area e lo aprono solo scene della stessa area. */
function seguitoDiSpedizione(c: TContenuti, id: string): string | undefined {
  let m = apertiDa.get(c);
  if (!m) {
    m = new Map();
    for (const st of c.storylet) for (const o of st.opzioni) for (const e of [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta]) {
      if (e?.segue) m.set(e.segue, (m.get(e.segue) ?? new Set()).add(st.area));
    }
    apertiDa.set(c, m);
  }
  const area = c.storylet.find((st) => st.id === id)?.area;
  if (!area || !c.aree.find((a) => a.id === area)?.spedizione) return undefined;
  return [...(m.get(id) ?? [])].every((a) => a === area) ? area : undefined;
}

/**
 * Chi esce da una spedizione lascia lì i suoi seguiti: la seconda fase di un boss da cui si è scappati non si
 * gioca dalla Superficie, e alla prossima discesa si ricomincia. Vale anche per gli stati salvati prima.
 */
export function scartaSeguitiRimasti(s: Stato, c: TContenuti): void {
  const fuori = (id: string) => { const a = seguitoDiSpedizione(c, id); return !!a && a !== s.area; };
  if (s.sospesiPrima) {
    s.sospesiPrima = s.sospesiPrima.filter((id) => !fuori(id));
    if (!s.sospesiPrima.length) delete s.sospesiPrima;
  }
  if (s.sospeso && fuori(s.sospeso)) {
    delete s.sospeso;
    const sotto = s.sospesiPrima?.pop();
    if (sotto) s.sospeso = sotto;
    if (s.sospesiPrima && !s.sospesiPrima.length) delete s.sospesiPrima;
  }
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
