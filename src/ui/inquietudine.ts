// La venatura horror a schermo e nelle cuffie (regole in motore/inquietudine.ts). Tutto è generato qui: due veli
// fissi sopra la pagina (la vignetta del Tormento e le venature della Marea), la parola che cambia per un istante,
// il battito delle Ferite, la campana stonata, i rumori di lato. Chi chiede meno movimento al sistema non vede
// animazioni né parole che cambiano.
import { inquietudineDi, type Inquietudine } from '../motore/inquietudine';
import type { Stato } from '../motore/personaggio';
import type { Lettore } from './audio';

const calma = matchMedia('(prefers-reduced-motion: reduce)');
const NIENTE: Inquietudine = { tormento: 0, contaminazione: 0, ferite: 0 };

let ora: Inquietudine = NIENTE;
let inSpedizione = false;
let lettore: Lettore | null = null;

/** Le parole che si affacciano al posto di un'altra, per un istante. */
const PAROLE = ['sotto', 'dentro', 'ascolta', 'girati', 'vicino', 'respira', 'resta', 'ancora', 'qui', 'tardi', 'ricordi', 'scendi', 'tuo'];

function veli(): void {
  if (document.getElementById('vignetta')) return;
  for (const id of ['vignetta', 'venature']) {
    const d = document.createElement('div');
    d.id = id;
    d.setAttribute('aria-hidden', 'true');
    document.body.appendChild(d);
  }
}

/** A ogni render: quanto sta male il personaggio e dove si trova. */
export function aggiornaInquietudine(s: Stato | null, spedizione: boolean): void {
  veli();
  ora = s ? inquietudineDi(s) : NIENTE;
  inSpedizione = !!s && spedizione;
  const r = document.documentElement;
  r.style.setProperty('--tormento', ora.tormento.toFixed(2));
  r.style.setProperty('--contaminazione', ora.contaminazione.toFixed(2));
  r.classList.toggle('tormentato', ora.tormento > 0);
  r.classList.toggle('contaminato', ora.contaminazione > 0);
}

// ---------------------------------------------------------------- la parola che cambia

function parolaCheCambia(): void {
  if (calma.matches || document.hidden || ora.tormento <= 0) return;
  const paragrafi = [...document.querySelectorAll<HTMLElement>('#app .prosa p:not(.abilita-voce)')];
  const nodi: Text[] = [];
  for (const p of paragrafi) {
    const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) if (/\p{L}{5,}/u.test(n.textContent ?? '')) nodi.push(n as Text);
  }
  const nodo = nodi[Math.floor(Math.random() * nodi.length)];
  if (!nodo) return;
  const testo = nodo.textContent!;
  const parole = [...testo.matchAll(/\p{L}{5,}/gu)];
  const m = parole[Math.floor(Math.random() * parole.length)]!;
  let nuova = PAROLE[Math.floor(Math.random() * PAROLE.length)]!;
  if (/^\p{Lu}/u.test(m[0])) nuova = nuova[0]!.toUpperCase() + nuova.slice(1);
  const storto = testo.slice(0, m.index) + nuova + testo.slice(m.index! + m[0].length);
  nodo.textContent = storto;
  setTimeout(() => { if (nodo.isConnected && nodo.textContent === storto) nodo.textContent = testo; }, 160 + Math.random() * 200);
}

// ---------------------------------------------------------------- suoni

function battito(): number {
  if (ora.ferite <= 0) return 2000;
  lettore?.effetto('battito');
  return 60000 / (54 + 62 * ora.ferite); // da circa 60 a 116 battiti al minuto
}

function campana(): void {
  if (ora.tormento <= 0) return;
  lettore?.effetto('campana-stonata', Math.random() * 1.2 - 0.6);
}

function rumoreDiLato(): void {
  if (!inSpedizione && ora.tormento <= 0) return;
  if (Math.random() < 0.5) return;
  lettore?.effetto(Math.random() < 0.5 ? 'graffio' : 'passo', Math.random() < 0.5 ? -0.95 : 0.95);
}

/** Un ciclo che si richiama da solo dopo un'attesa casuale. */
function ciclo(f: () => number | void, da: number, a: number): void {
  const passo = () => {
    const prossimo = f();
    setTimeout(passo, typeof prossimo === 'number' ? prossimo : da + Math.random() * (a - da));
  };
  setTimeout(passo, da + Math.random() * (a - da));
}

/** Una volta sola, all'avvio del gioco. */
export function avviaInquietudine(l: Lettore): void {
  lettore = l;
  veli();
  ciclo(parolaCheCambia, 25_000, 70_000);
  ciclo(battito, 2000, 2000);
  ciclo(campana, 150_000, 360_000);
  ciclo(rumoreDiLato, 240_000, 540_000);
}
