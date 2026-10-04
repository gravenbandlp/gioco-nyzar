// La soglia: la home del gioco, sopra tutto il resto, alla maniera del vestibolo del Codex (tavola a tutto schermo
// che si avvicina piano, titolo monumentale al centro). Il clic per entrare è il gesto che i browser chiedono prima di
// lasciar suonare l'audio, così musica e ambiente partono già qui; poi una barra di caricamento accompagna l'ingresso.
// Sul sito con l'accesso Google è anche la porta: senza account si vede solo «Entra con Google».
import { ROMBO } from './componenti';
import type { Lettore } from './audio';

/** attesa: si sta controllando l'account; accedi: serve il login; entra: si gioca. */
export type ModoSoglia = 'attesa' | 'accedi' | 'entra';

export interface Soglia {
  mostra(modo: ModoSoglia, messaggio?: string): void;
}

interface Opzioni {
  modo: ModoSoglia;
  accedi?: () => void;
  /** Cosa dice la barra di caricamento: dipende da cosa c'è dietro (un personaggio da riprendere o da creare). */
  caricamento?: () => string;
}

const SFONDO = 'tavole/soglia/superficie-fratturata';
const DURATA_CARICAMENTO = 2400;

const esc = (t: string) => t.replace(/[&<>"]/g, (x) => `&#${x.charCodeAt(0)};`);
const fermo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function montaIngresso(l: Lettore, opzioni: Opzioni): Soglia {
  const soglia = document.createElement('div');
  soglia.className = 'soglia';
  soglia.setAttribute('role', 'dialog');
  soglia.setAttribute('aria-modal', 'true');
  soglia.setAttribute('aria-labelledby', 'soglia-titolo');
  soglia.innerHTML = `
    <div class="soglia-fondale" aria-hidden="true">
      <picture>
        <source type="image/webp" srcset="${SFONDO}-1280.webp 1280w, ${SFONDO}-1920.webp 1920w, ${SFONDO}-2464.webp 2464w" sizes="100vw">
        <img class="soglia-sfondo" src="${SFONDO}-1920.webp" alt="" width="2464" height="1856" fetchpriority="high" decoding="async">
      </picture>
      <i class="soglia-velo alto"></i><i class="soglia-velo basso"></i><i class="soglia-vignetta"></i>
    </div>
    <div class="soglia-centro">
      <div class="soglia-occhiello rivela"><span class="trattino"></span>${ROMBO}<span>Capitolo I · Qir-Azel</span>${ROMBO}<span class="trattino"></span></div>
      <h1 id="soglia-titolo" class="soglia-titolo rivela"><span>Ludus</span> <em>Ny'Zar</em></h1>
      <p class="soglia-sottotitolo rivela">Cronache della Superficie Fratturata</p>
      <div class="soglia-porta rivela" data-porta></div>
      <div class="soglia-carico" data-carico hidden>
        <p class="soglia-carico-testo" data-carico-testo></p>
        <div class="soglia-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Caricamento"><i data-barra></i></div>
        <p class="soglia-carico-cifra" data-cifra>0</p>
      </div>
    </div>
    <p class="soglia-firma rivela"><span class="trattino"></span><span>Tavola · La Superficie Fratturata · 150 D.C.</span><span class="trattino"></span></p>`;
  document.documentElement.classList.add('con-soglia');
  document.body.append(soglia);
  const porta = soglia.querySelector<HTMLElement>('[data-porta]')!;

  const azioni = (modo: ModoSoglia): string => {
    if (modo === 'attesa') return `<button type="button" class="bottone primario soglia-entra" disabled>Un momento…</button>`;
    if (modo === 'accedi') return `<button type="button" class="bottone primario soglia-entra" data-soglia="accedi">Entra con Google</button>`;
    return `<button type="button" class="bottone primario soglia-entra" data-soglia="entra">Entra a Qir-Azel</button>
      <button type="button" class="soglia-muto" data-soglia="muto">Entra senza audio</button>`;
  };
  const nota = (modo: ModoSoglia): string => modo === 'entra'
    ? 'Musica e ambienti: meglio con le cuffie.'
    : `Si gioca con un account Google: lì si salva il personaggio, e lo ritrovi da qualunque dispositivo.
       <a href="https://gioco-nyzar.pages.dev/privacy" target="_blank" rel="noopener">Privacy</a>`;

  const mostra = (modo: ModoSoglia, messaggio?: string) => {
    if (!soglia.isConnected) {
      // la soglia torna (per esempio uscendo dall'account): si rimonta da capo, con le sue animazioni
      soglia.classList.remove('via', 'in-carico');
      soglia.querySelector<HTMLElement>('[data-carico]')!.hidden = true;
      document.documentElement.classList.add('con-soglia');
      document.body.append(soglia);
    }
    porta.innerHTML = `
      ${messaggio ? `<p class="soglia-messaggio" role="status">${esc(messaggio)}</p>` : ''}
      <div class="soglia-azioni">${azioni(modo)}</div>
      <small class="soglia-nota">${nota(modo)}</small>`;
    porta.querySelector<HTMLButtonElement>('[data-soglia]')?.focus({ preventScroll: true });
  };

  /** La barra si riempie a scatti, come un vero caricamento, poi la soglia sfuma e resta il gioco. */
  const carica = () => {
    const testo = soglia.querySelector<HTMLElement>('[data-carico-testo]')!;
    const barra = soglia.querySelector<HTMLElement>('[data-barra]')!;
    const cifra = soglia.querySelector<HTMLElement>('[data-cifra]')!;
    const pb = soglia.querySelector<HTMLElement>('[role=progressbar]')!;
    testo.textContent = opzioni.caricamento?.() ?? 'Scendi a Qir-Azel…';
    soglia.querySelector<HTMLElement>('[data-carico]')!.hidden = false;
    soglia.classList.add('in-carico');
    const durata = fermo() ? 600 : DURATA_CARICAMENTO;
    // tappe con pause irregolari: corre all'inizio, esita a metà, chiude in fretta
    const tappe = [0, 0.18, 0.34, 0.41, 0.58, 0.63, 0.81, 0.9, 1];
    const t0 = performance.now();
    let finito = false;
    const fine = () => { if (finito) return; finito = true; barra.style.width = '100%'; cifra.textContent = '100'; setTimeout(chiudi, 180); };
    // requestAnimationFrame si ferma con la scheda in secondo piano: la soglia si chiude comunque
    setTimeout(fine, durata + 400);
    const passo = (ora: number) => {
      if (finito) return;
      const t = Math.min(1, (ora - t0) / durata);
      const i = Math.min(tappe.length - 2, Math.floor(t * (tappe.length - 1)));
      const locale = t * (tappe.length - 1) - i;
      const q = tappe[i]! + (tappe[i + 1]! - tappe[i]!) * (1 - (1 - locale) ** 3);
      const pct = Math.round(q * 100);
      barra.style.width = `${q * 100}%`;
      cifra.textContent = String(pct).padStart(2, '0');
      pb.setAttribute('aria-valuenow', String(pct));
      if (t < 1) requestAnimationFrame(passo);
      else fine();
    };
    requestAnimationFrame(passo);
  };

  const chiudi = () => {
    document.documentElement.classList.remove('con-soglia');
    soglia.classList.add('via');
    const togli = () => { if (soglia.classList.contains('via')) soglia.remove(); };
    soglia.addEventListener('transitionend', togli, { once: true });
    setTimeout(togli, 1000); // se la transizione non parte (movimento ridotto)
    window.scrollTo({ top: 0 });
  };

  const entra = (muto: boolean) => {
    if (soglia.classList.contains('in-carico')) return;
    if (muto) l.silenzia(true);
    else if (l.prefs.muto) l.silenzia(false);
    else l.avvia();
    carica();
  };

  soglia.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-soglia]');
    if (b?.dataset['soglia'] === 'entra') entra(false);
    else if (b?.dataset['soglia'] === 'muto') entra(true);
    else if (b?.dataset['soglia'] === 'accedi') opzioni.accedi?.();
  });

  mostra(opzioni.modo);
  return { mostra };
}
