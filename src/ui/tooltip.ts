// Schede del glossario: al passaggio del mouse, al tocco o con il tasto Tab sui nomi sottolineati
// compare un box con la voce, come l'anteprima di una pagina di Wikipedia (senza immagine).
import type { TVoce } from '../motore/contenuto';
import { h } from './formato';

const TIPI: Record<TVoce['tipo'], string> = {
  personaggio: 'Personaggio', luogo: 'Luogo', fazione: 'Fazione', creatura: 'Creatura', cosa: 'Voce',
};

let voci = new Map<string, TVoce>();
let box: HTMLDivElement;
let aperta: HTMLElement | null = null;
let fissata = false; // aperta con un tocco o un clic: resta finché non si tocca altrove

export function nascondiScheda(): void {
  if (!box) return;
  box.hidden = true;
  aperta?.removeAttribute('aria-describedby');
  aperta?.classList.remove('attiva');
  aperta = null;
  fissata = false;
}

function mostra(el: HTMLElement): void {
  const v = voci.get(el.dataset['voce'] ?? '');
  if (!v) return;
  if (aperta && aperta !== el) nascondiScheda();
  box.innerHTML = `<span class="etichetta">${TIPI[v.tipo]}</span>
    <b class="nome-voce">${h(v.nome)}</b>
    ${v.sottotitolo ? `<small>${h(v.sottotitolo)}</small>` : ''}
    <p>${h(v.testo)}</p>`;
  box.hidden = false;
  aperta = el;
  el.classList.add('attiva');
  el.setAttribute('aria-describedby', 'scheda-voce');
  posiziona(el);
}

function posiziona(el: HTMLElement): void {
  const r = el.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const margine = 16;
  box.style.maxWidth = `${Math.min(340, vw - margine * 2)}px`;
  const w = box.offsetWidth;
  const hgt = box.offsetHeight;
  const left = Math.max(margine, Math.min(r.left + r.width / 2 - w / 2, vw - w - margine));
  const sotto = r.bottom + 8;
  const top = sotto + hgt > vh - margine && r.top - hgt - 8 > margine ? r.top - hgt - 8 : sotto;
  box.style.left = `${left}px`;
  box.style.top = `${top}px`;
}

export function avviaSchede(glossario: TVoce[]): void {
  voci = new Map(glossario.map((v) => [v.id, v]));
  box = document.createElement('div');
  box.id = 'scheda-voce';
  box.className = 'scheda-voce';
  box.setAttribute('role', 'tooltip');
  box.hidden = true;
  document.body.appendChild(box);

  const voce = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>('.voce') : null);

  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || fissata) return;
    const el = voce(e.target);
    if (el) mostra(el);
  });
  document.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse' || fissata) return;
    const el = voce(e.target);
    if (el && el === aperta && !el.contains(e.relatedTarget as Node | null)) nascondiScheda();
  });
  document.addEventListener('click', (e) => {
    const el = voce(e.target);
    if (el) {
      e.preventDefault();
      if (aperta === el && fissata) { nascondiScheda(); return; }
      mostra(el);
      fissata = true;
    } else if (!box.contains(e.target as Node)) nascondiScheda();
  });
  document.addEventListener('focusin', (e) => { const el = voce(e.target); if (el) mostra(el); });
  document.addEventListener('focusout', (e) => { if (voce(e.target) === aperta && !fissata) nascondiScheda(); });
  document.addEventListener('keydown', (e) => {
    const el = voce(e.target);
    if (e.key === 'Escape') nascondiScheda();
    else if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); mostra(el); fissata = true; }
  });
  window.addEventListener('scroll', () => { if (aperta) posiziona(aperta); }, { passive: true });
  window.addEventListener('resize', nascondiScheda);
}
