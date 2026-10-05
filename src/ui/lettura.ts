// Il testo a pezzi, come in Citizen Sleeper: un paragrafo alla volta, con le parole che compaiono in cascata, e un
// «Continua» per andare avanti; le opzioni arrivano alla fine. Vale per il testo delle scene e degli esiti
// (attributo data-lettura nelle viste), solo la prima volta che li leggi e solo se sono abbastanza lunghi.
// Un clic sul testo, Spazio o Invio vanno avanti; «Mostra tutto» salta alla fine. Si spegne dal pannello
// dell'audio, e chi ha chiesto meno movimento vede i paragrafi a pezzi ma senza la dissolvenza.

const CHIAVE_LETTI = 'gioco-nyzar/letti';
const CHIAVE_ATTIVA = 'gioco-nyzar/testo-a-pezzi';
const MAX_LETTI = 4000;
const PAROLE_MIN = 70; // sotto, il testo compare tutto insieme

const leggi = <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v === null ? d : (JSON.parse(v) as T); } catch { return d; } };
const scrivi = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* vale per questa sessione */ } };

let letti = new Set<string>(leggi<string[]>(CHIAVE_LETTI, []));
let attiva = leggi<boolean>(CHIAVE_ATTIVA, true);
/** Quanti paragrafi sono già visibili nei testi letti a metà, così un ridisegno non ricomincia da capo. */
const progresso = new Map<string, number>();

function segnaLetto(k: string): void {
  letti.add(k);
  progresso.delete(k);
  if (letti.size > MAX_LETTI) letti = new Set([...letti].slice(-MAX_LETTI));
  scrivi(CHIAVE_LETTI, [...letti]);
}

const calma = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Le parole del paragrafo compaiono una dopo l'altra, in circa mezzo secondo comunque sia lungo. */
function cascata(p: HTMLElement): void {
  if (calma()) return;
  const testi: Text[] = [];
  const giro = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  for (let n = giro.nextNode(); n; n = giro.nextNode()) testi.push(n as Text);
  const parole = testi.reduce((a, t) => a + (t.data.match(/\S+/g)?.length ?? 0), 0);
  const passo = Math.min(28, 650 / Math.max(1, parole));
  let i = 0;
  for (const t of testi) {
    const pezzi = t.data.split(/(\s+)/);
    const f = document.createDocumentFragment();
    for (const pz of pezzi) {
      if (!pz) continue;
      if (/^\s+$/.test(pz)) { f.appendChild(document.createTextNode(pz)); continue; }
      const s = document.createElement('span');
      s.className = 'parola';
      s.style.animationDelay = `${Math.round(i++ * passo)}ms`;
      s.textContent = pz;
      f.appendChild(s);
    }
    t.replaceWith(f);
  }
}

interface Lettura { el: HTMLElement; scena: HTMLElement; paragrafi: HTMLElement[]; chiave: string; visti: number; bottoni: HTMLElement }
let corrente: Lettura | null = null;

function mostraBottoni(l: Lettura): void {
  const ultimo = l.paragrafi[l.visti - 1]!;
  ultimo.after(l.bottoni);
}

function finisci(l: Lettura): void {
  for (const p of l.paragrafi) p.hidden = false;
  l.bottoni.remove();
  l.scena.classList.remove('in-lettura');
  l.scena.classList.add('letta');
  segnaLetto(l.chiave);
  if (corrente === l) corrente = null;
}

/** Il paragrafo successivo, o la fine se era l'ultimo. */
export function continuaLettura(): void {
  const l = corrente;
  if (!l || !l.el.isConnected) return;
  if (l.visti >= l.paragrafi.length) { finisci(l); return; }
  const p = l.paragrafi[l.visti]!;
  p.hidden = false;
  cascata(p);
  l.visti++;
  progresso.set(l.chiave, l.visti);
  if (l.visti >= l.paragrafi.length) finisci(l);
  else mostraBottoni(l);
  (l.visti >= l.paragrafi.length ? p : l.bottoni).scrollIntoView({ block: 'nearest', behavior: calma() ? 'auto' : 'smooth' });
}

export function tuttoLettura(): void {
  if (corrente?.el.isConnected) finisci(corrente);
}

/** Da chiamare dopo ogni ridisegno: se c'è un testo da leggere a pezzi, lo prepara. */
export function avviaLettura(radice: HTMLElement): void {
  corrente = null;
  const el = radice.querySelector<HTMLElement>('[data-lettura]');
  const scena = el?.closest<HTMLElement>('.scena');
  if (!el || !scena) return;
  const chiave = el.dataset['lettura']!;
  const paragrafi = [...el.querySelectorAll<HTMLElement>('.prosa > p')];
  const parole = (el.textContent ?? '').split(/\s+/).filter(Boolean).length;
  if (!attiva || letti.has(chiave) || paragrafi.length < 2 || parole < PAROLE_MIN) return;
  const bottoni = document.createElement('div');
  bottoni.className = 'lettura-bottoni';
  bottoni.innerHTML = `<button type="button" class="bottone continua" data-az="continua-lettura">Continua</button>
    <button type="button" class="link" data-az="tutto-lettura">Mostra tutto</button>`;
  const visti = Math.max(1, progresso.get(chiave) ?? 1);
  const l: Lettura = { el, scena, paragrafi, chiave, visti, bottoni };
  scena.classList.add('in-lettura');
  paragrafi.forEach((p, i) => { p.hidden = i >= visti; });
  if (!progresso.has(chiave)) { cascata(paragrafi[0]!); progresso.set(chiave, 1); }
  mostraBottoni(l);
  corrente = l;
  // un clic sul testo va avanti, tranne sui nomi del glossario, che aprono la loro scheda
  el.addEventListener('click', (e) => {
    if (corrente !== l || (e.target as HTMLElement).closest('.voce, button, a')) return;
    continuaLettura();
  });
}

document.addEventListener('keydown', (e) => {
  if (!corrente?.el.isConnected) return;
  const t = e.target instanceof Element ? e.target : null;
  if (t?.closest('input, textarea, select')) return;
  if (e.key === ' ' || e.key === 'ArrowDown' || (e.key === 'Enter' && !t?.closest('button'))) { e.preventDefault(); continuaLettura(); }
});

// ---------------------------------------------------------------- l'opzione nel pannello

export function montaOpzioneLettura(): void {
  const pannello = document.querySelector('.audio-pannello');
  if (!pannello || pannello.querySelector('[data-lettura-opzione]')) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'bottone piccolo';
  b.dataset['letturaOpzione'] = '1';
  const aggiorna = () => {
    b.textContent = attiva ? 'Testo a pezzi: sì' : 'Testo a pezzi: no';
    b.setAttribute('aria-pressed', String(attiva));
    b.title = 'Le scene lunghe compaiono un paragrafo alla volta, la prima volta che le leggi';
  };
  b.addEventListener('click', () => {
    attiva = !attiva;
    scrivi(CHIAVE_ATTIVA, attiva);
    aggiorna();
    if (!attiva) tuttoLettura();
  });
  const etichetta = document.createElement('p');
  etichetta.className = 'etichetta velo';
  etichetta.textContent = 'Lettura';
  pannello.append(etichetta, b);
  aggiorna();
}
