// Il copione del doppiaggio in locale: serve doppiaggio/copione-pagina.html su http://localhost:5180 e tiene le spunte
// "Registrato" in doppiaggio/spunte.json, nel repository, così si sa sempre a che punto è il doppiaggio (anche da
// Claude Code). Uso: npm run copione:locale (rigenera il copione e apre la pagina).
import { createServer } from 'node:http';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const DIR = join(fileURLToPath(new URL('..', import.meta.url)), 'doppiaggio');
const PAGINA = join(DIR, 'copione-pagina.html');
const SPUNTE = join(DIR, 'spunte.json');
const PORTA = Number(process.env['PORTA_COPIONE'] ?? 5180);

const leggiSpunte = (): Record<string, number> => (existsSync(SPUNTE) ? JSON.parse(readFileSync(SPUNTE, 'utf8')) as Record<string, number> : {});

createServer((req, res) => {
  if (req.url === '/api/spunte' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(leggiSpunte()));
    return;
  }
  if (req.url === '/api/spunte' && req.method === 'PUT') {
    let corpo = '';
    req.on('data', (c: Buffer) => { corpo += c.toString(); });
    req.on('end', () => {
      try {
        const d = JSON.parse(corpo) as Record<string, number>;
        const ordinate = Object.fromEntries(Object.entries(d).filter(([, v]) => v).sort(([a], [b]) => a.localeCompare(b)));
        writeFileSync(SPUNTE, `${JSON.stringify(ordinate, null, 1)}\n`);
        res.writeHead(204).end();
      } catch {
        res.writeHead(400).end();
      }
    });
    return;
  }
  if (req.url === '/' || req.url?.startsWith('/?') || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(readFileSync(PAGINA));
    return;
  }
  res.writeHead(404).end();
}).listen(PORTA, '127.0.0.1', () => {
  const url = `http://localhost:${PORTA}/`;
  console.log(`Copione in locale: ${url} (spunte in doppiaggio/spunte.json). Ctrl+C per chiudere.`);
  const apri = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(apri, () => { /* se non si apre da solo, basta l'indirizzo */ });
});
