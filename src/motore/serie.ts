// Le serie: a quale storia lunga appartiene uno storylet e a che punto sei. Si ricavano dai contenuti, senza
// scriverle a mano:
// - una pista (quality di categoria pista) raccoglie gli storylet che la chiedono a un valore preciso
//   (`pista.x == n`) o che la fanno avanzare; il massimo è il valore più alto chiesto, più uno;
// - una reputazione della città viva raccoglie le storie non ripetibili dei luoghi che si aprono con essa
//   (`rep.x >= n`) e si chiudono con il proprio flag (`flag == 0`): ogni flag è un passo. Il nome è quello del
//   luogo, o della reputazione quando i luoghi sono più d'uno (la Fucina e l'Armeria, i due ponti).
// I seguiti senza serie prendono quella della scena che li apre.
// Il genere dice che storia è: principale (le piste), di fazione (le quest di `fazioni:`) o di un luogo.
import type { TContenuti, TStorylet } from './contenuto';
import { parseRequisito, requisitoSoddisfatto, type Stato } from './personaggio';

export interface Serie {
  id: string;
  nome: string;
  immagine?: string;
  tipo: 'pista' | 'luogo';
  genere: Genere;
  fazione?: string; // il nome della fazione, per le quest di fazione
  quality?: string; // pista
  passi: string[]; // luogo: i flag delle storie, in ordine di reputazione
  tappe: { flag: string; storylet: string }[]; // luogo: la storia che apre ogni passo
  massimo: number;
}

export type Genere = 'principale' | 'fazione' | 'luogo';

export interface MappaSerie {
  serie: Serie[];
  diStorylet: Map<string, Serie>;
}

const cache = new WeakMap<TContenuti, MappaSerie>();

function esiti(st: TStorylet) {
  return st.opzioni.flatMap((o) => [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta]).filter((e) => !!e);
}

function req(st: TStorylet) {
  return st.requisiti.map((r) => { try { return parseRequisito(r); } catch { return null; } }).filter((r) => !!r);
}

export function serieDi(c: TContenuti): MappaSerie {
  const pronta = cache.get(c);
  if (pronta) return pronta;
  const categoria = new Map(c.quality.map((q) => [q.id, q.categoria]));
  const serie: Serie[] = [];
  const diStorylet = new Map<string, Serie>();
  const candidati = c.storylet.filter((st) => !st.ripetibile && ['fisso', 'seguito', 'carta'].includes(st.tipo));

  // --- piste
  for (const q of c.quality.filter((x) => x.categoria === 'pista')) {
    let massimo = 0;
    for (const st of c.storylet) for (const r of req(st)) if (r.chiave === q.id && r.op === '==') massimo = Math.max(massimo, r.n + 1);
    for (const st of c.storylet) for (const e of esiti(st)) { const v = e.imposta?.[q.id]; if (typeof v === 'number') massimo = Math.max(massimo, v); }
    const f = c.fazioni.find((x) => x.pista === q.id);
    if (massimo > 0) serie.push({ id: q.id, nome: q.nome, immagine: q.immagine, tipo: 'pista', genere: f ? 'fazione' : 'principale', fazione: f?.nome, quality: q.id, passi: [], tappe: [], massimo });
  }
  const pista = new Map(serie.map((x) => [x.quality!, x]));
  for (const st of candidati) {
    const uguale = req(st).find((r) => r.op === '==' && pista.has(r.chiave));
    const avanza = esiti(st).flatMap((e) => [...Object.keys(e.effetti ?? {}), ...Object.keys(e.imposta ?? {})]).find((k) => pista.has(k));
    const p = uguale ? pista.get(uguale.chiave) : avanza ? pista.get(avanza) : undefined;
    if (p) diStorylet.set(st.id, p);
  }

  // --- luoghi della città viva: una serie per reputazione (Fucina e Armeria ne condividono una, così i due ponti)
  const perRep = new Map<string, { flag: string; gradino: number; luogo: string; storylet: string }[]>();
  for (const st of candidati.filter((x) => x.presso && !diStorylet.has(x.id))) {
    const r = req(st);
    const gradino = r.find((x) => x.op === '>=' && categoria.get(x.chiave) === 'reputazione');
    const flag = r.find((x) => x.op === '==' && x.n === 0 && categoria.get(x.chiave) === 'stato');
    if (!gradino || !flag) continue;
    const passi = perRep.get(gradino.chiave) ?? [];
    if (!passi.some((p) => p.flag === flag.chiave)) passi.push({ flag: flag.chiave, gradino: gradino.n, luogo: st.presso!, storylet: st.id });
    perRep.set(gradino.chiave, passi);
  }
  for (const [rep, passi] of perRep) {
    if (passi.length < 2) continue;
    passi.sort((a, b) => a.gradino - b.gradino);
    const luoghi = [...new Set(passi.map((p) => p.luogo))];
    const nome = luoghi.length === 1 ? c.luoghi.find((l) => l.id === luoghi[0])?.nome : c.quality.find((q) => q.id === rep)?.nome;
    const immagine = c.luoghi.find((l) => l.id === luoghi[0])?.immagine;
    const s: Serie = { id: `luogo.${rep}`, nome: nome ?? rep, immagine, tipo: 'luogo', genere: 'luogo', passi: passi.map((p) => p.flag), tappe: passi.map((p) => ({ flag: p.flag, storylet: p.storylet })), massimo: passi.length };
    serie.push(s);
    for (const st of candidati.filter((x) => x.presso && luoghi.includes(x.presso) && !diStorylet.has(x.id)))
      if (req(st).some((r) => r.op === '==' && r.n === 0 && s.passi.includes(r.chiave))) diStorylet.set(st.id, s);
  }

  // --- i seguiti ereditano la serie della scena che li apre (anche a catena)
  const genitori = new Map<string, string>();
  for (const st of c.storylet) for (const e of esiti(st)) if (e.segue && e.segue !== st.id && !genitori.has(e.segue)) genitori.set(e.segue, st.id);
  for (const st of candidati) {
    let su = genitori.get(st.id);
    const visti = new Set<string>();
    while (!diStorylet.has(st.id) && su && !visti.has(su)) {
      visti.add(su);
      const s = diStorylet.get(su);
      if (s) diStorylet.set(st.id, s);
      su = genitori.get(su);
    }
  }

  const pronta2 = { serie, diStorylet };
  cache.set(c, pronta2);
  return pronta2;
}

/** A che punto sei della serie: passi fatti, da 0 al massimo. */
export function avanzamento(s: Stato, serie: Serie): number {
  if (serie.tipo === 'pista') return Math.min(serie.massimo, Math.floor(s.quality[serie.quality!] ?? 0));
  return serie.passi.filter((f) => (s.quality[f] ?? 0) >= 1).length;
}

/** La prossima storia da giocare in una serie di luogo, o niente se la serie è chiusa. */
export function prossimaTappa(s: Stato, serie: Serie): string | undefined {
  return serie.tappe.find((t) => (s.quality[t.flag] ?? 0) < 1)?.storylet;
}

/** La fazione di uno storylet fuori serie (i servizi e le spedizioni che si aprono con una quest di fazione). */
export function fazioneDi(c: TContenuti, st: TStorylet): string | undefined {
  const chiavi = new Set(req(st).map((r) => r.chiave));
  return c.fazioni.find((f) => chiavi.has(f.pista))?.nome;
}

/** Le storie che vengono subito dopo nella serie: quelle del passo a cui sei, o la prossima tappa del luogo. */
function prossimi(s: Stato, c: TContenuti, serie: Serie): TStorylet[] {
  if (serie.tipo === 'luogo') {
    const id = prossimaTappa(s, serie);
    const st = id ? c.storylet.find((x) => x.id === id) : undefined;
    return st ? [st] : [];
  }
  const ora = avanzamento(s, serie);
  if (ora >= serie.massimo) return [];
  // i seguiti li apre la scena prima di loro, non la pista: «Voce del salotto» (fazione.maison == 12, già giocata)
  // non deve far credere che il passo 13 della Maison sia libero
  return c.storylet.filter((st) => st.tipo !== 'seguito' && req(st).some((r) => r.chiave === serie.quality && r.op === '==' && r.n === ora));
}

export interface Sblocco { serie: Serie; quality: string }

/**
 * Le serie di cui questo storylet apre il passo successivo: alza una reputazione o un accesso che il prossimo passo
 * chiede e che non hai ancora abbastanza alto. Non conta la serie a cui lo storylet appartiene.
 */
export function sblocchi(s: Stato, c: TContenuti, st: TStorylet): Sblocco[] {
  const categoria = new Map(c.quality.map((q) => [q.id, q.categoria]));
  const alza = new Set<string>();
  for (const e of esiti(st)) {
    for (const [k, v] of Object.entries(e.effetti ?? {})) if (v > 0) alza.add(k);
    for (const k of [...Object.keys(e.almeno ?? {}), ...Object.keys(e.imposta ?? {})]) alza.add(k);
  }
  for (const k of alza) if (!['reputazione', 'accesso'].includes(categoria.get(k) ?? '')) alza.delete(k);
  if (!alza.size) return [];
  const { serie, diStorylet } = serieDi(c);
  const propria = diStorylet.get(st.id);
  const fuori: Sblocco[] = [];
  for (const z of serie) {
    if (z === propria) continue;
    const manca = prossimi(s, c, z).flatMap(req).find((r) => alza.has(r.chiave) && ['>=', '>'].includes(r.op) && (s.quality[r.chiave] ?? 0) < (r.op === '>' ? r.n + 1 : r.n));
    if (manca) fuori.push({ serie: z, quality: manca.chiave });
  }
  return fuori;
}

/** Una condizione su un'altra storia che ferma il prossimo passo di una serie. */
export interface Attesa { serie: Serie; op: string; valori: number[] }

/**
 * Le altre storie da cui dipende il prossimo passo di una pista: se nessuna delle storie del passo successivo si può
 * aprire perché chiede un'altra pista a un certo punto, torna le condizioni mancanti della più vicina. Vuoto se il
 * passo non dipende da altre storie, o se la serie è chiusa.
 */
export function attese(s: Stato, c: TContenuti, serie: Serie): Attesa[] {
  if (serie.tipo !== 'pista') return [];
  const piste = new Map(serieDi(c).serie.filter((z) => z.tipo === 'pista' && z !== serie).map((z) => [z.quality!, z]));
  const vale = (v: number, op: string, n: number) =>
    op === '>=' ? v >= n : op === '>' ? v > n : op === '<=' ? v <= n : op === '<' ? v < n : op === '==' ? v === n : op === '!=' ? v !== n : true;
  // le storie del passo con le altre condizioni già a posto contano per prime (al passo 9 dei Raschiatori la penitenza
  // vale solo per chi è rimasto con Merlach, e non deve nascondere quello che chiede la strada normale)
  const candidati = prossimi(s, c, serie).map((st) => {
    const r = req(st);
    return {
      mancanti: r.filter((x) => piste.has(x.chiave) && !vale(s.quality[x.chiave] ?? 0, x.op, x.n)),
      altriOk: r.every((x) => piste.has(x.chiave) || x.chiave === serie.quality || requisitoSoddisfatto(s, `${x.chiave} ${x.op} ${x.n}`, c)),
    };
  });
  // le piste salgono e basta: una storia che chiede un'altra pista più indietro di dove sei non si aprirà più
  const possibili = candidati.filter((x) => x.mancanti.every((r) => ['>=', '>', '!='].includes(r.op) || (r.op === '==' && (s.quality[r.chiave] ?? 0) < r.n)));
  const validi = possibili.some((x) => x.altriOk) ? possibili.filter((x) => x.altriOk) : possibili;
  let meglio: Attesa[] | undefined;
  for (const { mancanti } of validi) {
    if (!mancanti.length) return [];
    // più condizioni sulla stessa pista (pista.arena != 1, != 2, ...) diventano una sola
    const unite = new Map<string, Attesa>();
    for (const r of mancanti) {
      const k = `${r.chiave}|${r.op}`;
      const a = unite.get(k) ?? { serie: piste.get(r.chiave)!, op: r.op, valori: [] };
      a.valori.push(r.n);
      unite.set(k, a);
    }
    if (!meglio || unite.size < meglio.length) meglio = [...unite.values()];
  }
  return meglio ?? [];
}
