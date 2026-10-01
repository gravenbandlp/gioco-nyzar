// Importa il doppiaggio. I file stanno in ../audio-nyzar/voci, ciascuno chiamato con l'id del suo pezzo nel copione
// (npm run doppiaggio); un prefisso esadecimale aggiunto dal caricamento (es. "edf885c2-") si toglie da solo.
// Copia i file in public/audio/voce/<id>.mp3 e annota in doppiaggio/registrati.json l'impronta del testo registrato:
// se poi il testo cambia, npm run doppiaggio lo segnala.
//
// Uso: npm run voci [-- /percorso/a/cartella-voci]
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { copione } from './doppiaggio';

const RADICE = new URL('..', import.meta.url).pathname;
const SORGENTE = process.argv[2] ?? join(RADICE, '..', 'audio-nyzar', 'voci');
const DESTINAZIONE = join(RADICE, 'public', 'audio', 'voce');
const REGISTRO = join(RADICE, 'doppiaggio', 'registrati.json');

const pezzi = new Map(copione().map((p) => [p.id, p]));
const registrati: Record<string, string> = existsSync(REGISTRO) ? JSON.parse(readFileSync(REGISTRO, 'utf8')) as Record<string, string> : {};
mkdirSync(DESTINAZIONE, { recursive: true });
const sconosciuti: string[] = []; let fatti = 0;
for (const f of existsSync(SORGENTE) ? readdirSync(SORGENTE).sort() : []) {
  if (!/\.mp3$/i.test(f)) continue;
  const id = f.replace(/\.mp3$/i, '').replace(/^[0-9a-f]{8}-/, '');
  const p = pezzi.get(id);
  if (!p) { sconosciuti.push(f); continue; }
  copyFileSync(join(SORGENTE, f), join(DESTINAZIONE, `${id}.mp3`));
  registrati[id] = p.impronta;
  fatti++;
}
const ordinati = Object.fromEntries(Object.entries(registrati).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(REGISTRO, `${JSON.stringify(ordinati, null, 1)}\n`);
console.log(`${fatti} voci importate, ${Object.keys(ordinati).length} registrate in tutto su ${pezzi.size} pezzi.`);
if (sconosciuti.length) console.log(`Nomi che non corrispondono a nessun id del copione:\n  ${sconosciuti.join('\n  ')}`);
