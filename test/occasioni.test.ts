// Il mazzo delle occasioni dopo il 17 ottobre 2026: rarità e pesca pesata, carte inevitabili con la tregua,
// rintocchi ridati dalle carte di ristoro.
import { describe, it, expect } from 'vitest';
import { CONTENUTI } from '../src/dati/contenuti';
import type { TContenuti, TStorylet } from '../src/motore/contenuto';
import { nuovoPersonaggio, pesca, cartePescabili, applicaEffetti, TREGUA } from '../src/motore/personaggio';
import { scegli } from '../src/motore/azioni';
import { crisiAttiva } from '../src/motore/crisi';
import { RINTOCCHI_MAX, TREGUA_INEVITABILI } from '../src/motore/regole';

const carta = (id: string, extra: Partial<TStorylet> = {}): TStorylet => ({
  id, titolo: id, area: 'citta-bassa', tipo: 'carta', ripetibile: false, requisiti: [], testo: 'Una carta di prova.',
  opzioni: [{ testo: 'Fare', esito: { testo: 'Fatto.', effetti: { monete: 1 } } }],
  ...extra,
});
const mazzo = (...carte: TStorylet[]): TContenuti => ({ ...CONTENUTI, storylet: carte });
const nuovo = () => {
  const s = nuovoPersonaggio('Vessa', CONTENUTI.origini[0]!, 0, 'citta-bassa');
  delete s.quality['prologo'];
  s.area = 'citta-bassa';
  return s;
};

describe('occasioni', () => {
  it('la pesca segue i pesi della rarità', () => {
    const c = mazzo(carta('comune'), carta('insolita', { rarita: 'insolita' }), carta('rara', { rarita: 'rara' }));
    const conta: Record<string, number> = { comune: 0, insolita: 0, rara: 0 };
    // pesi 3, 2, 1 su un totale di 6: un rng che scorre l'intervallo in sei parti uguali
    for (let i = 0; i < 6; i++) {
      const s = nuovo();
      s.coda = 1;
      conta[pesca(s, c, Date.now(), () => (i + 0.5) / 6)!]!++;
    }
    expect(conta).toEqual({ comune: 3, insolita: 2, rara: 1 });
  });

  it('dopo un\'inevitabile ne passano sei pescate prima di un\'altra', () => {
    const agguato = carta('agguato', { inevitabile: true, opzioni: [{ testo: 'Combattere', costo: 0, esito: { testo: 'Fatto.', effetti: { ferite: 1 } } }] });
    const c = mazzo(carta('quieta'), agguato);
    const s = nuovo();
    s.coda = 1;
    expect(pesca(s, c, Date.now(), () => 0.99)).toBe('agguato');
    expect(s.quality[TREGUA]).toBe(TREGUA_INEVITABILI);
    expect(cartePescabili(s, c).map((x) => x.id)).toEqual(['quieta']);
    for (let i = 0; i < TREGUA_INEVITABILI; i++) {
      s.mano = [];
      s.coda = 1;
      expect(pesca(s, c, Date.now(), () => 0)).toBe('quieta');
    }
    expect(cartePescabili(s, c).map((x) => x.id)).toContain('agguato');
  });

  it('un\'inevitabile in mano si apre da sola e si scarta anche con un\'opzione a costo zero', () => {
    const agguato = carta('agguato', { inevitabile: true, opzioni: [{ testo: 'Pagare', costo: 0, esito: { testo: 'Fatto.', effetti: { monete: -1 } } }] });
    const c = mazzo(agguato);
    const s = nuovo();
    s.mano = ['agguato'];
    expect(crisiAttiva(s, c)?.id).toBe('agguato');
    const r = scegli(s, agguato, 0, c, Date.now());
    expect(r.tipo).toBe('risultato');
    expect(s.mano).toEqual([]);
    expect(crisiAttiva(s, c)).toBeUndefined();
  });

  it('le carte di ristoro ridanno rintocchi, mai oltre il tetto', () => {
    const s = nuovo();
    s.rintocchi = 10;
    applicaEffetti(s, { rintocchi: 5 }, CONTENUTI);
    expect(s.rintocchi).toBe(15);
    applicaEffetti(s, { rintocchi: 100 }, CONTENUTI);
    expect(s.rintocchi).toBe(RINTOCCHI_MAX);
  });

  it('le inevitabili dei contenuti rispettano le loro regole', () => {
    for (const st of CONTENUTI.storylet.filter((x) => x.inevitabile)) {
      expect(st.tipo, st.id).toBe('carta');
      expect(st.opzioni.every((o) => o.costo === 0), st.id).toBe(true);
      expect(st.opzioni.some((o) => !o.requisiti?.length && !o.quando?.length), st.id).toBe(true);
    }
  });
});
