// La soglia: una schermata d'ingresso sopra il gioco. Il clic per entrare è il gesto che i browser chiedono prima
// di lasciar suonare l'audio, così musica e ambiente partono già sulla prima schermata.
// Sul sito con l'accesso Google è anche la porta: senza account si vede solo «Entra con Google».
import { ROMBO, srcTavola } from './componenti';
import type { Lettore } from './audio';

const SFONDO = 'ambientazione/cicatrice-del-mondo';

/** attesa: si sta controllando l'account; accedi: serve il login; entra: si gioca. */
export type ModoSoglia = 'attesa' | 'accedi' | 'entra';

export interface Soglia {
  mostra(modo: ModoSoglia, messaggio?: string): void;
}

export function montaIngresso(l: Lettore, opzioni: { modo: ModoSoglia; accedi?: () => void }): Soglia {
  let soglia: HTMLDivElement | null = null;

  const entra = (muto: boolean) => {
    if (!soglia) return;
    if (muto) l.silenzia(true);
    else if (l.prefs.muto) l.silenzia(false);
    else l.avvia();
    document.documentElement.classList.remove('con-soglia');
    const via = soglia;
    soglia = null;
    via.classList.add('via');
    const togli = () => via.remove();
    via.addEventListener('transitionend', togli, { once: true });
    setTimeout(togli, 900); // se la transizione non parte (movimento ridotto)
  };

  const azioni = (modo: ModoSoglia): string => {
    if (modo === 'attesa') return `<button type="button" class="bottone primario" disabled>Un momento…</button>`;
    if (modo === 'accedi') return `<button type="button" class="bottone primario" data-soglia="accedi">Entra con Google</button>`;
    return `<button type="button" class="bottone primario" data-soglia="entra">Entra a Qir-Azel</button>
        <button type="button" class="soglia-muto" data-soglia="muto">Entra senza audio</button>`;
  };
  const nota = (modo: ModoSoglia): string => modo === 'entra'
    ? 'Musica, ambienti e voci: meglio con le cuffie.'
    : `Si gioca con un account Google: lì si salva il personaggio, e lo ritrovi da qualunque dispositivo.
       <a href="https://gioco-nyzar.pages.dev/privacy" target="_blank" rel="noopener">Privacy</a>`;

  const mostra = (modo: ModoSoglia, messaggio?: string) => {
    if (!soglia) {
      soglia = document.createElement('div');
      soglia.className = 'soglia';
      soglia.setAttribute('role', 'dialog');
      soglia.setAttribute('aria-modal', 'true');
      soglia.setAttribute('aria-labelledby', 'soglia-titolo');
      document.documentElement.classList.add('con-soglia');
      document.body.append(soglia);
      soglia.addEventListener('click', (e) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>('[data-soglia]');
        if (b?.dataset['soglia'] === 'entra') entra(false);
        else if (b?.dataset['soglia'] === 'muto') entra(true);
        else if (b?.dataset['soglia'] === 'accedi') opzioni.accedi?.();
      });
    }
    soglia.innerHTML = `
    <img class="soglia-sfondo" src="${srcTavola(SFONDO, 'l')}" alt="" decoding="async">
    <div class="soglia-testo">
      <div class="marchio">${ROMBO}<span class="nome-marchio"><span><b>NY'ZAR</b> · <em>QIR-AZEL</em></span><small>Cronache della Città Bassa</small></span></div>
      <span class="etichetta precursore">Superficie Fratturata · 150 D.C.</span>
      <h1 id="soglia-titolo">Qir-Azel</h1>
      <p>La città sull'orlo della Cicatrice del Mondo.</p>
      ${messaggio ? `<p class="soglia-messaggio" role="status">${messaggio.replace(/[&<>"]/g, (x) => `&#${x.charCodeAt(0)};`)}</p>` : ''}
      <div class="soglia-azioni">${azioni(modo)}</div>
      <small class="soglia-nota">${nota(modo)}</small>
    </div>`;
    soglia.querySelector<HTMLButtonElement>('[data-soglia]')?.focus();
  };

  mostra(opzioni.modo);
  return { mostra };
}
