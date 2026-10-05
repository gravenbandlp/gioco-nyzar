import { rngConSeme } from '../src/motore/dadi';
import { nuovoPersonaggio } from '../src/motore/personaggio';
import { round, iniziaCombattimento, combattenteDaStato, azioneAutomatica } from '../src/motore/combattimento';
import { concludiCombattimento } from '../src/motore/azioni';
import { repertorio } from '../src/motore/magia';
import { CONTENUTI as c } from '../src/dati/contenuti';

const guerriero = () => nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, 'citta-bassa');
const scontro = (id: string, seme = 1) => {
  const s = guerriero();
  return { s, cs: iniziaCombattimento(combattenteDaStato(s, c), c.scontri.find((x) => x.id === id)!, c, {}, rngConSeme(seme), repertorio(s, c)) };
};
const combatti = (id: string, seme: number) => {
  const { s, cs } = scontro(id, seme);
  for (const x of cs.combattenti) if (x.lato === 'pg') { x.pf = 60; x.pfMax = 60; } // abbastanza a lungo da vederli lanciare
  const rng = rngConSeme(seme + 100);
  while (!cs.finito) round(cs, azioneAutomatica(cs), rng);
  return { s, cs };
};

describe('nemici con la magia', () => {
  it('gli sciamani e i maghi hanno incantesimi, dadi ed Energia', () => {
    for (const id of ['bolgrum', 'kessa', 'aurenne', 'borgoth', 'yoggoth', 'senzavolto', 'osric-wren-spettrale', 'orco-del-tamburo', 'nestor-gramm', 'rozalia-marga']) {
      const n = c.nemici.find((x) => x.id === id)!;
      expect(n.incantesimi.length, id).toBeGreaterThan(0);
      expect(n.magia, id).toBeGreaterThan(0);
      expect(n.energia, id).toBeGreaterThan(0);
    }
    expect(c.nemici.find((x) => x.id === 'bolgrum')!.incantesimi.length).toBeGreaterThanOrEqual(3);
  });
  it('Bolgrum lancia davvero, e il Canto degli antenati arriva anche a Skarr', () => {
    let lanci = 0, canto = false;
    for (let seme = 1; seme <= 10; seme++) {
      const { cs } = combatti('la-torre-di-bolgrum', seme);
      const suoi = (cs.eventi ?? []).filter((e) => e.chi?.startsWith('bolgrum') && e.nome);
      lanci += suoi.length;
      if (suoi.some((e) => e.nome === 'Canto degli antenati' && e.tipo === 'effetto')) canto = true;
    }
    expect(lanci).toBeGreaterThan(5);
    expect(canto).toBe(true);
  });
  it('gli alchimisti usano le fiale, e il registro lo dice', () => {
    for (const id of ['nestor-gramm', 'rozalia-marga']) expect(c.nemici.find((x) => x.id === id)!.incantesimi.every((i) => c.incantesimi.find((z) => z.id === i)!.alchimia)).toBe(true);
    let usate = 0;
    for (let seme = 1; seme <= 8; seme++) {
      const { cs } = combatti('il-retrobottega-di-gramm', seme);
      usate += cs.log.filter((l) => l.startsWith('Nestor Gramm usa ')).length;
      expect(cs.log.some((l) => l.startsWith('Nestor Gramm lancia '))).toBe(false);
    }
    expect(usate).toBeGreaterThan(3);
  });
  it("l'Energia di un nemico si consuma e non va sotto zero", () => {
    const { cs } = combatti('garin-e-kessa', 3);
    const kessa = cs.combattenti.find((x) => x.id.startsWith('kessa'))!;
    expect(kessa.energia).toBeGreaterThanOrEqual(0);
    expect(kessa.energia).toBeLessThan(kessa.energiaMax);
  });
  it('i lanci dei nemici non danno Tormento al personaggio né PE di Magia', () => {
    for (let seme = 1; seme <= 6; seme++) {
      const { s, cs } = combatti('l-aula-dell-ira', seme);
      expect(cs.costi['tormento'] ?? 0).toBe(0); // il guerriero non lancia: la Dissonanza dei nemici resta loro
      const st = c.storylet.find((x) => x.opzioni.some((o) => o.combattimento === 'l-aula-dell-ira'))!;
      const i = st.opzioni.findIndex((o) => o.combattimento === 'l-aula-dell-ira');
      const r = concludiCombattimento(s, st, i, cs, c);
      expect(r.crescite.some((x) => x.chiave === 'magia')).toBe(false);
    }
  });
});
