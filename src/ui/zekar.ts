// Il tavolo dello Zekar: la scelta delle quattro laterali, poi la partita con le carte sul tavolo, il totale che sale
// verso 20 e i round vinti. Dopo ogni tua mossa `riproduciZekar` mette in scena gli eventi del motore uno alla volta
// (le carte dell'avversario, chi sta, chi sballa, la fine del round), con i suoni.
import {
  OBIETTIVO, ROUND_PER_VINCERE, LATERALI, LATERALI_IN_MANO, type StatoZekar, type Foto, type EventoZekar, type Carta,
} from '../motore/zekar';
import { h } from './formato';
import { tavola, etichetta } from './componenti';
import type { Contesto } from './viste';
import type { Suono } from './suoni';

const segnato = (v: number) => (v > 0 ? `+${v}` : `−${Math.abs(v)}`);

/** Il nome corto per il segnapunti: «Dragna», «Orazio», «Raschiatori». */
export function nomeBreve(nome: string): string {
  const parole = nome.split(' ');
  return parole[0] === 'I' || parole[0] === 'Le' || parole[0] === 'Gli' ? parole[1] ?? nome : parole[0]!;
}

// ---------------------------------------------------------------- pezzi

function carta(c: Carta, nuova = false): string {
  const cls = c.laterale ? (c.v > 0 ? ' laterale piu' : ' laterale meno') : '';
  return `<span class="zk-carta${cls}${nuova ? ' nuova' : ''}" aria-label="${c.laterale ? `laterale ${segnato(c.v)}` : c.v}"><b>${c.laterale ? segnato(c.v) : c.v}</b></span>`;
}

const dorso = (nuova = false) => `<span class="zk-carta dorso${nuova ? ' nuova' : ''}" aria-hidden="true"></span>`;

function pip(vinti: number): string {
  return `<span class="zk-pip" role="img" aria-label="${vinti} round vinti su ${ROUND_PER_VINCERE}">${
    Array.from({ length: ROUND_PER_VINCERE }, (_, i) => `<i${i < vinti ? ' class="on"' : ''}></i>`).join('')}</span>`;
}

/** Il totale con la scala fino a 20: più si avvicina, più si scalda; oltre, è rosso. */
function totale(t: number, sta: boolean): string {
  const q = Math.max(0, Math.min(1, t / OBIETTIVO));
  const cls = t > OBIETTIVO ? ' oltre' : t >= 18 ? ' alto' : t >= 15 ? ' medio' : '';
  return `<div class="zk-totale${cls}${sta ? ' fermo' : ''}">
    <b>${t}</b><small>su ${OBIETTIVO}</small>
    <span class="zk-scala" aria-hidden="true"><i style="transform:scaleX(${q.toFixed(3)})"></i></span>
  </div>`;
}

interface Lato { chi: 0 | 1; nome: string; immagine?: string }

/** Una fila del tavolo, dalla foto: carte calate, totale, laterali rimaste, chi sta o ha sballato. */
function fila(f: Foto, lato: Lato, ev: EventoZekar | undefined, zs: StatoZekar, mie: boolean): string {
  const g = f.g[lato.chi];
  const nuova = ev && ev.chi === lato.chi && (ev.tipo === 'pesca' || ev.tipo === 'laterale') ? g.carte.length - 1 : -1;
  const sballato = g.totale > OBIETTIVO && (ev?.tipo === 'sballa' || ev?.tipo === 'round');
  const timbro = g.sta ? '<span class="zk-timbro sta">Sta</span>' : sballato ? '<span class="zk-timbro sballa">Sballa</span>' : '';
  const turno = f.turno === lato.chi && !g.sta && zs.fase === 'gioco';
  const laterali = mie
    ? g.laterali.map((v, i) => {
      const ok = zs.fase === 'gioco' && zs.turno === 0 && !zs.lateraleUsata && f === ultimaFoto(zs);
      return `<button type="button" class="zk-carta laterale ${v > 0 ? 'piu' : 'meno'} giocabile" data-az="zk-gioca" data-i="${i}" ${ok ? '' : 'disabled'}
        title="${ok ? `Gioca la laterale ${segnato(v)}: il totale va a ${g.totale + v}` : 'Una laterale per turno, e solo nel tuo'}"><b>${segnato(v)}</b></button>`;
    }).join('')
    : g.laterali.map(() => dorso()).join('');
  return `<section class="zk-fila${mie ? ' tua' : ' sua'}${turno ? ' di-turno' : ''}">
    <header class="zk-chi">
      ${tavola(lato.immagine, { classe: 'ritratto piccolo' })}
      <div><h3>${h(lato.nome)}</h3>${pip(g.vinti)}</div>
    </header>
    <div class="zk-banco">
      <div class="zk-carte">${g.carte.map((c, i) => carta(c, i === nuova)).join('') || '<span class="zk-vuoto">nessuna carta</span>'}</div>
      ${timbro}
    </div>
    ${totale(g.totale, g.sta)}
    <div class="zk-laterali${mie ? '' : ' coperte'}" aria-label="${mie ? 'Le tue laterali' : 'Le sue laterali, coperte'}">
      <span class="etichetta">${mie ? 'Le tue laterali' : 'Laterali'}</span>
      <div class="zk-mano">${laterali || '<span class="zk-vuoto">finite</span>'}</div>
    </div>
  </section>`;
}

const ultimaFoto = (zs: StatoZekar): Foto | undefined => zs.eventi[zs.eventi.length - 1]?.foto;

/** Come si nomina l'avversario nelle frasi: «Dragna sta», «i Raschiatori stanno». */
function grammatica(nome: string) {
  const breve = nomeBreve(nome);
  const plurale = nome.startsWith('I ');
  return {
    soggetto: plurale ? `I ${breve}` : breve,
    a: plurale ? `ai ${breve}` : `a ${breve}`,
    v: (sing: string, plur: string) => (plurale ? plur : sing),
  };
}

function messaggio(zs: StatoZekar, f: Foto, ev?: EventoZekar): string {
  const g = grammatica(zs.avversario.nome);
  if (ev?.tipo === 'round') return ev.chi === 0 ? 'Round a te' : `Round ${g.a}`;
  if (ev?.tipo === 'pareggio') return 'Pari: il round si rigioca';
  if (ev?.tipo === 'partita') return ev.chi === 0 ? 'Partita vinta' : 'Partita persa';
  if (ev?.tipo === 'sballa') return ev.chi === 0 ? 'Sballi' : `${g.soggetto} ${g.v('sballa', 'sballano')}`;
  if (!ev && zs.fase === 'finita') {
    const ultimo = [...zs.eventi].reverse().find((e) => e.tipo === 'round');
    return ultimo?.chi === 0 ? "L'ultimo round è tuo" : `L'ultimo round va ${g.a}`;
  }
  const io = f.g[0], avv = f.g[1];
  const fermo = `${g.soggetto} ${g.v('sta', 'stanno')} a ${avv.totale}`;
  if (ev?.chi === 0 && ev.tipo === 'sta') return `Stai a ${io.totale}`;
  if (ev?.chi === 0 && ev.tipo === 'passa') return 'Passi la mano';
  if (f.turno === 1) return ev?.tipo === 'sta' && ev.chi === 1 ? fermo : `Tocca ${g.a}`;
  if (io.totale > OBIETTIVO) return 'Sei oltre il venti: gioca una negativa o sballi';
  if (avv.sta) return `${fermo}: per vincere ${g.v('devi superarlo', 'devi superarli')}`;
  return 'Tocca a te';
}

function tavoloDa(zs: StatoZekar, x: Contesto, f: Foto, ev?: EventoZekar): string {
  const avv: Lato = { chi: 1, nome: zs.avversario.nome, immagine: zs.avversario.immagine };
  const tu: Lato = { chi: 0, nome: x.s.nome, immagine: x.c.origini.find((o) => o.id === x.s.origine)?.immagine };
  const annuncio = ev && ['round', 'pareggio', 'partita'].includes(ev.tipo)
    ? `<p class="zk-annuncio ${ev.tipo === 'pareggio' ? 'pari' : ev.chi === 0 ? 'bene' : 'male'}">${h(messaggio(zs, f, ev))}</p>` : '';
  return `${fila(f, avv, ev, zs, false)}
    <div class="zk-centro">
      <div class="zk-mazzo" aria-label="${f.mazzo} carte nel mazzo"><span class="zk-carta dorso"></span><span class="zk-carta dorso"></span><span class="zk-carta dorso"></span><small>${f.mazzo}</small></div>
      <p class="zk-messaggio" aria-live="polite">${annuncio ? '' : h(messaggio(zs, f, ev))}</p>
      <span class="etichetta">Round ${f.round}</span>
      ${annuncio}
    </div>
    ${fila(f, tu, ev, zs, true)}`;
}

// ---------------------------------------------------------------- vista

export function vistaZekar(x: Contesto, zs: StatoZekar, scelte: number[]): string {
  const avv = zs.avversario;
  const titolo = x.c.storylet.find((st) => x.vista.tipo === 'zekar' && st.id === x.vista.id)?.titolo ?? 'Zekar';

  if (zs.fase === 'scelta') {
    const carte = LATERALI.map((v) => {
      const on = scelte.includes(v);
      const piene = scelte.length >= LATERALI_IN_MANO && !on;
      return `<button type="button" class="zk-carta laterale ${v > 0 ? 'piu' : 'meno'} scegli${on ? ' scelta' : ''}" data-az="zk-scegli" data-i="${v}"
        aria-pressed="${on}" ${piene ? 'disabled' : ''}><b>${segnato(v)}</b></button>`;
    }).join('');
    return `<article class="scena zekar">
      <div class="testa">${etichetta(`Zekar · ${titolo}`, 'velo')}</div>
      <header class="zk-avversario">
        ${tavola(avv.immagine, { classe: 'ritratto grande' })}
        <div>
          <h2>Contro ${h(avv.nome)}</h2>
          ${avv.descrizione ? `<p>${h(avv.descrizione)}</p>` : ''}
          <p class="zk-regola">Vince il round chi arriva più vicino a ${OBIETTIVO} senza superarlo. A ogni turno peschi una carta dal mazzo, da 1 a 10; poi puoi giocare una laterale, passare il turno o stare. Chi supera ${OBIETTIVO} a fine turno sballa. Le quattro laterali valgono per tutta la partita, e vince chi arriva per primo a ${ROUND_PER_VINCERE} round.</p>
        </div>
      </header>
      <section class="zk-scelta">
        <p class="etichetta">Scegli le tue quattro laterali · ${scelte.length}/${LATERALI_IN_MANO}</p>
        <div class="zk-mano larga">${carte}</div>
        <p class="suggerimento">Le negative ti salvano quando la carta pescata è troppo alta, le positive ti portano a ridosso del venti. ${avv.nome.startsWith('I ') ? 'Loro' : 'Anche l\'avversario'} ne ha quattro, coperte.</p>
      </section>
      <div class="azioni-fondo">
        <button type="button" class="bottone primario" data-az="zk-siediti" ${scelte.length === LATERALI_IN_MANO ? '' : 'disabled'}>Siediti al tavolo</button>
      </div>
    </article>`;
  }

  const f = ultimaFoto(zs)!;
  const g = f.g[0];
  const mioTurno = zs.fase === 'gioco' && zs.turno === 0;
  // il pulsante in evidenza è quello che conviene di solito: fermarsi da 17 in su, o quando sei già davanti a chi sta
  const lui = f.g[1];
  const conviene = g.totale <= OBIETTIVO && (lui.sta ? g.totale > lui.totale : g.totale >= 17);
  const azioni = zs.fase === 'finita'
    ? `<div class="verdetto-box"><p class="verdetto ${zs.vinto ? 'vinto' : 'perso'}">${zs.vinto ? 'Partita vinta' : 'Partita persa'}</p>
        <p class="zk-punteggio">${zs.g[0].vinti} a ${zs.g[1].vinti}</p>
        <div class="azioni-fondo"><button type="button" class="bottone primario" data-az="zk-concludi">Prosegui</button></div></div>`
    : `<div class="zk-azioni">
        <button type="button" class="bottone azione-grande${conviene ? '' : ' primario'}" data-az="zk-passa" ${mioTurno ? '' : 'disabled'}
          title="Tieni il totale e passa la mano: al prossimo turno peschi ancora"><span>Passa</span><small>pescherai ancora</small></button>
        <button type="button" class="bottone azione-grande${conviene ? ' primario' : ''}" data-az="zk-stai" ${mioTurno ? '' : 'disabled'}
          title="Ti fermi qui: non peschi più in questo round"><span>Stai a ${g.totale}</span><small>${g.totale > OBIETTIVO ? 'oltre il venti sballi' : 'non peschi più'}</small></button>
      </div>`;
  return `<article class="scena zekar in-gioco">
    <div class="testa-scontro">
      <div class="testa">${etichetta(`Zekar · ${titolo}`, 'velo')}</div>
      <p class="zk-segnapunti"><span>Tu</span>${pip(zs.g[0].vinti)}<span class="contro">contro</span>${pip(zs.g[1].vinti)}<span>${h(nomeBreve(avv.nome))}</span></p>
    </div>
    <div class="zk-tavolo">${tavoloDa(zs, x, f)}</div>
    <button type="button" class="bottone piccolo salta-scena" data-az="salta-scena">Salta ›</button>
    ${azioni}
  </article>`;
}

// ---------------------------------------------------------------- messa in scena

interface Riproduzione { saltata: boolean; sveglia: (() => void) | null }
let corrente: Riproduzione | null = null;

export function saltaZekar(): boolean {
  if (!corrente) return false;
  corrente.saltata = true;
  corrente.sveglia?.();
  return true;
}

function aspetta(r: Riproduzione, ms: number): Promise<void> {
  if (r.saltata) return Promise.resolve();
  return new Promise((ok) => {
    const t = setTimeout(() => { r.sveglia = null; ok(); }, ms);
    r.sveglia = () => { clearTimeout(t); r.sveglia = null; ok(); };
  });
}

const SUONI: Partial<Record<EventoZekar['tipo'], Suono>> = {
  pesca: 'carta', laterale: 'laterale', sta: 'sta', sballa: 'dissonanza', inizio: 'mescola', pareggio: 'fermo',
};
const PAUSE: Record<EventoZekar['tipo'], number> = {
  inizio: 550, pesca: 650, laterale: 750, passa: 380, sta: 700, sballa: 900, round: 1500, pareggio: 1300, partita: 600,
};

/** Mette in scena gli eventi dal numero `da` in poi, ridisegnando il tavolo da ogni foto. */
export async function riproduciZekar(radice: HTMLElement, zs: StatoZekar, x: Contesto, da: number, effetto: (s: Suono) => void): Promise<void> {
  if (corrente) saltaZekar();
  const el = radice.querySelector<HTMLElement>('.scena.zekar.in-gioco');
  const tavolo = el?.querySelector<HTMLElement>('.zk-tavolo');
  const eventi = zs.eventi.slice(da);
  if (!el || !tavolo || !eventi.length) return;
  const r: Riproduzione = { saltata: false, sveglia: null };
  corrente = r;
  el.classList.add('in-scena');
  const finale = tavolo.innerHTML;
  const tasti = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); saltaZekar(); } };
  document.addEventListener('keydown', tasti);
  try {
    for (const ev of eventi) {
      if (r.saltata || !el.isConnected) break;
      tavolo.innerHTML = tavoloDa(zs, x, ev.foto, ev);
      const s = ev.tipo === 'round' || ev.tipo === 'partita' ? (ev.chi === 0 ? 'round' : 'fermo') : SUONI[ev.tipo];
      if (s && ev.tipo !== 'partita') effetto(s);
      if (ev.tipo === 'sballa') tavolo.querySelector(`.zk-fila.${ev.chi === 0 ? 'tua' : 'sua'} .zk-totale`)?.classList.add('scosso');
      await aspetta(r, PAUSE[ev.tipo]);
    }
  } finally {
    document.removeEventListener('keydown', tasti);
    if (corrente === r) corrente = null;
    if (el.isConnected) {
      tavolo.innerHTML = finale;
      el.classList.remove('in-scena');
      if (zs.fase === 'finita') { el.classList.add('epilogo'); effetto(zs.vinto ? 'vittoria' : 'sconfitta'); }
    }
  }
}
