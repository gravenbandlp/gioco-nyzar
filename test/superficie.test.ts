// La Superficie Fratturata: l'hub fuori città (contenuti/superficie/). Ci si va dalla mappa fin dall'inizio, il mazzo
// è solo suo, il ciclo dei reperti si chiude (aprire, montare, vendere) e una lunga passeggiata a caso non si blocca.
import { describe, it, expect } from 'vitest';
import { nuovoPersonaggio, cartePescabili, storyletDisponibili, requisitiSoddisfatti, pesca, type Stato } from '../src/motore/personaggio';
import { muovi, puoEntrare, scegli, concludiCombattimento, anteprima } from '../src/motore/azioni';
import { round } from '../src/motore/combattimento';
import { crisiAttiva } from '../src/motore/crisi';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { rngConSeme, type Rng } from '../src/motore/dadi';
import { RINTOCCHI_MAX, CODA_MAX } from '../src/motore/regole';
import type { TStorylet } from '../src/motore/contenuto';

const SUP = 'superficie-fratturata';

function nuovo(origine = 'figlio-della-citta-bassa'): Stato {
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === origine)!, 0, 'citta-bassa');
  delete s.quality['prologo'];
  return s;
}

function gioca(s: Stato, st: TStorylet, i: number, rng: Rng): void {
  const r = scegli(s, st, i, c, 0, rng);
  if (r.tipo === 'combattimento') {
    const cs = r.combattimento;
    while (!cs.finito) round(cs, { tipo: 'attacco', bersaglio: cs.combattenti.find((x) => x.lato === 'nemico' && x.pf > 0 && !x.fuggito)!.id }, rng);
    concludiCombattimento(s, st, i, cs, c);
  } else if (r.tipo === 'errore') throw new Error(`${st.id}/${i}: ${r.messaggio}`);
}

const opzione = (st: TStorylet, testo: RegExp) => st.opzioni.findIndex((o) => testo.test(o.testo));
const storylet = (id: string) => c.storylet.find((x) => x.id === id)!;

describe('Superficie Fratturata', () => {
  it('si raggiunge dalla mappa fin dall\'inizio, senza gabella', () => {
    const s = nuovo();
    expect(puoEntrare(s, SUP, c)).toEqual({ ok: true, gabella: 0 });
    expect(muovi(s, SUP, c)).toBe(true);
    expect(s.area).toBe(SUP);
  });

  it('il mazzo è solo della Superficie, e le carte di città non arrivano', () => {
    const s = nuovo();
    s.area = SUP;
    const mazzo = cartePescabili(s, c);
    expect(mazzo.length).toBeGreaterThan(20);
    expect(mazzo.every((x) => x.area === SUP)).toBe(true);
    s.quality['tormento'] = 6; // le carte "ovunque" di sollievo restano in città
    expect(cartePescabili(s, c).some((x) => x.area === 'ovunque')).toBe(false);
  });

  it('ogni carta della Superficie ha qualcosa da fare per un personaggio appena creato', () => {
    for (const o of c.origini) {
      const s = nuovo(o.id);
      s.area = SUP;
      s.quality['monete'] = 10;
      for (const st of cartePescabili(s, c)) {
        expect(st.opzioni.some((op) => anteprima(s, op, c).mancanti.length === 0), `${o.id}: ${st.id}`).toBe(true);
      }
    }
  });

  it('le spedizioni fuori città riportano sulla Superficie', () => {
    for (const id of ['roccia-di-wren', 'palude-acquanera', 'foresta-strisciante', 'rovolungo', 'capomozzo', 'sotto-capomozzo', 'cuore-di-capomozzo', 'vhar-ul', 'laboratorio-di-calibrazione', 'mahr-kel', 'villaggio-storto', 'nodo-dei-precursori']) {
      expect(c.aree.find((a) => a.id === id)?.spedizione?.ritorno, id).toBe(SUP);
    }
  });

  it('il ciclo dei reperti si chiude: aprire, montare quattro parti, vendere', () => {
    const s = nuovo();
    s.area = SUP;
    Object.assign(s.attributi, { fisico: 5, mentale: 5 });
    for (const a of ['tecnologia', 'resilienza', 'resistenza', 'acrobazia', 'magia', 'percezione']) s.abilita[a] = 5;
    s.quality['oda.conosciuta'] = 1;
    s.quality['reperto.sigillato'] = 4;
    const rng = rngConSeme(7);
    const apri = storylet('oda-aprire-reperto');
    for (const f of ['involucro', 'camera', 'impugnatura', 'nucleo']) {
      s.rintocchi = RINTOCCHI_MAX;
      gioca(s, apri, opzione(apri, new RegExp(f, 'i')), rng);
      expect((s.quality[`parte.${f}-1`] ?? 0) + (s.quality[`parte.${f}-2`] ?? 0), f).toBe(1);
    }
    expect(s.quality['reperto.sigillato']).toBe(0);
    for (const f of ['involucro', 'camera', 'impugnatura', 'nucleo']) {
      const st = storylet(`oda-montare-${f}`);
      for (let n = 0; n < 30 && (s.quality[`banco.${f}`] ?? 0) === 0; n++) {
        s.rintocchi = RINTOCCHI_MAX;
        const g = (s.quality[`parte.${f}-2`] ?? 0) > 0 ? 2 : 1;
        s.quality[`parte.${f}-${g}`] = Math.max(1, s.quality[`parte.${f}-${g}`] ?? 0); // un fallimento rovina la parte: ne rimetto una
        const i = st.opzioni.findIndex((o) => requisitiSoddisfatti(s, o.quando, c) && (o.quando ?? []).some((q) => q.startsWith(`parte.${f}-${g}`)));
        expect(i, `${f} grado ${g}`).toBeGreaterThanOrEqual(0);
        gioca(s, st, i, rng);
      }
      expect(s.quality[`banco.${f}`], f).toBeGreaterThan(0);
    }
    expect(s.quality['banco.parti']).toBe(4);
    expect((s.quality['banco.potenza'] ?? 0) + (s.quality['banco.stabilita'] ?? 0) + (s.quality['banco.stranezza'] ?? 0)).toBeGreaterThan(8);
    s.area = 'ponti-sospesi';
    const dragna = storylet('compratore-dragna');
    expect(requisitiSoddisfatti(s, dragna.requisiti, c)).toBe(true);
    const prima = s.quality['parte.nucleo-3'] ?? 0;
    gioca(s, dragna, opzione(dragna, /nucleo/i), rng);
    expect(s.quality['parte.nucleo-3']).toBe(prima + 1);
    for (const k of ['involucro', 'camera', 'impugnatura', 'nucleo', 'parti', 'potenza', 'stabilita', 'stranezza']) expect(s.quality[`banco.${k}`] ?? 0, k).toBe(0);
  });

  it('una lunga passeggiata a caso sulla Superficie non si blocca e porta a casa qualcosa', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 6; seme++) {
      const s = nuovo(o.id);
      s.area = SUP;
      s.quality['monete'] = 30;
      const rng = rngConSeme(seme * 31 + o.id.length);
      let giocate = 0;
      for (let n = 0; n < 250; n++) {
        s.rintocchi = RINTOCCHI_MAX;
        s.coda = CODA_MAX;
        for (const k of ['ferite', 'scandalo', 'sospetto', 'tormento', 'contaminazione']) s.quality[k] = Math.min(s.quality[k] ?? 0, 3);
        const crisi = crisiAttiva(s, c);
        const sospeso = s.sospeso ? storylet(s.sospeso) : undefined;
        let st: TStorylet | undefined;
        if (crisi) st = crisi;
        else if (sospeso && requisitiSoddisfatti(s, sospeso.requisiti, c)) st = sospeso;
        else {
          if (s.sospeso) delete s.sospeso;
          if (!c.aree.find((a) => a.id === s.area)?.spedizione && s.area !== SUP && !crisiAttiva(s, c)) s.area = SUP; // finita una spedizione si torna fuori
          while (s.mano.length < 3 && pesca(s, c, 0, rng)) { /* riempi la mano */ }
          const carte = s.mano.map(storylet).filter((x) => x.area === s.area && requisitiSoddisfatti(s, x.requisiti, c));
          const qui = [...storyletDisponibili(s, c), ...carte].filter((x) => x.opzioni.some((op) => anteprima(s, op, c).mancanti.length === 0));
          st = qui[Math.floor(rng() * qui.length)];
        }
        expect(st, `${o.id}/${seme}: niente da fare in ${s.area}`).toBeDefined();
        const ok = st!.opzioni.map((_, i) => i).filter((i) => anteprima(s, st!.opzioni[i]!, c).mancanti.length === 0);
        expect(ok.length, `${o.id}/${seme}: ${st!.id} senza opzioni`).toBeGreaterThan(0);
        gioca(s, st!, ok[Math.floor(rng() * ok.length)]!, rng);
        giocate++;
      }
      expect(giocate).toBe(250);
      const bottino = Object.entries(s.quality).filter(([k, v]) => /^(parte|reperto|reliquie|cristalli)\./.test(k) && v > 0);
      expect(bottino.length, `${o.id}/${seme}`).toBeGreaterThan(0);
    }
  }, 60000);
});
