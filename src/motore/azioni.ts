// Risoluzione delle opzioni degli storylet, spostamenti e negozi.
import { probabilita, tira, type Rng } from './dadi';
import { DIFFICOLTA, peDaProbabilita, type Difficolta } from './regole';
import type { TContenuti, TEsito, TOpzione, TStorylet } from './contenuto';
import {
  abilitaEffettiva, applicaEffetti, assegnaPE, requisitiMancanti, spendiCandele, scarta, aggiornaTempo,
  type Crescita, type Stato, type Variazione,
} from './personaggio';
import {
  combattenteDaStato, feriteDopo, iniziaCombattimento, probabilitaVittoria, etichettaCombattimento,
  type StatoCombattimento,
} from './combattimento';

export interface Anteprima {
  disponibile: boolean;
  motivo?: string;
  mancanti: string[];
  costo: number;
  prova?: { abilita: string; pool: number; richiesti: number; probabilita: number; difficolta: string };
  combattimento?: { probabilita: number; etichetta: string };
}

function migliorAbilita(s: Stato, opz: TOpzione, c: TContenuti): { abilita: string; pool: number } {
  const prova = opz.prova!;
  const lista = Array.isArray(prova.abilita) ? prova.abilita : [prova.abilita];
  let best = { abilita: lista[0]!, pool: -1 };
  for (const a of lista) {
    const pool = s.attributi[prova.attributo] + abilitaEffettiva(s, a, c);
    if (pool > best.pool) best = { abilita: a, pool };
  }
  return best;
}

const cacheVittoria = new Map<string, number>();
function vittoria(s: Stato, scontroId: string, c: TContenuti): number {
  const sc = c.scontri.find((x) => x.id === scontroId);
  if (!sc) throw new Error(`Scontro sconosciuto: ${scontroId}`);
  const pg = combattenteDaStato(s, c);
  const chiave = `${scontroId}|${pg.attacco}|${pg.difesa}|${pg.pfMax}|${pg.danno}|${pg.riduzione}|${pg.ignora}|${pg.iniziativa}`;
  let p = cacheVittoria.get(chiave);
  if (p === undefined) { p = probabilitaVittoria(pg, sc, c); cacheVittoria.set(chiave, p); }
  return p;
}

export function anteprima(s: Stato, opz: TOpzione, c: TContenuti): Anteprima {
  const costo = opz.costo ?? 1;
  const mancanti = requisitiMancanti(s, opz.requisiti);
  const a: Anteprima = { disponibile: mancanti.length === 0 && s.candele >= costo, mancanti, costo };
  if (mancanti.length === 0 && s.candele < costo) a.motivo = 'Non hai abbastanza candele.';
  if (opz.prova) {
    const { abilita, pool } = migliorAbilita(s, opz, c);
    const richiesti = DIFFICOLTA[opz.prova.difficolta as Difficolta];
    a.prova = { abilita, pool, richiesti, probabilita: probabilita(pool, richiesti), difficolta: opz.prova.difficolta };
  }
  if (opz.combattimento) {
    const p = vittoria(s, opz.combattimento, c);
    a.combattimento = { probabilita: p, etichetta: etichettaCombattimento(p) };
  }
  return a;
}

export interface Risultato {
  testo: string;
  riuscito?: boolean;
  tiro?: { facce: number[]; successi: number; richiesti: number; abilita: string; probabilita: number };
  variazioni: Variazione[];
  crescite: Crescita[];
  segue?: string;
  area?: string;
}

function applicaEsito(s: Stato, e: TEsito, c: TContenuti, r: Risultato): void {
  r.testo = e.testo;
  r.variazioni.push(...applicaEffetti(s, e.effetti, c));
  if (e.vai) { s.area = e.vai; r.area = e.vai; }
  if (e.segue) r.segue = e.segue;
}

export type Scelta =
  | { tipo: 'risultato'; risultato: Risultato }
  | { tipo: 'combattimento'; combattimento: StatoCombattimento }
  | { tipo: 'errore'; messaggio: string };

export function scegli(
  s: Stato, st: TStorylet, indice: number, c: TContenuti, ora: number, rng: Rng = Math.random,
): Scelta {
  const opz = st.opzioni[indice];
  if (!opz) return { tipo: 'errore', messaggio: 'Opzione inesistente.' };
  aggiornaTempo(s, ora);
  const ante = anteprima(s, opz, c);
  if (!ante.disponibile) return { tipo: 'errore', messaggio: ante.motivo ?? 'Requisiti non soddisfatti.' };

  if (opz.combattimento) {
    const sc = c.scontri.find((x) => x.id === opz.combattimento)!;
    spendiCandele(s, ante.costo, ora);
    const consumabili = { bende: s.quality['bende'] ?? 0, tonico: s.quality['tonico'] ?? 0 };
    return { tipo: 'combattimento', combattimento: iniziaCombattimento(combattenteDaStato(s, c), sc, c, consumabili, rng) };
  }

  spendiCandele(s, ante.costo, ora);
  if (st.tipo === 'carta' && ante.costo > 0) scarta(s, st.id);
  const r: Risultato = { testo: '', variazioni: [], crescite: [] };
  if (opz.prova && ante.prova) {
    const t = tira(ante.prova.pool, rng);
    const riuscito = t.successi >= ante.prova.richiesti;
    r.riuscito = riuscito;
    r.tiro = { facce: t.facce, successi: t.successi, richiesti: ante.prova.richiesti, abilita: ante.prova.abilita, probabilita: ante.prova.probabilita };
    r.crescite.push(...assegnaPE(s, ante.prova.abilita, peDaProbabilita(ante.prova.probabilita)));
    applicaEsito(s, riuscito ? opz.successo! : opz.fallimento!, c, r);
  } else if (opz.esito) {
    applicaEsito(s, opz.esito, c, r);
  }
  return { tipo: 'risultato', risultato: r };
}

/** Chiude un combattimento: ferite, consumabili usati, PE all'arma, esito narrativo. */
export function concludiCombattimento(s: Stato, st: TStorylet, indice: number, cs: StatoCombattimento, c: TContenuti): Risultato {
  const opz = st.opzioni[indice]!;
  const sc = c.scontri.find((x) => x.id === cs.scontro)!;
  const r: Risultato = { testo: '', riuscito: cs.vinto, variazioni: [], crescite: [] };
  const usati: Record<string, number> = {};
  for (const [k, n] of Object.entries(cs.usati)) usati[k] = -n;
  r.variazioni.push(...applicaEffetti(s, usati, c));
  const ferite = feriteDopo(cs, sc.feriteSconfitta);
  if (ferite > 0) r.variazioni.push(...applicaEffetti(s, { ferite }, c));
  const arma = c.armi.find((a) => a.id === s.arma);
  const p = anteprima(s, opz, c).combattimento?.probabilita ?? 0.5;
  r.crescite.push(...assegnaPE(s, arma?.abilita ?? 'rissa', peDaProbabilita(p)));
  if (st.tipo === 'carta') scarta(s, st.id);
  applicaEsito(s, cs.vinto ? opz.vittoria! : opz.sconfitta!, c, r);
  return r;
}

// ---------------------------------------------------------------- spostamenti e negozi

export function puoEntrare(s: Stato, areaId: string, c: TContenuti): { ok: boolean; motivo?: string; gabella: number } {
  const area = c.aree.find((a) => a.id === areaId);
  if (!area) return { ok: false, motivo: 'Area sconosciuta.', gabella: 0 };
  const mancanti = requisitiMancanti(s, area.accesso);
  const esente = (s.quality['licenza-gilda'] ?? 0) > 0;
  const gabella = esente ? 0 : area.gabella;
  if (mancanti.length) return { ok: false, motivo: 'Non hai accesso.', gabella };
  if ((s.quality['monete'] ?? 0) < gabella) return { ok: false, motivo: `Serve la gabella: ${gabella} monete.`, gabella };
  return { ok: true, gabella };
}

export function muovi(s: Stato, areaId: string, c: TContenuti): boolean {
  const p = puoEntrare(s, areaId, c);
  if (!p.ok) return false;
  if (p.gabella) applicaEffetti(s, { monete: -p.gabella }, c);
  s.area = areaId;
  return true;
}

export function vendi(s: Stato, negozioId: string, quality: string, c: TContenuti): boolean {
  const n = c.negozi.find((x) => x.id === negozioId);
  const voce = n?.compra.find((x) => x.quality === quality);
  if (!voce || (s.quality[quality] ?? 0) < 1) return false;
  applicaEffetti(s, { [quality]: -1, monete: voce.prezzo }, c);
  return true;
}

export function compra(s: Stato, negozioId: string, quality: string, c: TContenuti): boolean {
  const n = c.negozi.find((x) => x.id === negozioId);
  const voce = n?.vende.find((x) => x.quality === quality);
  if (!voce || (s.quality['monete'] ?? 0) < voce.prezzo) return false;
  if (voce.quality.startsWith('arma.')) {
    s.arma = voce.quality.slice(5);
    applicaEffetti(s, { monete: -voce.prezzo }, c);
    return true;
  }
  if (voce.quality.startsWith('armatura.')) {
    s.armatura = voce.quality.slice(9);
    applicaEffetti(s, { monete: -voce.prezzo }, c);
    return true;
  }
  applicaEffetti(s, { [quality]: 1, monete: -voce.prezzo }, c);
  return true;
}
