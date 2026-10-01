// Percorsi casuali lungo le piste: nessuna combinazione di scelte deve lasciare il giocatore bloccato.
import { describe, it, expect } from 'vitest';
import { nuovoPersonaggio, storyletDisponibili } from '../src/motore/personaggio';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { percorri, scendi } from './percorsi';
describe('piste', () => {
  it('la Dama d\'Argento arriva a 11 con ogni origine e scelte a caso', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.dama-argento', 11)).toBeGreaterThan(5);
  }, 30000);
  it('il Sepolcro violato arriva a 7, passando dalla Roccia di Wren', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.sepolcro', 7)).toBeGreaterThan(6);
  });
  it('la caccia di Corin arriva a 6, passando dalla Foresta Strisciante', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.corin', 6)).toBeGreaterThan(5);
  });
  it('la Promessa dell\'Arpia arriva alla prima', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.teatro', 2)).toBeGreaterThan(1);
  });
  it('il registro del custode arriva a 5', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.registro', 5, { 'indizio.custode-notturno': 1 })).toBeGreaterThan(4);
  });
  it('le cinque tribù arrivano a 4, passando dalla Palude Acquanera', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.tribu', 4, { 'pista.dama-argento': 11, 'pista.sepolcro': 7, invito: 1 })).toBeGreaterThan(3);
  });
  it('Acciaio e Ira arriva a 8, passando dall\'Acciaieria e dalle Segrete dell\'Ira', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.acciaio', 8, { 'pista.tribu': 4, invito: 1, bende: 2 })).toBeGreaterThan(7);
  }, 30000);
  it('Capomozzo arriva a 10, attraverso le quattro spedizioni', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.capomozzo', 10, { 'pista.acciaio': 8, 'pista.sepolcro': 7, 'pista.tribu': 4, invito: 1, bende: 2, monete: 200 })).toBeGreaterThan(9);
  }, 30000);
  it('l\'Arena arriva a 5, dalla Mischia alla finale', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.arena', 5, { 'pista.capomozzo': 6, invito: 1, bende: 2, monete: 200 })).toBeGreaterThan(4);
  }, 30000);
  it('Sotto la pelle arriva a 7, passando dal Maniero Malgrani', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.pelle', 7, { 'pista.capomozzo': 6, 'pista.registro': 5, invito: 1, bende: 2, monete: 200 })).toBeGreaterThan(6);
  }, 30000);
  it('le tre rovine dei Raschiatori si possono raggiungere fino in fondo', () => {
    const siti: [string, string][] = [['turno-a-vhar-ul', 'rovine.vhar-ul'], ['turno-al-laboratorio', 'rovine.calibrazione'], ['turno-a-mahr-kel', 'rovine.mahr-kel']];
    for (const [ingresso, fondo] of siti) for (const o of c.origini) for (let seme = 1; seme <= 15; seme++) expect(scendi(o.id, seme, ingresso, fondo)).toBeGreaterThan(2);
  }, 30000);
  it('storyletDisponibili non si rompe a pista chiusa', () => {
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');
    s.quality['pista.dama-argento'] = 11;
    expect(() => storyletDisponibili(s, c)).not.toThrow();
  });
});
