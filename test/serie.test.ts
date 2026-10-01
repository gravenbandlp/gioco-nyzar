import { describe, it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { serieDi, avanzamento } from '../src/motore/serie';
import { nuovoPersonaggio } from '../src/motore/personaggio';

describe('serie', () => {
  const m = serieDi(c);
  it('ricava il massimo delle piste dai contenuti', () => {
    const max = Object.fromEntries(m.serie.filter((s) => s.tipo === 'pista').map((s) => [s.quality, s.massimo]));
    expect(max).toMatchObject({ 'pista.dama-argento': 11, 'pista.sepolcro': 7, 'pista.capomozzo': 10, 'pista.pelle': 7, 'pista.arena': 5 });
  });
  it('raccoglie le storie dei luoghi per reputazione, con tre passi', () => {
    const botteghe = m.serie.find((s) => s.id === 'luogo.rep.botteghe')!;
    expect(botteghe.passi).toEqual(['botteghe.mastini', 'botteghe.kasselt', 'botteghe.capolavoro']);
    expect(m.diStorylet.get('il-cuoio-di-kasselt')).toBe(botteghe);
    expect(m.diStorylet.get('la-cucciolata')).toBe(botteghe); // un seguito eredita la serie
  });
  it('dà una serie a ogni scena delle piste principali', () => {
    for (const id of ['maedric-holl', 'il-ponte-dei-morti-di-notte', 'galdrick-e-la-mappa-rossa', 'galdrick-e-vesh', 'la-prigione-del-costruttore'])
      expect(m.diStorylet.get(id), id).toBeTruthy();
  });
  it('conta i passi fatti', () => {
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');
    s.quality['pista.registro'] = 3;
    s.quality['accademia.tobol'] = 2;
    expect(avanzamento(s, m.serie.find((z) => z.quality === 'pista.registro')!)).toBe(3);
    expect(avanzamento(s, m.serie.find((z) => z.id === 'luogo.rep.accademia')!)).toBe(1);
  });
});
