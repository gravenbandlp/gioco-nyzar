// Importa dal Codex le tavole usate nei contenuti e le converte in WebP, in due tagli:
//   public/tavole/<collezione>/<slug>-s.webp   miniatura 360px (liste, carte, icone)
//   public/tavole/<collezione>/<slug>-l.webp   grande 1280px (intestazioni, fondali)
// I metadati (EXIF, testo PNG) vengono scartati.
//
// Uso: npm run tavole [-- /percorso/a/codex-nyzar/src/assets/tavole]
// Di default cerca il Codex accanto a questo repository (../codex-nyzar).
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { caricaContenuti, tavoleCitate } from './build-contenuti';

const RADICE = fileURLToPath(new URL('..', import.meta.url));
const SORGENTE = process.argv[2] ?? join(RADICE, '..', 'codex-nyzar', 'src', 'assets', 'tavole');
const DESTINAZIONE = join(RADICE, 'public', 'tavole');

export const TAGLI = { s: 360, l: 1280 } as const;

function trovaSorgente(tavola: string): string | null {
  const [collezione, slug] = tavola.split('/') as [string, string];
  const dir = join(SORGENTE, collezione);
  if (!existsSync(dir)) return null;
  const f = readdirSync(dir).find((x) => x.replace(/\.[^.]+$/, '') === slug);
  return f ? join(dir, f) : null;
}

async function main() {
  const { contenuti } = caricaContenuti({ tavole: false });
  const tavole = [...tavoleCitate(contenuti)].filter((t) => !t.startsWith('icone/')).sort(); // le icone sono SVG, non tavole
  if (!existsSync(SORGENTE)) {
    console.error(`Non trovo le tavole del Codex in ${SORGENTE}`);
    process.exit(1);
  }
  let fatte = 0, saltate = 0;
  const mancanti: string[] = [];
  for (const t of tavole) {
    const src = trovaSorgente(t);
    if (!src) { mancanti.push(t); continue; }
    const [collezione, slug] = t.split('/') as [string, string];
    mkdirSync(join(DESTINAZIONE, collezione), { recursive: true });
    for (const [taglio, larghezza] of Object.entries(TAGLI)) {
      const out = join(DESTINAZIONE, collezione, `${slug}-${taglio}.webp`);
      if (existsSync(out)) { saltate++; continue; }
      await sharp(src).resize({ width: larghezza, withoutEnlargement: true }).webp({ quality: taglio === 's' ? 72 : 70 }).toFile(out);
      fatte++;
    }
  }
  console.log(`Tavole citate: ${tavole.length}. File creati: ${fatte}, già presenti: ${saltate}.`);
  if (mancanti.length) {
    console.error(`Non trovate nel Codex:\n  ${mancanti.join('\n  ')}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) void main();
