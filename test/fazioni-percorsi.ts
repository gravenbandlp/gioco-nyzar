// I percorsi a caso delle quest di fazione: ogni quest arriva al passo 15 con ogni origine, a storia principale finita.
import { it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { percorri } from './percorsi';

export const FAZIONI = ['velo', 'caserma', 'gilda', 'raschiatori', 'circolo', 'accademia', 'scuri', 'maison', 'consiglio', 'ghoran', 'tuarmir', 'laresh', 'pannion'];
// la storia principale finita: le quest di fazione hanno passi che aspettano la trama
const FINE_CAPITOLO = {
  'pista.dama-argento': 11, 'pista.sepolcro': 7, 'pista.corin': 6, 'pista.registro': 5, 'pista.tribu': 4,
  'pista.acciaio': 8, 'pista.capomozzo': 10, 'pista.pelle': 7, 'pista.arena': 5, 'pista.teatro': 2,
  invito: 1, raschiatore: 1, bende: 4, monete: 400,
};

// Un test per origine: un test unico che tiene occupato il processo per più di un minuto fa scadere le chiamate
// interne di vitest ("Timeout calling onTaskUpdate").
export function percorsiFazione(id: string): void {
  const extra: Record<string, number> = { ...FINE_CAPITOLO };
  if (id === 'scuri') extra['bivio.legge'] = 2;
  if (id === 'caserma') extra['bivio.legge'] = 1;
  for (const o of c.origini) {
    it(`la quest ${id} arriva al passo 15 con l'origine ${o.id}`, () => {
      for (let seme = 1; seme <= 4; seme++) expect(percorri(o.id, seme, `fazione.${id}`, 15, extra)).toBeGreaterThan(14);
    }, 60000);
  }
}
