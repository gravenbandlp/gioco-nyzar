// Probabilità di vittoria a fine gioco: due combattenti di riferimento contro gli scontri scelti.
// - fine capitolo: il combattente della taratura dell'8 ottobre 2026 (Fisico 3, Armi da mischia 3, lo Spadone di
//   Uzgreth, cuoio rinforzato), su cui stanno le quest di fazione;
// - fine contenuti: chi ha finito una quest di fazione e i villaggi (Fisico 4, Armi da mischia 4, Spadone di Uzgreth,
//   cotta di maglia), su cui stanno la Campana Sepolta e i boss dell'ultimo atto dei villaggi.
// Uso: npx tsx scripts/simula-fine.ts [prefisso dello scontro ...]   (senza argomenti: tutti gli scontri)
import { caricaContenuti } from './build-contenuti';
import { nuovoPersonaggio, type Stato } from '../src/motore/personaggio';
import { combattenteDaStato, probabilitaVittoria, etichettaCombattimento } from '../src/motore/combattimento';

const { contenuti: c, errori } = caricaContenuti({ tavole: false });
if (errori.length) { console.error(errori.join('\n')); process.exit(1); }

function profilo(fisico: number, abilita: number, arma: string, armatura: string): Stato {
  const s = nuovoPersonaggio('Prova', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, 'citta-bassa');
  s.attributi.fisico = fisico;
  s.attributi.mentale = 2;
  for (const a of ['acrobazia', 'resistenza', 'atletica', 'percezione', 'resilienza']) s.abilita[a] = Math.max(s.abilita[a] ?? 0, abilita - 3);
  s.abilita['armi-da-mischia'] = abilita;
  s.arma = arma;
  s.armatura = armatura;
  s.quality[`oggetto.${arma}`] = 1;
  s.quality[`oggetto.${armatura}`] = 1;
  return s;
}

const profili = {
  'fine capitolo': profilo(3, 3, 'spadone-di-uzgreth', 'cuoio-rinforzato'),
  'fine contenuti': profilo(4, 4, 'spadone-di-uzgreth', 'cotta-di-maglia'),
};

const prefissi = process.argv.slice(2);
const scontri = c.scontri.filter((sc) => !prefissi.length || prefissi.some((p) => sc.id.startsWith(p)));
const righe: Record<string, string>[] = [];
for (const sc of scontri) {
  const riga: Record<string, string> = { scontro: sc.id };
  for (const [nome, s] of Object.entries(profili)) {
    const p = probabilitaVittoria(combattenteDaStato(s, c), sc, c, 4000, 7);
    riga[nome] = `${Math.round(p * 100)}% ${etichettaCombattimento(p)}`;
  }
  righe.push(riga);
}
console.table(righe);
