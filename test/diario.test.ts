import { nuovoPersonaggio } from '../src/motore/personaggio';
import { annota, nelDiario, strappa, DIARIO_MAX } from '../src/motore/diario';
import { prosa, impostaGlossario } from '../src/ui/componenti';
import { CONTENUTI as c } from '../src/dati/contenuti';

const pagina = (n: number) => ({ quando: n, storylet: 'x', scena: 'Scena', luogo: 'Città Bassa', titolo: `T${n}`, testo: `Testo ${n}` });

describe('diario', () => {
  it('annota, non duplica, strappa e tiene al massimo le pagine più recenti', () => {
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');
    expect(annota(s, pagina(1))).toBe(true);
    expect(annota(s, { ...pagina(1), quando: 2 })).toBe(false);
    expect(nelDiario(s, pagina(1))).toBe(true);
    strappa(s, 1);
    expect(s.diario).toHaveLength(0);
    for (let i = 0; i < DIARIO_MAX + 5; i++) annota(s, pagina(i));
    expect(s.diario).toHaveLength(DIARIO_MAX);
    expect(s.diario![0]!.quando).toBe(5);
  });
});

describe('registri della prosa', () => {
  it('distingue parlato, pensiero ed enfasi', () => {
    impostaGlossario([], () => true);
    const out = prosa('Entri. «Buonasera» dice. *Questa donna sa chi sei.* Sulla catena c\'è scritto *Ospiti Benvenuti*.');
    expect(out).toContain('<span class="parlato">«Buonasera»</span>');
    expect(out).toContain('<span class="pensiero">Questa donna sa chi sei.</span>');
    expect(out).toContain('<em>Ospiti Benvenuti</em>');
  });
});
