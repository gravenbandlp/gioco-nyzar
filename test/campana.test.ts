// La Campana Sepolta (contenuti/campana/, docs/piano-superficie.md, blocco 8): l'annuncio con le nove misure, le
// ripartenze verso lo strato raggiunto, il Campanaro in tre fasi fino alla scelta, gli oggetti di grado 5.
import { describe, it, expect } from 'vitest';
import { nuovoPersonaggio, storyletDisponibili, requisitiSoddisfatti, type Stato } from '../src/motore/personaggio';
import { scegli } from '../src/motore/azioni';
import { opzioniVisibili } from '../src/motore/crisi';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { Oggetto, COSTI_PROPRIETA } from '../src/motore/contenuto';
import { rngConSeme } from '../src/motore/dadi';
import { RINTOCCHI_MAX } from '../src/motore/regole';

const SUP = 'superficie-fratturata';
const MISURE = ['costola', 'tamburi', 'aculeo', 'anello', 'forno', 'stele', 'sornione', 'mara', 'spina'];
const STRATI = ['campana-sfiati', 'campana-canne', 'campana-coro', 'campana-batacchio'];
const storylet = (id: string) => c.storylet.find((x) => x.id === id)!;

function sullaSuperficie(): Stato {
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, SUP);
  delete s.quality['prologo'];
  s.area = SUP;
  s.rintocchi = RINTOCCHI_MAX;
  for (const m of MISURE) s.quality[`misura.${m}`] = 1;
  return s;
}
const visibili = (s: Stato) => storyletDisponibili(s, c).map((x) => x.id);

describe('la Campana Sepolta', () => {
  it("con le nove misure si vede l'annuncio, e senza una qualsiasi no", () => {
    expect(visibili(sullaSuperficie())).toContain('campana-le-nove-misure');
    for (const m of MISURE) {
      const s = sullaSuperficie();
      delete s.quality[`misura.${m}`];
      expect(visibili(s), m).not.toContain('campana-le-nove-misure');
      expect(visibili(s), m).not.toContain('campana-la-strada-della-ripamuta');
    }
  });

  it("l'annuncio si vede una volta sola e apre la strada della Ripamuta", () => {
    const s = sullaSuperficie();
    expect(visibili(s)).not.toContain('campana-la-strada-della-ripamuta');
    const r = scegli(s, storylet('campana-le-nove-misure'), 0, c, 0, rngConSeme(1));
    expect(r.tipo).toBe('risultato');
    expect(s.quality['campana.annuncio']).toBe(1);
    expect(visibili(s)).not.toContain('campana-le-nove-misure');
    expect(visibili(s)).toContain('campana-la-strada-della-ripamuta');
  });

  for (let k = 0; k <= 3; k++) {
    it(`con campana.strato a ${k} si riparte da ${STRATI[k]}`, () => {
      const s = sullaSuperficie();
      s.quality['campana.annuncio'] = 1;
      s.quality['campana.strato'] = k;
      const st = storylet('campana-la-strada-della-ripamuta');
      const ok = opzioniVisibili(s, st, c);
      expect(ok.length).toBeGreaterThan(0);
      for (const i of ok) {
        const t = sullaSuperficie();
        Object.assign(t.quality, { 'campana.annuncio': 1, 'campana.strato': k, 'oggetto.ombrafosca': 1 });
        const r = scegli(t, st, i, c, 0, rngConSeme(2));
        expect(r.tipo, st.opzioni[i]!.testo).toBe('risultato');
        expect(t.area, st.opzioni[i]!.testo).toBe(STRATI[k]);
      }
    });
  }

  it('a Campanaro battuto la strada non riparte più', () => {
    const s = sullaSuperficie();
    Object.assign(s.quality, { 'campana.annuncio': 1, 'campana.strato': 4 });
    expect(visibili(s)).not.toContain('campana-la-strada-della-ripamuta');
  });

  it('ogni strato ha il suo cuore alla soglia 5, e vincerlo porta allo strato dopo', () => {
    const cuori = ['campana-sfiati-lo-spurgatore', 'campana-canne-l-accordatore', 'campana-coro-la-capoturno', 'campana-batacchio-il-campanaro'];
    cuori.forEach((id, k) => {
      const st = storylet(id);
      expect(st.area).toBe(STRATI[k]);
      expect(st.ripetibile).toBe(false);
      expect(st.requisiti).toContain(`campana.strato == ${k}`);
      expect(st.requisiti).toContain(`profondita.${STRATI[k]} >= 5`);
      expect(c.aree.find((a) => a.id === STRATI[k])!.spedizione).toMatchObject({ ritorno: SUP, soglia: 5, stanze: 3 });
      for (const o of st.opzioni) {
        for (const e of [o.vittoria, o.successo]) {
          if (!e) continue;
          if (k < 3) {
            expect(e.imposta?.['campana.strato'], `${id}: ${o.testo}`).toBe(k + 1);
            expect(e.vai, `${id}: ${o.testo}`).toBe(STRATI[k + 1]);
          } else expect(e.segue, `${id}: ${o.testo}`).toBe('campana-batacchio-il-campanaro-a-terra');
        }
        for (const e of [o.sconfitta, o.fallimento]) if (e) expect(e.vai, `${id}: ${o.testo}`).toBe(SUP);
      }
      // dieci o undici stanze per strato, in fasce di profondità da 0 a 4
      const stanze = c.storylet.filter((x) => x.area === STRATI[k] && x.ripetibile);
      expect(stanze.length).toBeGreaterThanOrEqual(10);
      expect(stanze.length).toBeLessThanOrEqual(11);
    });
  });

  it('il Campanaro sono tre scontri di fila, fino alla scelta', () => {
    const fasi = ['campana-batacchio-il-campanaro', 'campana-batacchio-il-campanaro-a-terra', 'campana-batacchio-il-campanaro-nella-voce'];
    const scontri = ['campana-il-campanaro-sulle-catene', 'campana-il-campanaro-a-terra', 'campana-il-campanaro-nella-voce'];
    fasi.forEach((id, i) => {
      const st = storylet(id);
      const o = st.opzioni.find((x) => x.combattimento)!;
      expect(o.combattimento).toBe(scontri[i]);
      const sc = c.scontri.find((x) => x.id === scontri[i])!;
      expect(sc.feriteSconfitta).toBe(4);
      const n = c.nemici.find((x) => x.id === sc.nemici[0])!;
      expect(n.attacco > 5 || n.pf > 30, n.id).toBe(true); // oltre il massimo di prima (attacco 5, PF 30)
      expect(o.vittoria!.segue).toBe(i < 2 ? fasi[i + 1] : 'campana-batacchio-la-scelta');
    });
    const scelta = storylet('campana-batacchio-la-scelta');
    const valori = scelta.opzioni.map((o) => o.esito!.imposta!['campana.scelta']).sort();
    expect(valori).toEqual([1, 2]);
  });

  it('dopo la scelta si vede una scena sola, quella giusta', () => {
    for (const scelta of [1, 2]) {
      const s = sullaSuperficie();
      Object.assign(s.quality, { 'campana.annuncio': 1, 'campana.strato': 4, 'campana.scelta': scelta });
      const v = visibili(s);
      expect(v.includes('campana-il-rumore-delle-onde')).toBe(scelta === 1);
      expect(v.includes('campana-il-conto-che-scende')).toBe(scelta === 2);
      expect(requisitiSoddisfatti(s, storylet('campana-batacchio-la-scelta').requisiti, c)).toBe(false);
    }
  });

  it('gli oggetti di grado 5 sono validi e stanno nelle regole dei punti', () => {
    const quinti = c.oggetti.filter((o) => o.id.startsWith('campana-') && o.grado === 5);
    expect(quinti.map((o) => o.slot).sort()).toEqual(['arma', 'arma', 'armatura', 'scudo']);
    expect(quinti.some((o) => o.proprieta.riserva > 0)).toBe(true); // l'arma per chi usa la magia
    for (const o of quinti) {
      expect(Oggetto.safeParse(o).success, o.id).toBe(true);
      let punti = o.dadi + Object.values(o.proprieta.talento).reduce((a, b) => a + b, 0);
      for (const [k, costo] of Object.entries(COSTI_PROPRIETA)) {
        const v = o.proprieta[k as keyof typeof COSTI_PROPRIETA];
        punti += typeof v === 'boolean' ? (v ? costo : 0) : (v as number) * costo;
      }
      expect(punti, o.id).toBeLessThanOrEqual(o.grado + o.difetti.length);
    }
    const accessorio = c.oggetti.find((o) => o.id === 'campana-conchiglia-sorda')!;
    expect(accessorio.slot).toBe('accessorio');
    expect(accessorio.grado).toBe(3);
    // gli oggetti arrivano davvero: ogni oggetto della Campana è dato da almeno un esito
    const dati = new Set(c.storylet.flatMap((st) => st.opzioni.flatMap((o) => [o.successo, o.vittoria, o.esito]
      .flatMap((e) => Object.keys(e?.effetti ?? {})))));
    for (const o of c.oggetti.filter((x) => x.id.startsWith('campana-'))) expect(dati.has(`oggetto.${o.id}`), o.id).toBe(true);
  });
});
