import { CONTENUTI as c } from '../src/dati/contenuti';
import { nuovoPersonaggio } from '../src/motore/personaggio';
import { storia, luoghiQui, type Contesto } from '../src/ui/viste';

function contesto(area: string, luogo?: string): Contesto {
  const o = c.origini[0]!;
  const s = nuovoPersonaggio('Prova', o, 0, area);
  delete s.quality['prologo'];
  s.candele = 20;
  return { s, c, vista: { tipo: 'area' }, scheda: 'storia', frammento: undefined, confermaNuovo: false, avviso: '', ora: 0, luogo };
}

describe('luoghi dei quartieri', () => {
  it('ogni area della città ha i suoi luoghi, e nessun luogo sta fuori città', () => {
    for (const id of ['citta-bassa', 'ponti-sospesi', 'quartieri-alti']) expect(c.luoghi.some((l) => l.area === id)).toBe(true);
    for (const l of c.luoghi) {
      const a = c.aree.find((z) => z.id === l.area)!;
      expect(a.penalita || !!a.spedizione).toBe(false);
    }
  });

  it('la vista del quartiere mostra le schede dei luoghi e tiene fuori i ripetibili che stanno dentro', () => {
    const x = contesto('citta-bassa');
    const html = storia(x);
    expect(html).toContain('data-az="luogo" data-id="pignatta-grassa"');
    expect(html).not.toContain('data-id="orecchie-pignatta"'); // si trova dentro la Pignatta
  });

  it('la pagina del luogo mostra i suoi ripetibili e le sue botteghe', () => {
    const x = contesto('citta-bassa', 'fucina-dei-due-mastini');
    const html = storia(x);
    expect(html).toContain('data-az="esci-luogo"');
    expect(html).toContain('data-id="il-cortile-dei-due-mastini"');
    expect(html).toContain('data-neg="fucina-dei-due-mastini"');
  });

  it('un luogo di un\'altra area viene ignorato', () => {
    const x = contesto('ponti-sospesi', 'pignatta-grassa');
    expect(luoghiQui(x.s, c).every((l) => l.area === 'ponti-sospesi')).toBe(true);
    expect(storia(x)).not.toContain('data-az="esci-luogo"');
  });
});
