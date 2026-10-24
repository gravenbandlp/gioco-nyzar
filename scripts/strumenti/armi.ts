// Confronto delle armi di base: probabilità media di vittoria su un campione di scontri (uno ogni sei), per un
// combattente d'inizio e uno di metà gioco. Serve a fissare i prezzi di contenuti/equipaggiamento.yaml.
// Uso: npx tsx scripts/strumenti/armi.ts ['{"mazza":{"danno":1}}']   (variazioni da provare, in JSON)
//      MAGICHE=id1,id2 aggiunge le armi magiche indicate, con il combattente di metà gioco.
import { caricaContenuti } from '../build-contenuti';
import { nuovoPersonaggio } from '../../src/motore/personaggio';
import { combattenteDaStato, probabilitaVittoria } from '../../src/motore/combattimento';
const { contenuti: c } = caricaContenuti({ tavole: false });
const tabella = JSON.parse(process.argv[2] ?? '{}') as Record<string, { danno?: number; proprieta?: string[] }>;
for (const [id, v] of Object.entries(tabella)) Object.assign(c.armi.find((a) => a.id === id)!, v);
const campione = c.scontri.filter((_, i) => i % 6 === 0);
function pg(arma: string, fis: number, ab: number, armatura: string) {
  const s = nuovoPersonaggio('Prova', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, 'citta-bassa');
  s.attributi.fisico = fis; s.abilita['armi-da-mischia'] = ab; s.abilita['armi-da-distanza'] = ab; s.abilita['acrobazia'] = 1;
  s.arma = arma; s.armatura = armatura; s.quality[`oggetto.${arma}`] = 1; s.quality[`oggetto.${armatura}`] = 1; s.scudo = '';
  return combattenteDaStato(s, c);
}
const righe = [];
for (const a of c.armi.filter((x) => x.abilita !== 'rissa')) {
  const r: Record<string, string | number> = { arma: a.id, danno: a.danno, prop: a.proprieta.join(','), prezzo: a.prezzo ?? 0 };
  for (const [nome, f, ab, arm] of [['inizio', 2, 1, 'giaco-imbottito'], ['metà', 3, 3, 'cuoio-rinforzato']] as const) {
    const ps = campione.map((sc) => probabilitaVittoria(pg(a.id, f, ab, arm), sc, c, 300, 3));
    r[nome] = Math.round((ps.reduce((x, y) => x + y, 0) / ps.length) * 1000) / 10;
  }
  righe.push(r);
}
console.table(righe);
// armi magiche, profilo di metà
const magiche = [];
for (const o of c.oggetti.filter((x) => x.slot === 'arma' && x.grado > 0 && (process.env.MAGICHE ?? '').split(',').includes(x.id))) {
  const ps = campione.map((sc) => probabilitaVittoria(pg(o.id, 3, 3, 'cuoio-rinforzato'), sc, c, 300, 3));
  magiche.push({ id: o.id, base: o.base, grado: o.grado, metà: Math.round((ps.reduce((x, y) => x + y, 0) / ps.length) * 1000) / 10 });
}
console.table(magiche);
