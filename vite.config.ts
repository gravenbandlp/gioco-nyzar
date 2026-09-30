import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Il build produce un solo file HTML autosufficiente (dist/index.html):
// comodo da provare ovunque e da pubblicare come pagina statica.
export default defineConfig({
  plugins: [viteSingleFile()],
  test: { globals: true },
});
