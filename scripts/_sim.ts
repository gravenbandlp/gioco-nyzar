import { caricaContenuti } from '/home/claude/gioco-nyzar/scripts/build-contenuti';
import { nuovoPersonaggio } from '/home/claude/gioco-nyzar/src/motore/personaggio';
import { combattenteDaStato, probabilitaVittoria } from '/home/claude/gioco-nyzar/src/motore/combattimento';
import { repertorio } from '/home/claude/gioco-nyzar/src/motore/magia';
const { contenuti: c } = caricaContenuti({ tavole: false });
const [livello, ...scontri] = process.argv.slice(2);
const n = Number(livello);
for (const o of c.origini) {
  const s = nuovoPersonaggio('P', o, 0, 'citta-bassa');
  s.attributi.fisico = Math.min(4, s.attributi.fisico + 1);
  for (const k of ['rissa', 'armi-da-mischia', 'armi-da-distanza', 'resistenza', 'magia']) if ((s.abilita[k] ?? 0) > 0) s.abilita[k] = Math.min(5, s.abilita[k]! + n);
  const pg = combattenteDaStato(s, c); const rep = repertorio(s, c);
  console.log(o.id.padEnd(30), scontri.map((id) => `${id} ${Math.round(probabilitaVittoria(pg, c.scontri.find((x) => x.id === id)!, c, 2000, 7, rep) * 100)}%`).join('  '));
}
