import { caricaContenuti, controlliIncrociati } from '../scripts/build-contenuti';

describe('contenuti', () => {
  it('tutti i file YAML sono validi e coerenti', () => {
    const { errori } = caricaContenuti();
    expect(errori).toEqual([]);
  });
  it('il validatore trova i riferimenti rotti', () => {
    const { contenuti } = caricaContenuti();
    const c = structuredClone(contenuti);
    c.storylet[0]!.requisiti.push('qualita-inventata >= 1');
    c.storylet[0]!.opzioni[0]!.successo = { testo: 'x', effetti: { monete: 0.3 }, segue: 'nessuno' };
    c.origini[0]!.abilita['rissa'] = 1;
    const errori = controlliIncrociati(c, []);
    expect(errori.some((e) => e.includes('qualita-inventata'))).toBe(true);
    expect(errori.some((e) => e.includes('mezzi punti'))).toBe(true);
    expect(errori.some((e) => e.includes('"segue"'))).toBe(true);
    expect(errori.some((e) => e.includes('sommare 10'))).toBe(true);
  });
});
