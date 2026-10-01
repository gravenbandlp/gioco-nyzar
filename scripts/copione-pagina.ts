// Costruisce la pagina del copione (doppiaggio/pagina.html + copione.json + registrati.json) da pubblicare come
// artifact: doppiaggio/copione-pagina.html. Va rigenerata dopo npm run doppiaggio e npm run voci.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRONUNCE, type Pezzo } from './doppiaggio';

const DIR = join(new URL('..', import.meta.url).pathname, 'doppiaggio');
const pezzi = JSON.parse(readFileSync(join(DIR, 'copione.json'), 'utf8')) as Pezzo[];
const registrati = existsSync(join(DIR, 'registrati.json')) ? readFileSync(join(DIR, 'registrati.json'), 'utf8').trim() : '{}';
const dati = pezzi.map(({ id, gruppo, storylet, titolo, tipo, opzione, ramo, voce, caratteri, impronta }) => ({ id, gruppo, storylet, titolo, tipo, opzione, ramo, voce, caratteri, impronta }));
const oggi = new Date().toLocaleDateString('it-IT');
const html = readFileSync(join(DIR, 'pagina.html'), 'utf8')
  .replace('/*DATI*/[]', JSON.stringify(dati).replace(/<\//g, '<\\/'))
  .replace('/*REGISTRATI*/{}', registrati)
  .replace('/*PRONUNCE*/', Object.entries(PRONUNCE).sort(([a], [b]) => a.localeCompare(b, 'it'))
    .map(([k, v]) => `<li><span class="scritto">${k}</span> → <span class="detto">${v}</span></li>`).join(''))
  .replace('/*VERSIONE*/', `${pezzi.length} pezzi · ${oggi}`);
writeFileSync(join(DIR, 'copione-pagina.html'), html);
console.log(`doppiaggio/copione-pagina.html: ${pezzi.length} pezzi, ${(html.length / 1024).toFixed(0)} KB`);
