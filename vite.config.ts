import { defineConfig } from 'vitest/config';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { contenutiAPezzi } from './scripts/contenuti-a-pezzi';

// Versione mostrata nel piè di pagina: quella del package.json più il commit da cui è stato fatto il build.
const versione = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string;
let commit = '';
try { commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* fuori da git */ }

// Il build produce un index.html leggero e i file in dist/assets/ con l'hash nel nome.
// Contenuti (a pezzi, vedi scripts/contenuti-a-pezzi.ts) e icone stanno in file a parte:
// si scaricano in parallelo al codice e restano in cache finché non cambiano.
export default defineConfig({
  base: './', // percorsi relativi: le tavole si caricano anche fuori dalla radice del sito
  plugins: [contenutiAPezzi()],
  build: {
    target: 'es2022', // l'await al primo livello che aspetta i contenuti
    chunkSizeWarningLimit: 700, // le icone
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/generato/icone.json')) return 'icone';
        },
      },
    },
  },
  define: { __VERSIONE__: JSON.stringify(commit ? `${versione} (${commit})` : versione) },
  test: { globals: true, setupFiles: ['test/cedi.ts'] },
});
