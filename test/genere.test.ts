// Il genere del protagonista nei testi: i segni {maschile|femminile}, la loro validazione e la riscrittura dei
// contenuti per il corpo del personaggio.
import { describe, it, expect, afterAll } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { applicaGenere, declina, erroriGenere, genereDi } from '../src/motore/genere';
import { erroriVoci } from '../src/motore/voci';

/** Tutti i testi dei contenuti, con il punto in cui stanno. */
function testi(o: unknown, fuori: string[] = []): string[] {
  if (typeof o === 'string') fuori.push(o);
  else if (o && typeof o === 'object') for (const v of Object.values(o)) testi(v, fuori);
  return fuori;
}

describe('il genere nei testi', () => {
  afterAll(() => applicaGenere(c, 'maschile'));

  it('un segno sceglie la forma del genere', () => {
    expect(declina('Sei stanc{o|a} e bagnat{o|a}.', 'maschile')).toBe('Sei stanco e bagnato.');
    expect(declina('Sei stanc{o|a} e bagnat{o|a}.', 'femminile')).toBe('Sei stanca e bagnata.');
    expect(declina('«{Ragazzo mio|Ragazza mia}», dice.', 'femminile')).toBe('«Ragazza mia», dice.');
    expect(declina('Nessun segno qui.', 'femminile')).toBe('Nessun segno qui.');
  });

  it('i segni rotti si vedono, quelli giusti no', () => {
    expect(erroriGenere('Sei stanc{o|a}.')).toEqual([]);
    expect(erroriGenere('Sei stanc{o|a|e}.')).not.toEqual([]);
    expect(erroriGenere('Sei stanc{o|a.')).not.toEqual([]);
    // un paragrafo che comincia con un segno di genere non è la voce di un'abilità
    expect(erroriVoci('{Uno|Una} di loro, ormai.')).toEqual([]);
  });

  it('il corpo femminile dà i testi al femminile, e senza corpo restano al maschile', () => {
    expect(genereDi({ corpo: 'femminile' })).toBe('femminile');
    expect(genereDi({})).toBe('maschile');
    expect(genereDi(undefined)).toBe('maschile');
  });

  it('i contenuti hanno i segni, e si riscrivono per tutti e due i generi senza lasciarne', () => {
    const segnati = testi(c).filter((t) => /\{[^{}|]*\|[^{}|]*\}/.test(t));
    expect(segnati.length).toBeGreaterThan(1000);
    const origine = () => c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!.testo;
    applicaGenere(c, 'femminile');
    expect(testi(c).some((t) => /\{[^{}|]*\|[^{}|]*\}/.test(t))).toBe(false);
    expect(origine()).toMatch(/^Sei cresciuta in Città Bassa/);
    applicaGenere(c, 'maschile');
    expect(testi(c).some((t) => /\{[^{}|]*\|[^{}|]*\}/.test(t))).toBe(false);
    expect(origine()).toMatch(/^Sei cresciuto in Città Bassa/);
  });
});
