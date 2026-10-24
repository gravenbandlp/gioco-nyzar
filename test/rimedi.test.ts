// Le correzioni del 23 ottobre 2026: oggetti unici che tornavano vendendoli, reroll ripetuti, proprietà delle armi.
import { describe, it, expect } from 'vitest';
import { rngConSeme } from '../src/motore/dadi';
import { nuovoPersonaggio, requisitiSoddisfatti, type Stato } from '../src/motore/personaggio';
import { scegli, vendi, secondaScelta, secondaSceltaDisponibile, correggibile } from '../src/motore/azioni';
import { combattenteDaStato, iniziaCombattimento, round } from '../src/motore/combattimento';
import { ricevi, migraOggetti, indossa } from '../src/motore/oggetti';
import { DIFETTI, COSTI_PROPRIETA, type TStorylet } from '../src/motore/contenuto';
import { EFFETTI_ARMI, EFFETTI_PROPRIETA, EFFETTI_DIFETTI } from '../src/ui/componenti';
import { CONTENUTI as c } from '../src/dati/contenuti';

const figlio = (): Stato => {
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, 'citta-bassa');
  delete s.quality['prologo'];
  return s;
};
const storylet = (id: string) => c.storylet.find((x) => x.id === id)!;

describe('gli oggetti unici non tornano vendendoli', () => {
  it('il pezzo di Irsa non si riapre dopo aver venduto la balestra', () => {
    const s = figlio();
    s.quality['fazione.gilda'] = 12;
    const st = storylet('gilda-il-pezzo-di-irsa');
    expect(requisitiSoddisfatti(s, st.requisiti, c)).toBe(true);
    ricevi(s, c, 'gilda-balestra-dei-ponti');
    expect(vendi(s, 'armeria-di-irsa', 'oggetto.gilda-balestra-dei-ponti', c)).toBe(true);
    expect(s.quality['oggetto.gilda-balestra-dei-ponti']).toBe(0);
    expect(requisitiSoddisfatti(s, st.requisiti, c)).toBe(false);
  });
  it('Uzgreth non torna alle fosse dopo aver venduto lo spadone', () => {
    const s = figlio();
    s.quality['pista.acciaio'] = 6;
    s.quality['profondita.segrete-dell-ira'] = 2;
    const st = storylet('uzgreth-alle-fosse');
    expect(requisitiSoddisfatti(s, st.requisiti, c)).toBe(true);
    ricevi(s, c, 'spadone-di-uzgreth');
    expect(vendi(s, 'armeria-di-irsa', 'oggetto.spadone-di-uzgreth', c)).toBe(true);
    expect(requisitiSoddisfatti(s, st.requisiti, c)).toBe(false);
  });
  it('un salvataggio di prima ricorda gli oggetti che ha', () => {
    const s = figlio();
    s.quality['oggetto.balestra-vansaya'] = 1;
    migraOggetti(s);
    expect(s.quality['avuto.balestra-vansaya']).toBe(1);
  });
  it('nessuna storia dà un oggetto unico guardando solo se lo possiedi adesso', () => {
    // il respiratore e il congegno restano: il primo si ricompra se perso, il secondo apre una via diversa
    const ammessi = ['oggetto.respiratore == 0', 'oggetto.congegno-di-controllo == 0'];
    const guardie = c.storylet.flatMap((st) => [...(st.requisiti ?? []), ...st.opzioni.flatMap((o) => [...(o.requisiti ?? []), ...(o.quando ?? [])])]
      .filter((r) => /^oggetto\.[a-z0-9-]+ == 0$/.test(r) && !ammessi.includes(r)).map((r) => `${st.id}: ${r}`));
    expect(guardie).toEqual([]);
  });
});

describe('una prova si rifà una volta sola', () => {
  const prova: TStorylet = {
    id: 'carta-prova', titolo: 'Prova', area: 'citta-bassa', tipo: 'carta', ripetibile: false, requisiti: [], testo: 'x',
    opzioni: [{ testo: 'Saltare', prova: { attributo: 'fisico', abilita: 'atletica', difficolta: 'Molto difficile' },
      successo: { testo: 'Sì.' }, fallimento: { testo: 'No.' } }],
  } as TStorylet;
  const conProva = { ...c, storylet: [...c.storylet, prova] };

  it('dopo la seconda scelta non si rifà più, e la carta resta scartata', () => {
    const s = figlio();
    ricevi(s, c, 'specchio-della-seconda-scelta');
    s.attributi.fisico = 0; s.abilita['atletica'] = 0;
    s.mano = ['carta-prova'];
    const prima = structuredClone(s);
    const r = scegli(s, prova, 0, conProva, 0, rngConSeme(1));
    if (r.tipo !== 'risultato') throw new Error('atteso risultato');
    expect(r.risultato.riuscito).toBe(false);
    expect(secondaSceltaDisponibile(s, r.risultato, conProva)).toBe(true);
    const r2 = secondaScelta(s, prima, prova, 0, conProva, 0, rngConSeme(2));
    if (r2.tipo !== 'risultato') throw new Error('atteso risultato');
    expect(r2.risultato.riuscito).toBe(false);
    expect(secondaSceltaDisponibile(s, r2.risultato, conProva)).toBe(false);
    s.quality['incantesimo.correzione'] = 1;
    expect(correggibile(s, r2.risultato)).toBe(false);
    expect(s.mano).not.toContain('carta-prova');
  });
});

describe('le proprietà delle armi', () => {
  it('ogni proprietà e ogni difetto ha la sua spiegazione nel regolamento', () => {
    for (const a of c.armi) for (const p of a.proprieta) expect(EFFETTI_ARMI[p], `${a.id}: ${p}`).toBeDefined();
    for (const d of DIFETTI) expect(EFFETTI_DIFETTI[d], d).toBeDefined();
    const booleane = Object.keys(COSTI_PROPRIETA).filter((k) => !['affilata', 'penetrante', 'riserva', 'rapida', 'robusta'].includes(k));
    for (const k of booleane) expect(EFFETTI_PROPRIETA[k], k).toBeDefined();
  });
  const con = (arma: string) => {
    const s = figlio();
    ricevi(s, c, arma);
    indossa(s, c, arma);
    return combattenteDaStato(s, c);
  };
  it('Bilanciata dà un dado in attacco, Portata uno in difesa, Spietata il danno minimo a 2', () => {
    const ascia = con('ascia-da-battaglia');
    expect(con('spada-lunga').attacco).toBe(ascia.attacco + 1);
    expect(con('lancia').difesa).toBe(ascia.difesa + 1);
    expect(ascia.spietata).toBe(true);
  });
  it('la balestra ricarica dopo ogni tiro, con il caricatore dopo due', () => {
    for (const [arma, tiri] of [['balestra-pesante', 1], ['balestra-vansaya', 2]] as const) {
      const pg = { ...con(arma), pf: 999, pfMax: 999, inceppamento: false };
      const sc = c.scontri.find((x) => x.id === 'le-fosse')!;
      const cs = iniziaCombattimento(pg, sc, c, {}, rngConSeme(3));
      for (const n of cs.combattenti) if (n.lato === 'nemico') { n.pf = 999; n.pfMax = 999; }
      const ricariche = () => cs.log.filter((l) => l === 'Ricarichi l\'arma.').length;
      for (let i = 0; i < tiri; i++) { round(cs, { tipo: 'attacco', bersaglio: '' }, rngConSeme(10 + i)); expect(ricariche()).toBe(0); }
      round(cs, { tipo: 'attacco', bersaglio: '' }, rngConSeme(20));
      expect(ricariche()).toBe(1);
    }
  });
});
