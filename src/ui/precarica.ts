// Precaricamento delle tavole. Ogni render ricostruisce la pagina, e senza una copia già scaricata e
// decodificata in memoria le immagini comparirebbero con un attimo di ritardo. Qui le scarichiamo e le
// decodifichiamo in anticipo: tutte le miniature subito, le tavole grandi della zona in cui si trova il
// giocatore (e degli esiti che può ottenere) appena serve.
import type { TContenuti, TStorylet } from '../motore/contenuto';
import { storyletDisponibili, type Stato } from '../motore/personaggio';
import { srcTavola } from './componenti';

const tenute = new Map<string, HTMLImageElement>(); // i riferimenti tengono le immagini decodificate in memoria

function carica(url: string): void {
  if (tenute.has(url) || url.startsWith('tavole/icone/')) return; // le icone sono SVG in linea
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  tenute.set(url, img);
  img.decode?.().catch(() => { /* tavola mancante: resta il segnaposto */ });
}

function tavoleDi(st: TStorylet): string[] {
  const out = st.immagine ? [st.immagine] : [];
  for (const o of st.opzioni) {
    if (o.immagine) out.push(o.immagine);
    for (const e of [o.successo, o.fallimento, o.vittoria, o.sconfitta, o.esito]) if (e?.immagine) out.push(e.immagine);
  }
  return out;
}

/** Tutte le miniature del gioco: sono piccole (circa 1,3 MB in tutto) e compaiono ovunque. */
export function precaricaMiniature(c: TContenuti): void {
  const tutte = new Set<string>();
  const raccogli = (x: unknown): void => {
    if (Array.isArray(x)) x.forEach(raccogli);
    else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) {
      if (k === 'immagine' && typeof v === 'string') tutte.add(v);
      else raccogli(v);
    }
  };
  raccogli(c);
  const coda = [...tutte];
  // a piccoli gruppi, per non intasare la rete mentre il giocatore legge la prima scena
  const passo = () => {
    for (const t of coda.splice(0, 12)) carica(srcTavola(t, 's'));
    if (coda.length) setTimeout(passo, 150);
  };
  passo();
}

/** Le tavole grandi che possono servire dalla schermata attuale in poi. */
export function precaricaIntorno(s: Stato, c: TContenuti): void {
  const area = c.aree.find((a) => a.id === s.area);
  const grandi = new Set<string>();
  if (area?.immagine) grandi.add(area.immagine);
  const vicini = [...storyletDisponibili(s, c), ...s.mano.map((id) => c.storylet.find((z) => z.id === id)).filter((x): x is TStorylet => !!x)];
  if (s.sospeso) { const st = c.storylet.find((z) => z.id === s.sospeso); if (st) vicini.push(st); }
  for (const st of vicini) for (const t of tavoleDi(st)) grandi.add(t);
  for (const t of grandi) { carica(srcTavola(t, 'l')); carica(srcTavola(t, 's')); }
  for (const a of c.aree) if (a.immagine) carica(srcTavola(a.immagine, 'l')); // le copertine della mappa
  for (const l of c.luoghi) if (l.area === s.area && l.immagine) carica(srcTavola(l.immagine, 'l')); // le pagine dei luoghi
}
