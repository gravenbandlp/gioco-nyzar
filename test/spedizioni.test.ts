import { nuovoPersonaggio, cartePescabili, type Stato } from '../src/motore/personaggio';
import { puoEntrare, muovi, scegli } from '../src/motore/azioni';
import { crisiAttiva } from '../src/motore/crisi';
import { stanzeVisibili, ritirati, profondita, inSpedizione } from '../src/motore/spedizioni';
import { CONTENUTI } from '../src/dati/contenuti';
import type { TContenuti, TStorylet } from '../src/motore/contenuto';
import { rngConSeme } from '../src/motore/dadi';

// Una spedizione di prova con sei stanze e un cuore a profondità 3.
function stanza(n: number): TStorylet {
  return {
    id: `stanza-${n}`, titolo: `Stanza ${n}`, area: 'grotta', tipo: 'fisso', ripetibile: true, requisiti: [], testo: 'Buio.',
    opzioni: [{ testo: 'Avanti', costo: 1, requisiti: [], esito: { titolo: 'Fatto', testo: 'Passi oltre.', effetti: { 'profondita.grotta': 1 }, imposta: {}, pe: {} } }],
  } as unknown as TStorylet;
}
const c: TContenuti = {
  ...CONTENUTI,
  aree: [...CONTENUTI.aree, { id: 'grotta', nome: 'Grotta', testo: 'Una grotta.', accesso: [], gabella: 0, negozi: [], penalita: false, spedizione: { ritorno: 'citta-bassa', soglia: 3, stanze: 3 } }],
  storylet: [...CONTENUTI.storylet, ...[1, 2, 3, 4, 5, 6].map(stanza)],
  quality: [...CONTENUTI.quality, { id: 'profondita.grotta', nome: 'Profondità', categoria: 'stato' }],
};

const pg = (): Stato => {
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, 'citta-bassa');
  delete s.quality['prologo'];
  return s;
};

describe('spedizioni', () => {
  it('non si raggiungono con la mappa e non si lasciano con la mappa', () => {
    const s = pg();
    expect(puoEntrare(s, 'grotta', c).ok).toBe(false);
    s.area = 'grotta';
    expect(inSpedizione(s, c)).toBe(true);
    expect(muovi(s, 'ponti-sospesi', c)).toBe(false);
  });
  it('mostrano tre stanze e le rimescolano quando la profondità sale', () => {
    const s = pg();
    s.area = 'grotta';
    const prima = stanzeVisibili(s, c).map((x) => x.id);
    expect(prima).toHaveLength(3);
    const viste = new Set(prima);
    for (let i = 0; i < 6; i++) {
      const st = stanzeVisibili(s, c)[0]!;
      scegli(s, st, 0, c, 0, rngConSeme(i));
      stanzeVisibili(s, c).forEach((x) => viste.add(x.id));
    }
    expect(profondita(s, 'grotta')).toBe(6);
    expect(viste.size).toBeGreaterThan(3);
  });
  it('la ritirata riporta in città e azzera la profondità', () => {
    const s = pg();
    s.area = 'grotta';
    s.quality['profondita.grotta'] = 2;
    expect(ritirati(s, c)).toBe(true);
    expect(s.area).toBe('citta-bassa');
    expect(profondita(s, 'grotta')).toBe(0);
  });
  it('le carte valide ovunque restano in città', () => {
    const s = pg();
    s.quality['ferite'] = 5;
    expect(cartePescabili(s, c).some((x) => x.area === 'ovunque')).toBe(true);
    s.area = 'grotta';
    expect(cartePescabili(s, c).some((x) => x.area === 'ovunque')).toBe(false);
  });
  it('le crisi scattano anche in spedizione', () => {
    const s = pg();
    s.area = 'grotta';
    s.quality['ferite'] = 8;
    expect(crisiAttiva(s, c)?.id).toBe('crisi-ferite');
  });
});
