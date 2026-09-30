// Tabella di bilanciamento: probabilità di vittoria di ogni origine (a inizio gioco)
// contro ogni scontro, con l'etichetta che vedrà il giocatore. Uso: npm run simula
import { caricaContenuti } from './build-contenuti';
import { nuovoPersonaggio } from '../src/motore/personaggio';
import { combattenteDaStato, probabilitaVittoria, etichettaCombattimento } from '../src/motore/combattimento';
import { repertorio } from '../src/motore/magia';

const { contenuti: c, errori } = caricaContenuti();
if (errori.length) { console.error(errori.join('\n')); process.exit(1); }

const righe: Record<string, string>[] = [];
for (const o of c.origini) {
  const stato = nuovoPersonaggio('Prova', o, 0, 'citta-bassa');
  const pg = combattenteDaStato(stato, c);
  const rep = repertorio(stato, c);
  const riga: Record<string, string> = { origine: o.nome, 'att/dif/PF': `${pg.attacco}/${pg.difesa}/${pg.pfMax}`, magia: rep.map((i) => i.nome).join(', ') || '—' };
  for (const sc of c.scontri) {
    const p = probabilitaVittoria(pg, sc, c, 4000, 7, rep);
    riga[sc.id] = `${Math.round(p * 100)}% ${etichettaCombattimento(p)}`;
  }
  righe.push(riga);
}
console.table(righe);
