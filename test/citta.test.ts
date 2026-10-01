// La città viva: la catena di storie di ogni luogo si chiude con ogni origine, giocando a caso.
import { describe, it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { frequenta } from './percorsi';

describe('città viva', () => {
  it('all\'Accademia di Torvessa si arriva alla cattedra', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 10; seme++) expect(frequenta(o.id, seme, 'accademia-di-torvessa', 'accademia.cattedra', { invito: 1, 'pista.capomozzo': 10 })).toBeGreaterThan(3);
  }, 30000);
  it('le catene dei luoghi si chiudono con ogni origine', () => {
    const fine = { 'pista.capomozzo': 10, 'pista.acciaio': 8, 'pista.pelle': 7, 'liaren.salvata': 1, 'conosci.liaren': 1, invito: 1 };
    const luoghi: [string | string[], string][] = [['cattedrale-del-velo', 'cattedrale.voto'], ['mercato-dei-nodi', 'nodo.socio'], ['grifone-di-ferro', 'grifone.chiave'], [['fucina-dei-due-mastini', 'armeria-di-irsa'], 'botteghe.capolavoro'], ['guarnigione-di-qir-azel', 'guarnigione.distintivo'], ['municipio', 'municipio.incarico'], ['biblioteca-di-qir-azel', 'biblioteca.tessera'], ['teatro-delle-meraviglie', 'teatro.primattore'], ['via-dei-rasoi', 'maison.ospite'], ['cimitero-di-qir-azel', 'cimitero.custode'], [['ponte-delle-mille-corde', 'ponte-dei-morti'], 'ponti.passo'], ['macerie-della-pignatta', 'macerie.insegna']];
    for (const [l, q] of luoghi) for (const o of c.origini) for (let seme = 1; seme <= 6; seme++) expect(frequenta(o.id, seme, l, q, fine)).toBeGreaterThan(2);
  }, 120000);
});
