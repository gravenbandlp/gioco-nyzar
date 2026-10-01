import { describe, it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { nuovoPersonaggio } from '../src/motore/personaggio';
import { segnaTempo, sospendiTempo, PAUSA_MAX } from '../src/motore/tempo';

describe('tempo di gioco', () => {
  it('conta fra un clic e l\'altro, e una pausa lunga vale un minuto', () => {
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');
    segnaTempo(s, 1000);
    segnaTempo(s, 31_000, 'pista.corin');
    expect(s.tempo!.totale).toBe(30_000);
    expect(s.tempo!.serie['pista.corin']).toBe(30_000);
    segnaTempo(s, 31_000 + PAUSA_MAX + 1);
    expect(s.tempo!.totale).toBe(90_000);
  });
  it('la pagina in background non conta', () => {
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');
    segnaTempo(s, 0);
    sospendiTempo(s, 10_000);
    segnaTempo(s, 500_000); // ritorno: riapre il conto senza contare l'assenza
    segnaTempo(s, 520_000);
    expect(s.tempo!.totale).toBe(30_000);
  });
});
