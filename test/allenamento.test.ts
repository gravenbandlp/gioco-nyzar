// Ogni abilità deve avere almeno un modo di essere allenata da zero, in città, senza piste e senza rischi seri:
// un ripetibile con una prova su quella sola abilità, Facile o più facile.
import { CONTENUTI as c } from '../src/dati/contenuti';
import { TUTTE_LE_ABILITA } from '../src/motore/regole';
import { parseRequisito, requisitoSoddisfatto, nuovoPersonaggio } from '../src/motore/personaggio';

const CITTA = ['citta-bassa', 'ponti-sospesi'];
const FACILI = ['Molto facile', 'Facile'];

describe('allenamento', () => {
  it.each(TUTTE_LE_ABILITA.filter((a) => a !== 'magia'))('%s si allena da zero in città', (ab) => {
    const nuovo = nuovoPersonaggio('Prova', c.origini[0]!, 0, 'citta-bassa');
    // "senza piste": i requisiti sulle piste devono reggere a pista zero (un `!=` che salta qualche passo va bene)
    const aZero = (r: string) => { const q = parseRequisito(r); return !q.chiave.startsWith('pista.') || requisitoSoddisfatto(nuovo, r, c); };
    const vie = c.storylet.filter((st) => st.ripetibile && CITTA.includes(st.area) && st.requisiti.every(aZero))
      .flatMap((st) => st.opzioni)
      .filter((o) => o.prova && !Array.isArray(o.prova.abilita) ? o.prova.abilita === ab : o.prova?.abilita.length === 1 && o.prova.abilita[0] === ab)
      .filter((o) => FACILI.includes(o.prova!.difficolta));
    expect(vie.length).toBeGreaterThan(0);
  });
});
