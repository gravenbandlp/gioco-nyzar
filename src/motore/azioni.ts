// Risoluzione delle opzioni degli storylet, spostamenti e negozi.
import { probabilita, tira, type Rng } from './dadi';
import { DIFFICOLTA, peDaProbabilita, type Difficolta } from './regole';
import type { TContenuti, TEsito, TIncantesimo, TOpzione, TStorylet } from './contenuto';
import { chiaveIncantesimo, repertorio } from './magia';
import {
  abilitaEffettiva, applicaEffetti, assegnaPE, requisitiMancanti, spendiCandele, scarta, aggiornaTempo,
  type Crescita, type Stato, type Variazione,
} from './personaggio';
import {
  combattenteDaStato, feriteDopo, iniziaCombattimento, probabilitaVittoria, etichettaCombattimento, CONSUMABILI,
  type StatoCombattimento,
} from './combattimento';

export interface Anteprima {
  disponibile: boolean;
  motivo?: string;
  mancanti: string[];
  costo: number;
  prova?: { abilita: string; pool: number; richiesti: number; probabilita: number; difficolta: string };
  combattimento?: { probabilita: number; etichetta: string };
  incantesimo?: TIncantesimo;
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
  const rep = repertorio(s, c);
  const chiave = [scontroId, pg.attacco, pg.difesa, pg.difesaMentale, pg.difesaFisica, pg.pfMax, pg.danno, pg.riduzione,
    pg.ignora, pg.iniziativa, pg.magia, rep.map((i) => i.id).join('+')].join('|');
  let p = cacheVittoria.get(chiave);
  if (p === undefined) { p = probabilitaVittoria(pg, sc, c, 2000, 1, rep); cacheVittoria.set(chiave, p); }
  return p;
}

export function anteprima(s: Stato, opz: TOpzione, c: TContenuti): Anteprima {
  const costo = opz.costo ?? 1;
  const requisiti = [...(opz.requisiti ?? []), ...(opz.incantesimo ? [`${chiaveIncantesimo(opz.incantesimo)} >= 1`] : [])];
  const mancanti = requisitiMancanti(s, requisiti);
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
  if (opz.incantesimo) a.incantesimo = c.incantesimi.find((i) => i.id === opz.incantesimo);
  return a;
}

export interface Risultato {
  titolo?: string;
  immagine?: string;
  testo: string;
  riuscito?: boolean;
  tiro?: { facce: number[]; successi: number; richiesti: number; abilita: string; probabilita: number };
  variazioni: Variazione[];
  crescite: Crescita[];
  segue?: string;
  area?: string;
  dissonanza?: boolean;
  corretto?: boolean;
}

function applicaEsito(s: Stato, e: TEsito, c: TContenuti, r: Risultato): void {
  r.testo = e.testo;
  if (e.titolo) r.titolo = e.titolo;
  if (e.immagine) r.immagine = e.immagine;
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
  opzioni: { gratis?: boolean } = {},
): Scelta {
  const opz = st.opzioni[indice];
  if (!opz) return { tipo: 'errore', messaggio: 'Opzione inesistente.' };
  aggiornaTempo(s, ora);
  const ante = anteprima(s, opz, c);
  if (opzioni.gratis) { ante.costo = 0; ante.disponibile = ante.mancanti.length === 0; }
  if (!ante.disponibile) return { tipo: 'errore', messaggio: ante.motivo ?? 'Requisiti non soddisfatti.' };

  if (opz.combattimento) {
    const sc = c.scontri.find((x) => x.id === opz.combattimento)!;
    spendiCandele(s, ante.costo, ora);
    const consumabili = Object.fromEntries(Object.keys(CONSUMABILI).map((k) => [k, s.quality[k] ?? 0]));
    return { tipo: 'combattimento', combattimento: iniziaCombattimento(combattenteDaStato(s, c), sc, c, consumabili, rng, repertorio(s, c)) };
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
    if (ante.incantesimo) {
      // prezzo delle formule proibite a ogni lancio; Dissonanza con zero successi
      const costi: Record<string, number> = { ...(ante.incantesimo.prezzo ?? {}) };
      if (t.successi === 0) { costi['tormento'] = (costi['tormento'] ?? 0) + 0.5; r.dissonanza = true; }
      r.variazioni.push(...applicaEffetti(s, costi, c));
    }
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
  if (Object.keys(cs.costi ?? {}).length) r.variazioni.push(...applicaEffetti(s, cs.costi, c));
  const ferite = feriteDopo(cs, sc.feriteSconfitta);
  if (ferite > 0) r.variazioni.push(...applicaEffetti(s, { ferite }, c));
  const arma = c.armi.find((a) => a.id === s.arma);
  const p = anteprima(s, opz, c).combattimento?.probabilita ?? 0.5;
  // PE all'arma, e alla Magia se nello scontro hai lanciato incantesimi
  r.crescite.push(...assegnaPE(s, arma?.abilita ?? 'rissa', peDaProbabilita(p)));
  if (cs.log.some((l) => cs.incantesimi.some((i) => l.startsWith(`${i.nome}`)))) r.crescite.push(...assegnaPE(s, 'magia', peDaProbabilita(p)));
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

// ---------------------------------------------------------------- Correzione (formula precuriana)

/** Si può correggere questo risultato? Serve una prova fallita e l'incantesimo Correzione. */
export function correggibile(s: Stato, r: Risultato): boolean {
  return !!r.tiro && r.riuscito === false && (s.quality[chiaveIncantesimo('correzione')] ?? 0) >= 1;
}

/**
 * Correzione: una candela e una prova Media di Mentale + Magia. Se riesce, le quality tornano
 * com'erano prima della prova fallita (PE e candele restano spesi) e la prova si ripete gratis.
 * Il prezzo della formula e l'eventuale Dissonanza si pagano comunque.
 */
export function correggi(
  s: Stato, prima: Stato, st: TStorylet, indice: number, c: TContenuti, ora: number, rng: Rng = Math.random,
): Scelta {
  const inc = c.incantesimi.find((i) => i.id === 'correzione');
  if (!inc || (s.quality[chiaveIncantesimo('correzione')] ?? 0) < 1) return { tipo: 'errore', messaggio: 'Non conosci la Correzione.' };
  if (!spendiCandele(s, 1, ora)) return { tipo: 'errore', messaggio: 'Non hai abbastanza candele.' };
  const pool = s.attributi.mentale + abilitaEffettiva(s, 'magia', c);
  const richiesti = DIFFICOLTA.Media;
  const p = probabilita(pool, richiesti);
  const t = tira(pool, rng);
  const costi: Record<string, number> = { ...(inc.prezzo ?? {}) };
  if (t.successi === 0) costi['tormento'] = (costi['tormento'] ?? 0) + 0.5;
  const crescite = assegnaPE(s, 'magia', peDaProbabilita(p));
  if (t.successi < richiesti) {
    const variazioni = applicaEffetti(s, costi, c);
    return {
      tipo: 'risultato',
      risultato: {
        titolo: 'La formula non prende', testo: 'Le linee che tracci nell\'aria non si chiudono, e quello che è successo resta com\'era.',
        riuscito: false, tiro: { facce: t.facce, successi: t.successi, richiesti, abilita: 'magia', probabilita: p },
        variazioni, crescite, dissonanza: t.successi === 0,
      },
    };
  }
  s.quality = structuredClone(prima.quality);
  if (st.tipo === 'carta' && !s.mano.includes(st.id)) s.mano.push(st.id);
  const variazioni = applicaEffetti(s, costi, c);
  const rifatta = scegli(s, st, indice, c, ora, rng, { gratis: true });
  if (rifatta.tipo === 'risultato') {
    rifatta.risultato.variazioni.unshift(...variazioni);
    rifatta.risultato.crescite.unshift(...crescite);
    rifatta.risultato.corretto = true;
  }
  return rifatta;
}
