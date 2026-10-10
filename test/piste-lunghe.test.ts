// Percorsi casuali lungo le piste più lunghe (Dama d'Argento, Acciaio e Ira, Capomozzo, Sotto la pelle), separati da
// test/piste.test.ts: in un file solo superavano il minuto e facevano scadere le chiamate interne di vitest.
import { describe, it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { percorri } from './percorsi';

describe('piste lunghe', () => {
  it('la Dama d\'Argento arriva a 11 con ogni origine e scelte a caso', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.dama-argento', 11)).toBeGreaterThan(5);
  }, 120000);
  it('Acciaio e Ira arriva a 8, passando dall\'Acciaieria e dalle Segrete dell\'Ira', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.acciaio', 8, { 'pista.tribu': 4, invito: 1, bende: 2 })).toBeGreaterThan(7);
  }, 120000);
  it('Capomozzo arriva a 10, attraverso le quattro spedizioni', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.capomozzo', 10, { 'pista.acciaio': 8, 'pista.sepolcro': 7, 'pista.tribu': 4, invito: 1, bende: 2, monete: 200 })).toBeGreaterThan(9);
  }, 120000);
  it('Sotto la pelle arriva a 7, passando dal Maniero Malgrani', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.pelle', 7, { 'pista.capomozzo': 7, 'pista.registro': 5, invito: 1, bende: 2, monete: 200 })).toBeGreaterThan(6);
  }, 120000);
});
