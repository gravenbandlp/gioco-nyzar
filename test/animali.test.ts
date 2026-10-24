// Lo slot Animale (24 ottobre 2026): un cavallo, la lupa o il puma; i cavalli non danno bonus e gli animali non si vendono.
import { describe, it, expect } from 'vitest';
import { nuovoPersonaggio, requisitiSoddisfatti, type Stato } from '../src/motore/personaggio';
import { vendi } from '../src/motore/azioni';
import { ricevi, migraOggetti, indossa, indossati, talento } from '../src/motore/oggetti';
import { figuraDi } from '../src/ui/ritratto/aspetti';
import { CONTENUTI as c } from '../src/dati/contenuti';

const figlio = (): Stato => {
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, 'citta-bassa');
  delete s.quality['prologo'];
  return s;
};
const CAVALLI = ['cavallo-da-guerra', 'ombrafosca', 'laresh-puledra-grigia'];

describe('lo slot Animale', () => {
  it('cavalli, lupa e puma stanno nello slot Animale, e i cavalli non danno bonus', () => {
    for (const id of [...CAVALLI, 'circolo-lupa-brina', 'circolo-braska']) expect(c.oggetti.find((o) => o.id === id)?.slot, id).toBe('animale');
    for (const id of CAVALLI) {
      const o = c.oggetti.find((x) => x.id === id)!;
      expect(o.proprieta.talento, id).toEqual({});
      expect(o.proprieta.chiave, id).toEqual(['cavalcatura']);
    }
  });
  it('il primo animale si porta con sé, gli altri restano negli Averi e si scambiano', () => {
    const s = figlio();
    ricevi(s, c, 'ombrafosca');
    ricevi(s, c, 'cavallo-da-guerra');
    expect(s.animale).toBe('ombrafosca');
    expect(s.accessori).toEqual([]);
    expect(indossa(s, c, 'cavallo-da-guerra')).toBe(true);
    expect(s.animale).toBe('cavallo-da-guerra');
    expect(indossati(s, c).map((o) => o.id)).toContain('cavallo-da-guerra');
    expect(figuraDi(s, c).accessori.some((a) => a.tipo === 'compagno')).toBe(true);
  });
  it('un cavallo negli Averi apre le opzioni a cavallo e non dà talento', () => {
    const s = figlio();
    ricevi(s, c, 'circolo-lupa-brina');
    ricevi(s, c, 'laresh-puledra-grigia');
    expect(s.animale).toBe('circolo-lupa-brina');
    expect(requisitiSoddisfatti(s, ['chiave.cavalcatura >= 1'], c)).toBe(true);
    expect(talento(s, c, 'cavalcare')).toBe(0);
    expect(talento(s, c, 'addestrare-animali')).toBe(1); // la lupa tiene i suoi bonus
  });
  it('nessuna bottega compra un animale', () => {
    const s = figlio();
    s.quality['rep.nodo'] = 10;
    for (const id of [...CAVALLI, 'circolo-lupa-brina', 'circolo-braska']) {
      s.quality[`oggetto.${id}`] = 2;
      for (const n of c.negozi) expect(vendi(s, n.id, `oggetto.${id}`, c), `${n.id} ${id}`).toBe(false);
    }
  });
  it('un salvataggio di prima sposta gli animali dagli accessori e ridà i cavalli venduti', () => {
    const s = figlio();
    s.quality['oggetto.circolo-lupa-brina'] = 1;
    s.accessori = ['circolo-lupa-brina'];
    delete (s as Partial<Stato>).animale;
    Object.assign(s.quality, { 'pista.corin': 5, ombrafosca: 2, 'fazione.laresh': 6 });
    migraOggetti(s, c);
    expect(s.accessori).toEqual([]);
    expect(s.animale).toBe('circolo-lupa-brina');
    for (const id of CAVALLI) expect(s.quality[`oggetto.${id}`], id).toBe(1);
    migraOggetti(s, c); // una seconda volta non ne dà altri
    for (const id of CAVALLI) expect(s.quality[`oggetto.${id}`], id).toBe(1);
  });
  it('chi ha lasciato andare Ombrafosca non lo riceve', () => {
    const s = figlio();
    s.quality['ombrafosca'] = 1;
    migraOggetti(s, c);
    expect(s.quality['oggetto.ombrafosca'] ?? 0).toBe(0);
  });
});
