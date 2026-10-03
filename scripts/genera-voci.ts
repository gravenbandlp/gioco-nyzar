// Genera il doppiaggio con l'API di ElevenLabs (modello Eleven v4), dal copione di npm run doppiaggio: niente più testi
// da incollare a mano. Per ogni pezzo scelto manda il testo per la voce (la regia con le pronunce), salva l'mp3 in
// ../audio-nyzar/voci/<id>.mp3 (l'archivio, come per npm run voci) e in public/audio/voce/<id>.mp3, e annota l'impronta
// in doppiaggio/registrati.json e la spunta «Registrato» in doppiaggio/spunte.json.
// Salta i pezzi già registrati sul testo attuale; un mp3 superato che viene rifatto finisce prima in
// ../audio-nyzar/voci-superate/, così non si perde niente.
//
// La chiave sta in .env.local (ELEVENLABS_API_KEY, senza VITE_: non entra nel gioco).
//
// Uso: npm run genera-voci -- <filtro> [--prova] [--rifai] [--max=N]
//   <filtro>  il gruppo («prologhi», «dama-argento», …, «tutto») o l'id di un pezzo, o un suo inizio (es. «prologo-mezzosangue»)
//   --prova   non genera niente: dice quali pezzi farebbe e quanti caratteri costano
//   --rifai   rigenera anche i pezzi già registrati sul testo attuale
//   --max=N   al più N pezzi (per provare)
import { fileURLToPath } from 'node:url';
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { copione, STORIE, type Pezzo } from './doppiaggio';

const RADICE = fileURLToPath(new URL('..', import.meta.url));
const ARCHIVIO = join(RADICE, '..', 'audio-nyzar', 'voci');
const SUPERATE = join(RADICE, '..', 'audio-nyzar', 'voci-superate');
const GIOCO = join(RADICE, 'public', 'audio', 'voce');
const REGISTRO = join(RADICE, 'doppiaggio', 'registrati.json');
const SPUNTE = join(RADICE, 'doppiaggio', 'spunte.json');

const VOCE = 'rgL0xVDlz05Kid06YUgx';
const MODELLO = 'eleven_v4';
const FORMATO = 'mp3_44100_128';
const IN_PARALLELO = 2;

if (existsSync(join(RADICE, '.env.local'))) process.loadEnvFile(join(RADICE, '.env.local'));
const CHIAVE = process.env['ELEVENLABS_API_KEY'];

const arg = process.argv.slice(2);
const prova = arg.includes('--prova');
const rifai = arg.includes('--rifai');
const max = Number(arg.find((a) => a.startsWith('--max='))?.slice(6) ?? Infinity);
const filtro = arg.find((a) => !a.startsWith('--'));
if (!filtro) {
  console.log(`Uso: npm run genera-voci -- <filtro> [--prova] [--rifai] [--max=N]\nfiltri: prologhi, ${STORIE.map(([k]) => k).join(', ')}, tutto, o un id`);
  process.exit(1);
}
if (!prova && !CHIAVE) { console.error('Manca ELEVENLABS_API_KEY in .env.local.'); process.exit(1); }

const leggi = (f: string): Record<string, string | number> => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) as Record<string, string | number> : {});
const scrivi = (f: string, d: Record<string, string | number>) =>
  writeFileSync(f, `${JSON.stringify(Object.fromEntries(Object.entries(d).sort(([a], [b]) => a.localeCompare(b))), null, 1)}\n`);

const nomeGruppo = filtro === 'prologhi' ? 'I prologhi' : STORIE.find(([k]) => k === filtro)?.[1];
const tutti = copione();
const scelti = tutti.filter((p) => filtro === 'tutto' || (nomeGruppo ? p.gruppo === nomeGruppo : p.id === filtro || p.id.startsWith(filtro)));
const registrati = leggi(REGISTRO) as Record<string, string>;
const daFare = scelti
  .filter((p) => rifai || registrati[p.id] !== p.impronta || !existsSync(join(GIOCO, `${p.id}.mp3`)))
  .slice(0, max);

const caratteri = daFare.reduce((a, p) => a + p.voce.length, 0);
console.log(`${scelti.length} pezzi nel filtro «${filtro}», ${daFare.length} da generare, ${caratteri.toLocaleString('it-IT')} caratteri.`);
const senzaRegia = daFare.filter((p) => p.regia !== 'fatta');
if (senzaRegia.length) console.log(`Attenzione, senza regia aggiornata (vanno col testo semplice): ${senzaRegia.map((p) => p.id).join(', ')}`);
if (prova) { for (const p of daFare) console.log(`  ${p.id} (${p.voce.length})`); process.exit(0); }

async function genera(p: Pezzo): Promise<{ costo: number }> {
  for (let tentativo = 1; ; tentativo++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOCE}?output_format=${FORMATO}`, {
      method: 'POST',
      headers: { 'xi-api-key': CHIAVE!, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: p.voce, model_id: MODELLO, language_code: 'it' }),
    });
    if (r.ok) {
      const audio = Buffer.from(await r.arrayBuffer());
      const archivio = join(ARCHIVIO, `${p.id}.mp3`);
      if (existsSync(archivio)) renameSync(archivio, join(SUPERATE, `${p.id}.mp3`));
      writeFileSync(archivio, audio);
      copyFileSync(archivio, join(GIOCO, `${p.id}.mp3`));
      return { costo: Number(r.headers.get('x-character-count') ?? p.voce.length) };
    }
    const errore = await r.text();
    // troppe richieste insieme o server occupato: si aspetta e si riprova
    if ((r.status === 429 || r.status >= 500) && tentativo < 5) { await new Promise((ok) => setTimeout(ok, 4000 * tentativo)); continue; }
    throw new Error(`${r.status} ${errore.slice(0, 400)}`);
  }
}

mkdirSync(ARCHIVIO, { recursive: true }); mkdirSync(SUPERATE, { recursive: true }); mkdirSync(GIOCO, { recursive: true });
const spunte = leggi(SPUNTE) as Record<string, number>;
let fatti = 0; let costo = 0; const falliti: string[] = [];
const coda = [...daFare];
await Promise.all(Array.from({ length: IN_PARALLELO }, async () => {
  for (let p = coda.shift(); p; p = coda.shift()) {
    try {
      const esito = await genera(p);
      costo += esito.costo; fatti++;
      registrati[p.id] = p.impronta;
      // la spunta nuova sostituisce quelle date a versioni vecchie dello stesso pezzo
      for (const k of Object.keys(spunte)) if (k.startsWith(`${p.id}@`)) delete spunte[k];
      spunte[`${p.id}@${p.impronta}`] = 1;
      // si salva a ogni pezzo: se si interrompe, quello che è fatto resta segnato
      scrivi(REGISTRO, registrati); scrivi(SPUNTE, spunte);
      console.log(`  [${fatti}/${daFare.length}] ${p.id} (${esito.costo} caratteri)`);
    } catch (e) {
      falliti.push(p.id);
      console.error(`  ✗ ${p.id}: ${(e as Error).message}`);
      if (/quota|credits|unauthorized|401/i.test((e as Error).message)) coda.length = 0; // inutile insistere
    }
  }
}));
console.log(`${fatti} voci generate, ${costo.toLocaleString('it-IT')} caratteri consumati.${falliti.length ? `\nNon riuscite: ${falliti.join(', ')}` : ''}`);
