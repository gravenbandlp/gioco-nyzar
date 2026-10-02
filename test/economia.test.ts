// L'economia della città: prezzi legati alla reputazione, botteghe che si aprono, opzioni con `quando`,
// conversioni che non mandano mai in negativo e la casa che arriva fino all'altana.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { nuovoPersonaggio, storyletDisponibili, requisitiSoddisfatti, parseRequisito } from '../src/motore/personaggio';
import { listino, negozioAperto, vendi, scegli } from '../src/motore/azioni';
import { opzioniVisibili } from '../src/motore/crisi';

const pg = () => {
  const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');
  return s;
};
/** I rintocchi tornano pieni prima di ogni scelta: qui si prova l'economia, non il ritmo. */
const ricarica = <T extends { rintocchi: number }>(s: T): T => { s.rintocchi = 20; return s; };
const negozio = (id: string) => c.negozi.find((n) => n.id === id)!;
const storia = (id: string) => c.storylet.find((x) => x.id === id)!;
/** Sceglie l'opzione visibile con questo testo e restituisce l'esito. */
function gioca(s: ReturnType<typeof pg>, id: string, testo: string) {
  const st = storia(id);
  const i = st.opzioni.findIndex((o, k) => o.testo === testo && opzioniVisibili(s, st, c).includes(k));
  expect(i, `${id}: «${testo}»`).toBeGreaterThanOrEqual(0);
  const r = scegli(ricarica(s), st, i, c, 0, () => 0);
  expect(r.tipo, `${id}: «${testo}»`).toBe('risultato');
}

describe('economia', () => {
  it('il Nodo paga meglio i cristalli a chi ha finito le sue storie', () => {
    const s = pg();
    const prezzo = () => listino(s, negozio('nodo-d-ossidiana').compra, c, 'compra').find((x) => x.voce.quality === 'cristalli.cristallo-carico')!;
    expect(prezzo().voce.prezzo).toBe(25);
    expect(prezzo().meglio?.prezzo).toBe(30);
    s.quality['rep.nodo'] = 3;
    expect(prezzo().voce.prezzo).toBe(30);
    expect(prezzo().meglio?.prezzo).toBe(35);
    s.quality['rep.nodo'] = 7;
    expect(prezzo().voce.prezzo).toBe(35);
    expect(prezzo().meglio).toBeUndefined();
    s.quality['cristalli.cristallo-carico'] = 1;
    const prima = s.quality['monete'] ?? 0;
    expect(vendi(s, 'nodo-d-ossidiana', 'cristalli.cristallo-carico', c)).toBe(true);
    expect(s.quality['monete']).toBe(prima + 35);
  });

  it('la tua bottega si apre con la casa al pianterreno', () => {
    const s = pg();
    s.quality['casa'] = 3;
    expect(negozioAperto(s, negozio('la-tua-bottega'), c)).toBe(false);
    s.quality['casa'] = 4;
    expect(negozioAperto(s, negozio('la-tua-bottega'), c)).toBe(true);
  });

  it('le opzioni con quando compaiono solo quando servono', () => {
    const s = pg();
    s.quality['casa'] = 1;
    const st = storia('una-sera-a-casa');
    const testi = () => opzioniVisibili(s, st, c).map((i) => st.opzioni[i]!.testo);
    const prima = testi();
    s.quality['arredo.letto'] = 1;
    const dopo = testi();
    expect(prima).not.toEqual(dopo);
    expect(prima.length).toBe(dopo.length);
  });

  it('le storie di un luogo nascosto non si vedono', () => {
    const s = pg();
    s.quality['contatto-ombra'] = 0;
    expect(storyletDisponibili(s, c).some((st) => st.presso === 'mercato-delle-ombre')).toBe(false);
    s.quality['contatto-ombra'] = 1;
    expect(storyletDisponibili(s, c).some((st) => st.presso === 'mercato-delle-ombre')).toBe(true);
  });

  it('nessuna opzione dell\'economia spende più di quello che chiede', () => {
    const cartella = join(__dirname, '..', 'contenuti', 'economia');
    const ids = readdirSync(cartella).flatMap((f) => ((parse(readFileSync(join(cartella, f), 'utf8')) as { storylet?: { id: string }[] }).storylet ?? []).map((x) => x.id));
    expect(ids.length).toBeGreaterThan(20);
    const consumabili = new Set(['monete', ...c.quality.filter((q) => q.categoria === 'bene' || q.categoria === 'consumabile').map((q) => q.id)]);
    for (const id of ids) {
      for (const o of storia(id).opzioni) {
        const chiesti = new Map<string, number>();
        for (const r of [...(o.requisiti ?? []), ...(o.quando ?? [])]) {
          const q = parseRequisito(r);
          if (q.op === '>=') chiesti.set(q.chiave, Math.max(chiesti.get(q.chiave) ?? 0, q.n));
        }
        for (const e of [o.esito, o.successo, o.fallimento]) {
          for (const [k, v] of Object.entries(e?.effetti ?? {})) {
            if (v < 0 && consumabili.has(k)) expect(chiesti.get(k) ?? 0, `${id} «${o.testo}»: ${k} ${v}`).toBeGreaterThanOrEqual(-v);
          }
        }
      }
    }
  });

  it('la casa cresce dalla soffitta all\'altana, e gli ospiti arrivano', () => {
    const s = pg();
    Object.assign(s.quality, {
      monete: 10000, 'informazioni.pettegolezzo': 50, 'informazioni.segreto': 50, 'cristalli.cristallo-sterile': 50,
      'cristalli.cristallo-carico': 50, 'reliquie.meccanismo-spento': 50,
    });
    const lavori = ['una-stanza-nel-vicolo', 'le-stanze-accanto', 'la-casa-e-tua', 'la-bottega-al-pianterreno', 'la-cantina', 'l-altana'];
    lavori.forEach((id, n) => {
      expect(s.quality['casa'] ?? 0).toBe(n);
      const st = storia(id);
      expect(requisitiSoddisfatti(s, st.requisiti, c), id).toBe(true);
      const i = st.opzioni.findIndex((o) => (o.esito?.imposta?.['casa'] ?? 0) === n + 1);
      expect(scegli(ricarica(s), st, i, c, 0, () => 0).tipo, id).toBe('risultato');
      expect(requisitiSoddisfatti(s, st.requisiti, c), `${id} si chiude`).toBe(false);
    });
    expect(s.quality['casa']).toBe(6);

    // ogni arredo si compra, e poi l'opzione sparisce
    const arredi = storia('arredare-la-casa');
    for (const q of c.quality.filter((x) => x.id.startsWith('arredo.'))) {
      const i = arredi.opzioni.findIndex((o) => o.esito?.imposta?.[q.id] === 1);
      expect(i, q.id).toBeGreaterThanOrEqual(0);
      expect(scegli(ricarica(s), arredi, i, c, 0, () => 0).tipo, q.id).toBe('risultato');
      expect(opzioniVisibili(s, arredi, c).includes(i), q.id).toBe(false);
    }

    // il Lustro sale con gli ospiti e apre le quattro visite, che poi si chiudono
    const cena = storia('ricevere-ospiti');
    const serata = cena.opzioni.findIndex((o) => (o.esito?.effetti?.['lustro'] ?? 0) >= 8);
    while ((s.quality['lustro'] ?? 0) < 100) expect(scegli(ricarica(s), cena, serata, c, 0, () => 0).tipo).toBe('risultato');
    for (const id of ['ospite-primo', 'ospite-secondo', 'ospite-terzo', 'ospite-quarto']) {
      expect(storyletDisponibili(s, c).some((x) => x.id === id), id).toBe(true);
      const st = storia(id);
      expect(scegli(ricarica(s), st, 0, c, 0, () => 0).tipo, id).toBe('risultato');
      expect(storyletDisponibili(s, c).some((x) => x.id === id), `${id} si chiude`).toBe(false);
    }
    gioca(s, 'una-sera-a-casa', st0(s));
  });
});

/** La prima opzione visibile della sera a casa (basta che ce ne sia una giocabile). */
function st0(s: ReturnType<typeof pg>): string {
  const st = storia('una-sera-a-casa');
  return st.opzioni[opzioniVisibili(s, st, c)[0]!]!.testo;
}
