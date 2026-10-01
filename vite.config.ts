import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Versione mostrata nel piè di pagina: quella del package.json più il commit da cui è stato fatto il build.
const versione = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string;
let commit = '';
try { commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* fuori da git */ }

// Il build produce un solo file HTML autosufficiente (dist/index.html):
// comodo da provare ovunque e da pubblicare come pagina statica.
export default defineConfig({
  base: './', // percorsi relativi: le tavole si caricano anche fuori dalla radice del sito
  plugins: [viteSingleFile()],
  define: { __VERSIONE__: JSON.stringify(commit ? `${versione} (${commit})` : versione) },
  test: { globals: true },
});
