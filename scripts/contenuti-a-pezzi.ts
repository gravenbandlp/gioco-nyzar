// Plugin di Vite: nel build i contenuti non entrano nel codice ma diventano file JSON a parte,
// da circa 1 MB l'uno, che src/dati/scarica.ts scarica in parallelo. In sviluppo, nei test e
// negli script src/dati/contenuti.ts importa il JSON intero come sempre.
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

const FETTA = 1_000_000; // byte di storylet per pezzo, prima della compressione

export function contenutiAPezzi(): Plugin {
  return {
    name: 'contenuti-a-pezzi',
    apply: 'build',
    load(id) {
      if (!id.replace(/\\/g, '/').endsWith('/src/dati/contenuti.ts')) return null;
      const json = new URL('../src/generato/contenuti.json', import.meta.url);
      const { storylet, ...base } = JSON.parse(readFileSync(json, 'utf8')) as { storylet: unknown[] };
      const pezzi: string[] = [JSON.stringify(base)];
      let fetta: unknown[] = [];
      let byte = 0;
      for (const s of storylet) {
        fetta.push(s);
        byte += JSON.stringify(s).length;
        if (byte >= FETTA) { pezzi.push(JSON.stringify({ storylet: fetta })); fetta = []; byte = 0; }
      }
      if (fetta.length) pezzi.push(JSON.stringify({ storylet: fetta }));
      const url = pezzi.map((source, i) => {
        const ref = this.emitFile({ type: 'asset', name: `contenuti-${i}.json`, source });
        return `import.meta.ROLLUP_FILE_URL_${ref}`;
      });
      return `import { scaricaContenuti } from './scarica';\nexport const CONTENUTI = await scaricaContenuti([${url.join(', ')}]);\n`;
    },
  };
}
