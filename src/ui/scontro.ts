// La scena del combattimento: lo schieramento con le statistiche, il tavolo dei dadi, le azioni con l'anteprima
// del tiro e il registro diviso per round. Dopo ogni mossa `riproduci` mette in scena il round appena giocato,
// evento per evento (dadi che rotolano, colpi, PF che scendono, suoni), a partire dagli eventi del motore.
import type { TContenuti, TIncantesimo } from '../motore/contenuto';
import { MAX_CONSUMABILI_IN_COMBATTIMENTO } from '../motore/regole';
import {
  inPiedi, modifica, CONSUMABILI, perchéNonLanciabile, descriviModifica, dadiDifesaContro,
  type StatoCombattimento, type Combattente, type Evento,
} from '../motore/combattimento';
import { probabilitaSuperare, probabilita } from '../motore/dadi';
import { h, mezzi, nome, percentuale } from './formato';
import { tavola, dado, etichetta } from './componenti';
import type { Contesto } from './viste';
import type { Suono } from './suoni';

const pool = (base: number, mod: number) => Math.max(0, base + mod);

// ---------------------------------------------------------------- preferenze

const CHIAVE_VELOCE = 'gioco-nyzar/combattimento-veloce';
let veloce = (() => { try { return localStorage.getItem(CHIAVE_VELOCE) === '1'; } catch { return false; } })();

export function cambiaVelocita(el: HTMLElement): void {
  veloce = !veloce;
  try { localStorage.setItem(CHIAVE_VELOCE, veloce ? '1' : '0'); } catch { /* vale per questa sessione */ }
  el.setAttribute('aria-pressed', String(veloce));
  el.textContent = veloce ? 'Ritmo rapido' : 'Ritmo pieno';
}

// ---------------------------------------------------------------- pezzi

/** Le barre si riempiono con scaleX, che si anima senza ricalcolare l'impaginazione. */
const scala = (q: number) => `transform:scaleX(${Math.max(0, Math.min(1, q)).toFixed(3)})`;

function barraPF(cb: Combattente): string {
  const q = scala(cb.pf / cb.pfMax);
  return `<div class="pf-riga"><span class="barra pf${cb.pf / cb.pfMax < 0.4 ? ' bassa' : ''}" data-pf>
    <i class="scia" style="${q}"></i><i class="vivo" style="${q}"></i></span>
    <b class="pf-num" data-pf-num>${cb.pf}/${cb.pfMax} PF</b></div>`;
}

function barraEnergia(cb: Combattente): string {
  const q = cb.energiaMax ? Math.min(1, cb.energia / cb.energiaMax) : 0;
  return `<div class="pf-riga"><span class="barra energia" data-en><i class="vivo" style="${scala(q)}"></i></span>
    <b class="pf-num" data-en-num>${cb.energia}/${cb.energiaMax} Energia</b></div>`;
}

function chipEffetti(cb: Combattente, c: TContenuti): string {
  const nomi = (cb.effetti ?? []).map((e) => {
    const fonte = e.fonte === 'intimidire' ? 'Intimidito' : e.fonte === 'inceppamento' ? 'Arma inceppata'
      : c.incantesimi.find((i) => i.id === e.fonte)?.nome ?? c.oggetti.find((o) => o.id === e.fonte)?.nome ?? e.fonte;
    const durata = e.tipo === 'salta' ? '' : ` · ${e.round}`;
    return `<span class="chip ${e.valore >= 0 && e.tipo !== 'salta' ? 'buono' : 'cattivo'}" title="${h(descriviModifica(e))}">${h(fonte)}${durata}</span>`;
  });
  for (const v of cb.veleni ?? []) nomi.push(`<span class="chip cattivo">Avvelenato · ${v.round}</span>`);
  return nomi.length ? `<div class="chips">${nomi.join('')}</div>` : '';
}

/** Una statistica dello schieramento: i dadi (o il valore) con la modifica degli effetti in corso. */
function stat(etich: string, base: number, mod: number, dadi: boolean, titolo: string): string {
  const v = dadi ? pool(base, mod) : base + mod;
  const cls = mod > 0 ? ' su' : mod < 0 ? ' giu' : '';
  return `<div class="stat${cls}" title="${h(titolo)}"><dt>${etich}</dt><dd>${dadi ? '<i class="mini-dado" aria-hidden="true"></i>' : ''}${v}${mod ? `<small>${mod > 0 ? '+' : '−'}${Math.abs(mod)}</small>` : ''}</dd></div>`;
}

function statistiche(cb: Combattente, magia: boolean): string {
  const righe = [
    stat('Attacco', cb.attacco, modifica(cb, 'attacco'), true, 'Dadi in attacco'),
    stat('Difesa', cb.difesa, modifica(cb, 'difesa'), true, 'Dadi in difesa'),
    stat('Danno', cb.danno, 0, false, 'Danni aggiunti al margine di un colpo'),
    stat('Riduz.', cb.riduzione, modifica(cb, 'riduzione'), false, 'Riduzione: danni tolti da ogni colpo subito'),
  ];
  if (cb.lato === 'pg') {
    if (magia) righe.push(stat('Magia', cb.magia, modifica(cb, 'magia'), true, 'Dadi di Mentale + Magia per lanciare'));
    righe.push(stat('Intim.', cb.intimidire, modifica(cb, 'sociale'), true, 'Dadi per intimidire'));
  } else righe.push(stat('Volontà', cb.difesaMentale, modifica(cb, 'mentale'), true, 'Dadi contro intimidire e incantesimi della mente'));
  return `<dl class="statistiche">${righe.join('')}</dl>`;
}

const nomeBreve = (cs: StatoCombattimento, id?: string) => {
  const cb = cs.combattenti.find((x) => x.id === id);
  return !cb ? '' : cb.lato === 'pg' ? 'Tu' : cb.nome;
};

/** Il tavolo dei dadi per un evento: i due tiri, i successi, l'esito. */
function tavoloEvento(cs: StatoCombattimento, ev: Evento): string {
  const att = cs.combattenti.find((x) => x.id === ev.chi);
  const titolo = `${nomeBreve(cs, ev.chi)}${ev.nome ? ` · ${ev.nome}` : ev.tipo === 'intimidire' ? ' · Intimidire' : ''}`;
  const mano = (lato: string, chi: string, facce: number[] | undefined, fissi?: number) => {
    const successi = fissi ?? (facce ?? []).filter((f) => f >= 4).length;
    const dadi = fissi !== undefined ? `<span class="fissi">${fissi} successi fissi</span>`
      : facce && facce.length ? facce.map(dado).join('') : '<span class="fissi">nessun dado</span>';
    return `<div class="mano-dadi ${lato}"><span class="chi">${h(chi)}</span><span class="dadi">${dadi}</span><b class="conto">${successi}</b></div>`;
  };
  const contro = ev.difesa !== undefined
    ? `<span class="contro">contro</span>${mano('dif', nomeBreve(cs, ev.contro), ev.difesa)}` : '';
  return `${mano('att', titolo, ev.tiro, ev.fissi)}${contro}<p class="esito-tiro ${classeEsito(cs, ev)}">${h(testoEsito(cs, ev, att))}</p>`;
}

function testoEsito(cs: StatoCombattimento, ev: Evento, att?: Combattente): string {
  if (ev.tipo === 'dissonanza') return ev.nome && cs.incantesimi.some((i) => i.nome === ev.nome) ? 'Dissonanza: il Mana torna indietro' : 'Il reperto si guasta';
  if (ev.danno !== undefined) return ev.caduto ? `${ev.danno} ${ev.danno === 1 ? 'danno' : 'danni'} · a terra` : `${ev.danno} ${ev.danno === 1 ? 'danno' : 'danni'}`;
  if (ev.tipo === 'cura') return ev.cura !== undefined ? `+${ev.cura} PF` : 'Energia';
  if (ev.tipo === 'effetto') return ev.nome ?? 'Effetto';
  if (ev.tipo === 'intimidire') return ev.fuga ? 'Scappa' : ev.colpo ? 'Esita' : 'Non si lascia impressionare';
  if (ev.fuga) return 'Se ne va';
  if (ev.colpo) return 'A segno';
  if (ev.tipo === 'attacco') return att?.lato === 'pg' ? 'Parato' : 'Schivato';
  return 'Senza effetto';
}

/** Per chi gioca: bene, male o neutro. */
function classeEsito(cs: StatoCombattimento, ev: Evento): string {
  const mio = (id?: string) => cs.combattenti.find((x) => x.id === id)?.lato === 'pg';
  if (ev.tipo === 'dissonanza' || ev.tipo === 'fermo' && mio(ev.chi)) return 'male';
  if (ev.tipo === 'fermo') return 'bene';
  if (ev.tipo === 'veleno') return mio(ev.contro) ? 'male' : 'bene';
  if (ev.tipo === 'cura' || ev.tipo === 'effetto') return mio(ev.chi) ? 'bene' : 'male';
  if (ev.colpo === true) return mio(ev.chi) ? 'bene' : 'male';
  if (ev.colpo === false) return mio(ev.chi) ? 'neutro' : 'parato';
  return 'neutro';
}

/** Probabilità di andare a segno di un'azione contro il bersaglio, se ha senso dirla. */
function anteprimaIncantesimo(pg: Combattente, inc: TIncantesimo, b: Combattente | undefined): string {
  const magia = pool(pg.magia, modifica(pg, 'magia'));
  if ((inc.tipo === 'attacco' || inc.tipo === 'indebolimento' || inc.tipo === 'area') && b) {
    const d = dadiDifesaContro(b, inc.difesa);
    return ` · ${percentuale(probabilitaSuperare(magia, d))}`;
  }
  // i successi fissi valgono solo se il lancio non va in Dissonanza
  if (inc.tipo === 'automatico' && b) return ` · ${percentuale((1 - 0.5 ** magia) * (1 - probabilita(dadiDifesaContro(b, inc.difesa), inc.successi!)))}`;
  return '';
}

function registro(cs: StatoCombattimento): string {
  const eventi = cs.eventi ?? [];
  if (!eventi.length) return `<ol class="registro-righe" aria-live="polite">${cs.log.slice(-12).map((l) => `<li>${h(l)}</li>`).join('')}</ol>`;
  const ultimo = Math.max(...eventi.map((e) => e.round));
  const riga = (e: Evento) => `<li class="${e.tipo} ${classeEsito(cs, e)}" data-riga="${e.riga}">${h(cs.log[e.riga] ?? '')}</li>`;
  const recenti = eventi.filter((e) => e.round === ultimo);
  const prima = eventi.filter((e) => e.round < ultimo);
  const gruppi = [...new Set(prima.map((e) => e.round))].reverse()
    .map((r) => `<li class="round-titolo">Round ${r}</li>${prima.filter((e) => e.round === r).map(riga).join('')}`).join('');
  return `<p class="etichetta">Round ${ultimo}</p>
    <ol class="registro-righe" aria-live="polite">${recenti.map(riga).join('')}</ol>
    ${prima.length ? `<details class="registro-prima"><summary>Round precedenti</summary><ol class="registro-righe">${gruppi}</ol></details>` : ''}`;
}

// ---------------------------------------------------------------- vista

export function vistaCombattimento(x: Contesto, cs: StatoCombattimento): string {
  const { c } = x;
  const pg = cs.combattenti.find((z) => z.lato === 'pg')!;
  const nemici = cs.combattenti.filter((z) => z.lato === 'nemico');
  const vivi = nemici.filter(inPiedi);
  const bersaglio = vivi.find((n) => n.id === x.bersaglio) ?? vivi[0];
  const usatiTot = Object.values(cs.usati).reduce((a, b) => a + b, 0);
  const conMagia = pg.energiaMax > 0 && (cs.incantesimi ?? []).length > 0;
  const nemicoImg = (id: string) => c.nemici.find((n) => id.startsWith(n.id + '#'))?.immagine;

  const carte = nemici.map((n) => {
    const attivo = inPiedi(n) && !cs.finito;
    const scelto = attivo && n.id === bersaglio?.id;
    const stato = n.fuggito ? 'Fuggito' : n.pf === 0 ? 'A terra' : scelto ? 'Bersaglio' : '';
    const contenuto = `${tavola(nemicoImg(n.id), { classe: 'ritratto piccolo' })}
      <div class="corpo">
        <div class="testa"><h3>${h(n.nome)}</h3>${stato ? etichetta(stato, scelto ? 'mana' : 'dim') : ''}</div>
        ${barraPF(n)}
        ${statistiche(n, false)}
        ${chipEffetti(n, c)}
      </div>`;
    const cls = `combattente nemico${scelto ? ' scelto' : ''}${attivo ? '' : ' fuori'}`;
    return attivo
      ? `<li><button type="button" class="${cls}" data-az="bersaglio" data-id="${n.id}" data-cid="${n.id}" aria-pressed="${scelto}">${contenuto}</button></li>`
      : `<li><div class="${cls}" data-cid="${n.id}">${contenuto}</div></li>`;
  }).join('');

  const ordine = cs.ordine.map((id) => {
    const cb = cs.combattenti.find((z) => z.id === id)!;
    return `<li class="${inPiedi(cb) ? '' : 'fuori'}${cb.lato === 'pg' ? ' pg' : ''}" data-ordine="${id}">${h(cb.lato === 'pg' ? 'Tu' : cb.nome)}</li>`;
  }).join('');

  // azioni con l'anteprima del tiro contro il bersaglio
  const att = pool(pg.attacco, modifica(pg, 'attacco'));
  const intim = pool(pg.intimidire, modifica(pg, 'sociale'));
  const difB = bersaglio ? pool(bersaglio.difesa, modifica(bersaglio, 'difesa')) : 0;
  const volB = bersaglio ? pool(bersaglio.difesaMentale, modifica(bersaglio, 'mentale')) : 0;
  const anteprima = (a: number, d: number) => `<small>${a} contro ${d} · ${percentuale(probabilitaSuperare(a, d))}</small>`;
  const attacca = pg.ricaricando
    ? `<button type="button" class="bottone primario azione-grande" data-az="attacca"><span>Ricarica</span><small>l'arma è scarica</small></button>`
    : `<button type="button" class="bottone primario azione-grande" data-az="attacca" title="I tuoi dadi in attacco contro i suoi in difesa, e la probabilità di colpire"><span>Attacca</span>${anteprima(att, difB)}</button>`;
  const intimidisci = `<button type="button" class="bottone azione-grande" data-az="intimidisci" title="Sociale + Intimidire contro la sua Volontà: chi esita perde un dado in attacco, chi ha paura scappa"><span>Intimidisci</span>${anteprima(intim, volB)}</button>`;

  const incantesimi = (cs.incantesimi ?? []).map((inc) => {
    const aSe = inc.tipo === 'potenziamento' || inc.tipo === 'cura';
    const motivo = perchéNonLanciabile(cs, inc, aSe ? undefined : bersaglio);
    const proibito = inc.prezzo ? ` · ${Object.entries(inc.prezzo).map(([k, v]) => `+${mezzi(v)} ${nome(k, c)}`).join(', ')}` : '';
    return `<button type="button" class="bottone incantesimo" data-az="lancia" data-id="${inc.id}" ${motivo ? `disabled title="${h(motivo)}"` : `title="${h(inc.descrizione)}"`}>
      ${h(inc.nome)} <small>${inc.livello} En${motivo ? '' : anteprimaIncantesimo(pg, inc, aSe ? undefined : bersaglio)}${h(proibito)}</small></button>`;
  }).join('');
  const reperti = (cs.reperti ?? []).map((r) => `<button type="button" class="bottone incantesimo" data-az="reperto" data-id="${r.id}" ${r.cariche > 0 ? '' : 'disabled'}>
      ${h(r.nome)} <small>${r.cariche} ${r.cariche === 1 ? 'carica' : 'cariche'}</small></button>`).join('');
  const consumabili = Object.entries(CONSUMABILI).map(([k, e]) => {
    const rimasti = (cs.consumabili[k] ?? 0) - (cs.usati[k] ?? 0);
    if ((cs.consumabili[k] ?? 0) === 0) return '';
    const ok = rimasti > 0 && usatiTot < MAX_CONSUMABILI_IN_COMBATTIMENTO;
    const cosa = e.pf ? `+${e.pf} PF` : `+${e.energia} Energia`;
    return `<button type="button" class="bottone" data-az="cura" data-id="${k}" ${ok ? '' : 'disabled'}>${h(nome(k, c))} ${cosa} <small>(${rimasti})</small></button>`;
  }).join('');

  const ultimoTiro = [...(cs.eventi ?? [])].reverse().find((e) => e.tiro || e.fissi !== undefined);
  const azioni = cs.finito
    ? `<div class="verdetto-box"><p class="verdetto ${cs.vinto ? 'vinto' : 'perso'}">${cs.vinto ? 'Vittoria' : 'Sconfitta'}</p>
       <div class="azioni-fondo"><button type="button" class="bottone primario" data-az="concludi">Prosegui</button></div></div>`
    : `<div class="barra-azioni">
        <p class="etichetta">Contro ${h(bersaglio?.nome ?? '')}</p>
        <div class="gruppo principali">${attacca}${intimidisci}</div>
        ${incantesimi ? `<p class="etichetta">Incantesimi · ${pg.energia} Energia</p><div class="gruppo">${incantesimi}</div>` : ''}
        ${reperti ? `<p class="etichetta">Reperti · Mentale + Tecnologia, con zero successi si guastano</p><div class="gruppo">${reperti}</div>` : ''}
        ${consumabili ? `<p class="etichetta">Consumabili · ${usatiTot}/${MAX_CONSUMABILI_IN_COMBATTIMENTO}</p><div class="gruppo">${consumabili}</div>` : ''}
      </div>`;

  return `<article class="scena combattimento">
    <div class="testa-scontro">
      <div class="testa">${etichetta(`Combattimento · round ${Math.min(cs.round, 99)}`, 'mana')}</div>
      <button type="button" class="bottone piccolo ritmo" data-az="ritmo" aria-pressed="${veloce}" title="Quanto dura la messa in scena di ogni round">${veloce ? 'Ritmo rapido' : 'Ritmo pieno'}</button>
    </div>
    <h2>${h(cs.nome)}</h2>
    <ol class="ordine-turno" aria-label="Ordine di iniziativa">${ordine}</ol>
    <div class="arena"><div class="arena-dentro">
      <div class="schieramento tuo">
        <div class="combattente pg" data-cid="${pg.id}">
          ${tavola(c.origini.find((o) => o.id === x.s.origine)?.immagine, { classe: 'ritratto piccolo' })}
          <div class="corpo">
            <div class="testa"><h3>${h(pg.nome)}</h3>${etichetta('Tu', 'velo')}</div>
            ${barraPF(pg)}
            ${conMagia ? barraEnergia(pg) : ''}
            ${statistiche(pg, conMagia)}
            ${chipEffetti(pg, c)}
          </div>
        </div>
      </div>
      <ul class="schieramento loro combattenti">${carte}</ul>
      <div class="tavolo" aria-hidden="true">${ultimoTiro ? tavoloEvento(cs, ultimoTiro) : '<p class="tavolo-vuoto">I dadi aspettano la tua mossa.</p>'}</div>
    </div></div>
    ${!cs.finito && vivi.length > 1 ? '<p class="suggerimento">Tocca un nemico per sceglierlo come bersaglio.</p>' : ''}
    <button type="button" class="bottone piccolo salta-scena" data-az="salta-scena">Salta ›</button>
    ${azioni}
    <section class="registro">${registro(cs)}</section>
  </article>`;
}

// ---------------------------------------------------------------- messa in scena

interface Riproduzione { saltata: boolean; sveglia: (() => void) | null }
let corrente: Riproduzione | null = null;

export function saltaScena(): void {
  if (!corrente) return;
  corrente.saltata = true;
  corrente.sveglia?.();
}

const calma = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function aspetta(r: Riproduzione, ms: number): Promise<void> {
  if (r.saltata) return Promise.resolve();
  return new Promise((ok) => {
    const t = setTimeout(() => { r.sveglia = null; ok(); }, ms * (veloce ? 0.45 : 1));
    r.sveglia = () => { clearTimeout(t); r.sveglia = null; ok(); };
  });
}

function impostaBarre(el: HTMLElement, cs: StatoCombattimento, pf: number[], energia: number, subito: boolean): void {
  cs.combattenti.forEach((cb, i) => {
    const carta = el.querySelector<HTMLElement>(`[data-cid="${CSS.escape(cb.id)}"]`);
    if (!carta) return;
    const v = pf[i] ?? cb.pf;
    const q = `scaleX(${Math.max(0, Math.min(1, v / cb.pfMax)).toFixed(3)})`;
    const barra = carta.querySelector<HTMLElement>('[data-pf]');
    const vivo = barra?.querySelector<HTMLElement>('.vivo');
    const scia = barra?.querySelector<HTMLElement>('.scia');
    if (barra && vivo && scia) {
      barra.classList.toggle('subito', subito);
      barra.classList.toggle('bassa', v / cb.pfMax < 0.4);
      vivo.style.transform = q;
      scia.style.transform = q;
    }
    const num = carta.querySelector('[data-pf-num]');
    if (num) num.textContent = `${v}/${cb.pfMax} PF`;
    if (cb.lato === 'pg') {
      const en = carta.querySelector<HTMLElement>('[data-en] .vivo');
      if (en) en.style.transform = `scaleX(${(cb.energiaMax ? Math.min(1, energia / cb.energiaMax) : 0).toFixed(3)})`;
      const enNum = carta.querySelector('[data-en-num]');
      if (enNum) enNum.textContent = `${energia}/${cb.energiaMax} Energia`;
    }
  });
}

function vola(carta: HTMLElement | null, testo: string, cls: string): void {
  if (!carta) return;
  const n = document.createElement('span');
  n.className = `numero-volante ${cls}`;
  n.textContent = testo;
  carta.appendChild(n);
  n.addEventListener('animationend', () => n.remove());
  setTimeout(() => n.remove(), 2500);
}

function scuoti(carta: HTMLElement | null, cls: string): void {
  if (!carta) return;
  carta.classList.remove(cls);
  void carta.offsetWidth; // riparte l'animazione
  carta.classList.add(cls);
}

function suonoEsito(ev: Evento): Suono | null {
  if (ev.tipo === 'dissonanza') return 'dissonanza';
  if (ev.danno !== undefined) return ev.caduto ? 'caduto' : 'colpo';
  if (ev.tipo === 'cura') return 'cura';
  if (ev.tipo === 'effetto') return 'magia';
  if (ev.tipo === 'fermo') return 'fermo';
  if (ev.tipo === 'intimidire') return ev.colpo ? 'minaccia' : 'fermo';
  if (ev.tipo === 'magia' || ev.tipo === 'reperto') return ev.colpo ? 'magia' : 'fermo';
  if (ev.tipo === 'attacco' && ev.colpo === false) return 'parata';
  return null;
}

/**
 * Mette in scena gli eventi dalla riga `daRiga` in poi. La vista è già disegnata con lo stato finale: qui si
 * riportano le barre a prima del round e si fa vedere un evento alla volta. Un clic su «Salta» porta alla fine.
 */
export async function riproduci(radice: HTMLElement, cs: StatoCombattimento, daRiga: number, effetto: (s: Suono) => void): Promise<void> {
  if (corrente) saltaScena();
  const el = radice.querySelector<HTMLElement>('.scena.combattimento');
  const eventi = (cs.eventi ?? []).filter((e) => e.riga >= daRiga);
  if (!el || !eventi.length) return;
  const r: Riproduzione = { saltata: false, sveglia: null };
  corrente = r;
  const tranquillo = calma();
  const prima = [...(cs.eventi ?? [])].reverse().find((e) => e.riga < daRiga);
  const carta = (id?: string) => (id ? el.querySelector<HTMLElement>(`[data-cid="${CSS.escape(id)}"]`) : null);

  // si torna a prima del round: barre, carte cadute, righe del registro, verdetto
  if (prima) impostaBarre(el, cs, prima.pf, prima.energia, true);
  // chi cade o scappa in questo round torna in piedi finché non tocca a lui
  const cadute = cs.combattenti.filter((cb, i) => !inPiedi(cb) && (prima?.pf[i] ?? 0) > 0
    && (!cb.fuggito || eventi.some((e) => e.contro === cb.id && e.fuga)));
  for (const cb of cadute) carta(cb.id)?.classList.remove('fuori');
  const righe = [...el.querySelectorAll<HTMLElement>('[data-riga]')].filter((li) => Number(li.dataset['riga']) >= daRiga);
  for (const li of righe) li.classList.add('in-attesa');
  el.classList.add('in-scena');
  const tavolo = el.querySelector<HTMLElement>('.tavolo')!;
  const finale = tavolo.innerHTML;
  const chiudi = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); saltaScena(); } };
  document.addEventListener('keydown', chiudi);

  try {
    for (const ev of eventi) {
      if (r.saltata || !el.isConnected) break;
      const chi = carta(ev.chi), contro = carta(ev.contro);
      chi?.classList.add('agisce');
      if (contro && contro !== chi) contro.classList.add('mirato');
      el.querySelectorAll('[data-ordine]').forEach((o) => o.classList.toggle('di-turno', (o as HTMLElement).dataset['ordine'] === ev.chi));

      if (ev.tiro || ev.fissi !== undefined) {
        tavolo.innerHTML = tavoloEvento(cs, ev);
        tavolo.classList.add('rotola');
        tavolo.classList.remove('fermo');
        effetto('dadi');
        if (!tranquillo) await girano(r, tavolo);
        tavolo.classList.remove('rotola');
        tavolo.classList.add('fermo');
        await aspetta(r, 380);
      }

      // l'esito
      const s = suonoEsito(ev);
      if (s) effetto(s);
      impostaBarre(el, cs, ev.pf, ev.energia, false);
      if (ev.danno !== undefined) {
        scuoti(contro, ev.caduto ? 'abbattuto' : 'colpito');
        vola(contro, `−${ev.danno}`, 'danno');
        if (ev.caduto) setTimeout(() => contro?.classList.add('fuori'), 450);
      } else if (ev.tipo === 'cura') vola(contro ?? chi, ev.cura !== undefined ? `+${ev.cura}` : '+En', 'cura');
      else if (ev.tipo === 'dissonanza') { scuoti(chi, 'colpito'); vola(chi, 'Dissonanza', 'male'); }
      else if (ev.tipo === 'effetto') vola(contro ?? chi, ev.nome ?? '', 'magia');
      else if (ev.tipo === 'fermo') vola(chi, 'Fermo', 'male');
      else if (ev.colpo === false) vola(contro, testoEsito(cs, ev, cs.combattenti.find((x) => x.id === ev.chi)), 'parato');
      else if (ev.fuga) { vola(contro, 'Scappa', 'magia'); setTimeout(() => contro?.classList.add('fuori'), 450); }
      else if (ev.colpo) vola(contro, testoEsito(cs, ev), 'magia');

      const li = el.querySelector<HTMLElement>(`[data-riga="${ev.riga}"]`);
      li?.classList.remove('in-attesa');
      li?.classList.add('appena');
      await aspetta(r, ev.tiro || ev.fissi !== undefined ? 700 : ev.tipo === 'info' ? 250 : 550);
      chi?.classList.remove('agisce');
      contro?.classList.remove('mirato');
    }
  } finally {
    document.removeEventListener('keydown', chiudi);
    if (corrente === r) corrente = null;
    if (el.isConnected) {
      // lo stato finale, comunque sia andata
      const ultimo = eventi[eventi.length - 1]!;
      impostaBarre(el, cs, ultimo.pf, ultimo.energia, r.saltata);
      for (const cb of cs.combattenti) if (!inPiedi(cb)) carta(cb.id)?.classList.add('fuori');
      for (const li of righe) li.classList.remove('in-attesa');
      el.querySelectorAll('.agisce, .mirato, .di-turno').forEach((n) => n.classList.remove('agisce', 'mirato', 'di-turno'));
      tavolo.classList.remove('rotola');
      tavolo.classList.add('fermo');
      if (r.saltata) tavolo.innerHTML = finale;
      el.classList.remove('in-scena');
      if (cs.finito) {
        el.classList.add('epilogo');
        effetto(cs.vinto ? 'vittoria' : 'sconfitta');
      }
    }
  }
}

/** Le facce cambiano a caso per un attimo, poi si fermano su quelle vere (che il tavolo ha già). */
async function girano(r: Riproduzione, tavolo: HTMLElement): Promise<void> {
  const dadi = [...tavolo.querySelectorAll<HTMLElement>('.dado')];
  const vere = dadi.map((d) => d.outerHTML);
  const giri = 6;
  for (let g = 0; g < giri && !r.saltata; g++) {
    dadi.forEach((d, i) => {
      if (g > giri - 2 - (i % 3)) return; // si fermano uno dopo l'altro
      const tmp = document.createElement('span');
      tmp.innerHTML = dado(1 + Math.floor(Math.random() * 6));
      const nuovo = tmp.firstElementChild as HTMLElement;
      d.className = `${nuovo.className} gira`;
      d.innerHTML = nuovo.innerHTML;
    });
    await aspetta(r, 65);
  }
  dadi.forEach((d, i) => { d.outerHTML = vere[i]!; });
}
