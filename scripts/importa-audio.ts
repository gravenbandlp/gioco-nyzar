// Importa le tracce audio citate in contenuti/audio.yaml dalla cartella dei sorgenti (fuori dal repository,
// perché le licenze non permettono di ridistribuire i file sciolti) in public/audio/<tipo>/<id>.mp3.
//
// - musica: gli MP3 in loop si copiano così come sono (ricomprimerli peggiorerebbe il suono); un WAV si
//   comprime a 160 kbps.
// - ambienti: si comprimono a 128 kbps. Quelli più lunghi di LOOP_MAX secondi diventano loop più corti con la
//   dissolvenza già cotta nel file (la coda sfuma dentro l'inizio), così il gioco ne tiene in memoria meno.
//
// Ogni MP3 porta l'intestazione Info/LAME con ritardo e riempimento dell'encoder: il lettore la legge per far
// girare il loop senza scatti.
//
// Uso: npm run audio [-- /percorso/a/audio-nyzar]   (di default ../audio-nyzar accanto al repository)
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { caricaContenuti } from './build-contenuti';

const RADICE = new URL('..', import.meta.url).pathname;
const SORGENTE = process.argv[2] ?? join(RADICE, '..', 'audio-nyzar');
const DESTINAZIONE = join(RADICE, 'public', 'audio');
const CARTELLE = { musica: 'musica', ambiente: 'ambienti' } as const;
const LOOP_MAX = 150; // secondi
const DISSOLVENZA = 4; // secondi

function trova(tipo: keyof typeof CARTELLE, sorgente: string): string | null {
  const dir = join(SORGENTE, CARTELLE[tipo]);
  if (!existsSync(dir)) return null;
  const base = sorgente.replace(/\.(mp3|wav|ogg|flac)$/i, '').toLowerCase();
  const f = readdirSync(dir).find((x) => x.replace(/\.[^.]+$/, '').toLowerCase() === base && /\.(mp3|wav|ogg|flac)$/i.test(x));
  return f ? join(dir, f) : null;
}

function durata(file: string): number {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());
}

function ffmpeg(args: string[]): void {
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
}

const { contenuti } = caricaContenuti({ tavole: false });
let fatte = 0; let saltate = 0; const mancanti: string[] = [];
for (const t of contenuti.tracce) {
  const src = trova(t.tipo, t.sorgente);
  if (!src) { mancanti.push(`${t.id} (${t.sorgente})`); continue; }
  const dir = join(DESTINAZIONE, t.tipo);
  mkdirSync(dir, { recursive: true });
  const out = join(dir, `${t.id}.mp3`);
  if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) { saltate++; continue; }
  const mp3 = extname(src).toLowerCase() === '.mp3';
  if (t.tipo === 'musica') {
    if (mp3) copyFileSync(src, out);
    else ffmpeg(['-i', src, '-c:a', 'libmp3lame', '-b:a', '160k', out]);
  } else {
    const d = durata(src);
    if (d <= LOOP_MAX + DISSOLVENZA) {
      if (mp3) copyFileSync(src, out);
      else ffmpeg(['-i', src, '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', out]);
    } else {
      const T = LOOP_MAX; const X = DISSOLVENZA;
      const grafo = [
        '[0:a]asplit=3[a][b][c]',
        `[a]atrim=${T}:${T + X},asetpts=PTS-STARTPTS,afade=t=out:d=${X}:curve=qsin[coda]`,
        `[b]atrim=0:${X},asetpts=PTS-STARTPTS,afade=t=in:d=${X}:curve=qsin[testa]`,
        '[coda][testa]amix=inputs=2:normalize=0[giunta]',
        `[c]atrim=${X}:${T},asetpts=PTS-STARTPTS[corpo]`,
        '[giunta][corpo]concat=n=2:v=0:a=1[out]',
      ].join(';');
      ffmpeg(['-i', src, '-filter_complex', grafo, '-map', '[out]', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', out]);
    }
  }
  fatte++;
  console.log(`${t.tipo.padEnd(8)} ${t.id.padEnd(22)} ${(statSync(out).size / 1048576).toFixed(1)} MB`);
}
console.log(`\n${fatte} tracce importate, ${saltate} già aggiornate${mancanti.length ? `, ${mancanti.length} senza sorgente:\n  ${mancanti.join('\n  ')}` : '.'}`);
