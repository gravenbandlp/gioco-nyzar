// I mazzi dei tre quartieri: abbastanza carte perché la mano non si ripeta subito, e ogni carta pescabile all'inizio
// ha qualcosa da fare per un personaggio appena creato di qualunque origine.
import { describe, it, expect } from 'vitest';
import { nuovoPersonaggio, cartePescabili } from '../src/motore/personaggio';
import { anteprima } from '../src/motore/azioni';
import { CONTENUTI as c } from '../src/dati/contenuti';

const QUARTIERI = ['citta-bassa', 'ponti-sospesi', 'quartieri-alti'];

describe('mazzi della città', () => {
  it('ogni quartiere ha almeno venti carte sue', () => {
    for (const q of QUARTIERI) expect(c.storylet.filter((s) => s.tipo === 'carta' && s.area === q).length, q).toBeGreaterThanOrEqual(20);
  });

  it('le carte pescabili all\'inizio hanno un\'opzione percorribile per ogni origine', () => {
    for (const o of c.origini) for (const q of QUARTIERI) {
      const s = nuovoPersonaggio('Vessa', o, 0, q);
      delete s.quality['prologo'];
      s.area = q;
      s.quality['monete'] = 10;
      const mazzo = cartePescabili(s, c).filter((x) => x.area === q);
      expect(mazzo.length, `${o.id} in ${q}`).toBeGreaterThanOrEqual(12);
      for (const st of mazzo) expect(st.opzioni.some((op) => anteprima(s, op, c).mancanti.length === 0), `${o.id}: ${st.id}`).toBe(true);
    }
  });
});
