// Controlla la regia del doppiaggio (doppiaggio/regia/*.yaml): ogni chiave è un pezzo del copione, e togliendo i tag
// deve restare parola per parola il testo della scena. Segnala id sconosciuti, testi cambiati (con il punto in cui
// divergono) e tag scritti male, e conta i tag usati.
//
// Uso: npm run regia [-- file.yaml]   (con un file controlla solo quello)
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse } from 'yaml';
import { copione, leggiRegia, senzaTag, RE_TAG } from './doppiaggio';

const RADICE = fileURLToPath(new URL('..', import.meta.url));

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const soloFile = process.argv[2];
  const pezzi = new Map(copione().map((p) => [p.id, p]));
  let regia = leggiRegia();
  if (soloFile) {
    const doc = parse(readFileSync(soloFile.includes('/') || soloFile.includes('\\') ? soloFile : join(RADICE, 'doppiaggio', 'regia', soloFile), 'utf8')) as { regia?: Record<string, string> };
    regia = new Map(Object.entries(doc?.regia ?? {}).map(([k, v]) => [k, String(v).trim()]));
  }
  const errori: string[] = [];
  const tag = new Map<string, number>();
  for (const [id, voce] of regia) {
    const p = pezzi.get(id);
    if (!p) { errori.push(`${id}: non è un pezzo del copione`); continue; }
    const a = senzaTag(voce); const b = senzaTag(p.base);
    if (a !== b) {
      let i = 0; while (i < a.length && a[i] === b[i]) i++;
      errori.push(`${id}: il testo non coincide dal carattere ${i}\n    regia: …${a.slice(Math.max(0, i - 40), i + 40).replace(/\n/g, '¶')}…\n    testo: …${b.slice(Math.max(0, i - 40), i + 40).replace(/\n/g, '¶')}…`);
    }
    for (const m of voce.matchAll(RE_TAG)) {
      const t = m[0].toLowerCase();
      tag.set(t, (tag.get(t) ?? 0) + 1);
      const prima = voce[m.index! - 1];
      if (prima && /[\p{L}\d]/u.test(prima)) errori.push(`${id}: tag ${m[0]} attaccato a una parola`);
      if (m[0] !== m[0].toLowerCase()) errori.push(`${id}: tag ${m[0]} con maiuscole`);
    }
    if ((voce.match(/\[/g) ?? []).length !== (voce.match(/\]/g) ?? []).length) errori.push(`${id}: parentesi quadre spaiate`);
  }
  const nome = soloFile ? basename(soloFile) : 'tutta la regia';
  console.log(`${nome}: ${regia.size} pezzi, ${[...tag.values()].reduce((x, y) => x + y, 0)} tag, ${errori.length} errori.`);
  if (errori.length) console.log(errori.join('\n'));
  console.log([...tag].sort((x, y) => y[1] - x[1]).slice(0, 60).map(([t, n]) => `${t} ${n}`).join(' · '));
  if (errori.length) process.exitCode = 1;
}
