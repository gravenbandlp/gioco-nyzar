// Le Avventure (docs/piano-avventure.md): ogni pista `avventura.x` porta il marchio «Avventura», sta nella sezione
// delle Cronache, ha una spedizione da 10 passi e chiude con un oggetto di grado 4.
import { describe, it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { serieDi } from '../src/motore/serie';

const avventure = c.quality.filter((q) => q.categoria === 'pista' && q.id.startsWith('avventura.')).map((q) => q.id.slice('avventura.'.length));

describe('le avventure', () => {
  const { serie, spedizioni } = serieDi(c);

  it('sono quattordici, tutte nella sezione delle Avventure e con il loro genere', () => {
    expect(avventure).toHaveLength(14);
    const sezione = c.sezioni.find((x) => x.id === 'avventure')!;
    expect([...sezione.serie].sort()).toEqual(avventure.map((id) => `avventura.${id}`).sort());
    for (const id of avventure) expect(serie.find((z) => z.id === `avventura.${id}`)?.genere, id).toBe('avventura');
  });

  it('ognuna ha la sua spedizione con soglia 10', () => {
    for (const id of avventure) {
      const aree = spedizioni.get(`avventura.${id}`) ?? [];
      expect(aree.map((a) => a.id), id).toContain(`avv-${id}`);
      expect(aree.find((a) => a.id === `avv-${id}`)!.spedizione!.soglia, id).toBe(10);
    }
  });

  it('ognuna dà un oggetto di grado 4 che qualche esito consegna', () => {
    const dati = new Set(c.storylet.flatMap((st) => st.opzioni.flatMap((o) => [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta]))
      .flatMap((e) => Object.keys(e?.effetti ?? {})));
    for (const id of avventure) {
      const quarti = c.oggetti.filter((o) => o.id.startsWith(`avv-${id}-`) && o.grado === 4);
      expect(quarti.length, id).toBeGreaterThanOrEqual(1);
      expect(quarti.some((o) => dati.has(`oggetto.${o.id}`)), id).toBe(true);
    }
  });
});
