import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Il build produce un solo file HTML autosufficiente (dist/index.html):
// comodo da provare ovunque e da pubblicare come pagina statica.
export default defineConfig({
  base: './', // percorsi relativi: le tavole si caricano anche fuori dalla radice del sito
  plugins: [viteSingleFile()],
  test: { globals: true },
});
