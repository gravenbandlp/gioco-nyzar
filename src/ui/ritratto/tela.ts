// Il ritratto sulla pagina: le viste scrivono un <canvas data-figura> con la figura in JSON, e dopo ogni render
// montaRitratti lo disegna ingrandito a pixel interi. Sopra il disegno, le luci (lanterne, cristalli, occhi della
// Marea) con un bagliore che trema; ogni tanto il personaggio sbatte le palpebre. Con il movimento ridotto, fermo.
import { h } from '../formato';
import { disegna, type Figura, type Ritratto, ALTEZZA, LARGHEZZA } from './motore';

interface Tela { f: Figura; r: Ritratto; fuori: HTMLCanvasElement; scala: number; palpebre: boolean; battito: number }
const tele = new Map<HTMLCanvasElement, Tela>();
const fermo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let ciclo = 0;

/** L'HTML di un ritratto. `scala` è l'ingrandimento massimo: sul telefono si stringe a quello che ci sta. */
export function canvasRitratto(f: Figura, opz: { scala: number; classe?: string; etichetta: string }): string {
  return `<canvas class="ritratto-pixel${opz.classe ? ` ${opz.classe}` : ''}" width="${LARGHEZZA}" height="${ALTEZZA}" data-figura="${h(JSON.stringify(f))}" data-scala="${opz.scala}" role="img" aria-label="${h(opz.etichetta)}"></canvas>`;
}

function rasterizza(t: Tela): void {
  t.r = disegna(t.f, { palpebre: t.palpebre });
  t.fuori.width = t.r.W; t.fuori.height = t.r.H;
  t.fuori.getContext('2d')!.putImageData(new ImageData(t.r.pixel, t.r.W, t.r.H), 0, 0);
}

function dipingi(el: HTMLCanvasElement, t: Tela, ora: number): void {
  const ctx = el.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, el.width, el.height);
  ctx.drawImage(t.fuori, 0, 0, el.width, el.height);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of t.r.luci) {
    let k = l.forza;
    if (!fermo()) k *= l.tipo === 'fiamma' ? 0.82 + 0.12 * Math.sin(ora / 97) + 0.08 * Math.sin(ora / 37 + 1.3) : 0.75 + 0.25 * Math.sin(ora / 900);
    const cx = l.x * t.scala, cy = l.y * t.scala, rr = l.r * t.scala * 1.4;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    const [a, b, c] = l.colore;
    g.addColorStop(0, `rgba(${a},${b},${c},${0.28 * k})`);
    g.addColorStop(1, `rgba(${a},${b},${c},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  ctx.restore();
}

/** Disegna i ritratti appena entrati nella pagina. */
export function montaRitratti(radice: ParentNode): void {
  for (const el of tele.keys()) if (!el.isConnected) tele.delete(el);
  radice.querySelectorAll<HTMLCanvasElement>('canvas[data-figura]').forEach((el) => {
    if (tele.has(el)) return;
    let f: Figura;
    try { f = JSON.parse(el.dataset['figura'] ?? '') as Figura; } catch { return; }
    const t: Tela = { f, r: disegna(f), fuori: document.createElement('canvas'), scala: 1, palpebre: false, battito: performance.now() + 2500 + Math.random() * 3000 };
    rasterizza(t);
    const massima = Number(el.dataset['scala'] ?? 4);
    // la colonna del ritratto si adatta al ritratto: lo spazio si misura sulla finestra
    const spazio = Math.max(LARGHEZZA * 2, window.innerWidth - 64);
    t.scala = Math.max(2, Math.min(massima, Math.floor(spazio / t.r.W)));
    el.width = t.r.W * t.scala; el.height = t.r.H * t.scala;
    el.style.width = `${el.width}px`; el.style.height = `${el.height}px`;
    tele.set(el, t);
    dipingi(el, t, performance.now());
  });
  if (!ciclo && tele.size && !fermo()) ciclo = requestAnimationFrame(passo);
}

function passo(ora: number): void {
  for (const [el, t] of tele) {
    if (!el.isConnected) { tele.delete(el); continue; }
    if (ora > t.battito) {
      t.palpebre = !t.palpebre;
      t.battito = ora + (t.palpebre ? 140 : 3500 + Math.random() * 4500);
      rasterizza(t);
    }
    dipingi(el, t, ora);
  }
  ciclo = tele.size ? requestAnimationFrame(passo) : 0;
}
