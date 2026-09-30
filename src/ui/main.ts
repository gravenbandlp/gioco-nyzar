// Interfaccia del prototipo: HTML generato da stringhe, eventi delegati su [data-az].
import './stile.css';
import { CONTENUTI as c } from '../dati/contenuti';
import {
  ATTRIBUTI, ABILITA, NEGATIVE, MAX_NEGATIVA, SOGLIA_PERICOLO, CANDELE_MAX, CODA_MAX, MANO_MAX,
  MAX_CONSUMABILI_IN_COMBATTIMENTO, NOMI,
} from '../motore/regole';
import type { TStorylet } from '../motore/contenuto';
import {
  nuovoPersonaggio, aggiornaTempo, msAllaProssimaCandela, msAllaProssimaCarta, storyletDisponibili, pesca, scarta,
  progressoPE, requisitiSoddisfatti, type Stato,
} from '../motore/personaggio';
import {
  anteprima, scegli, concludiCombattimento, puoEntrare, muovi, compra, vendi, type Risultato,
} from '../motore/azioni';
import { round, inPiedi, CURE, type StatoCombattimento } from '../motore/combattimento';
import { h, mezzi, segno, durata, percentuale, nome, requisitoLeggibile } from './formato';

// ---------------------------------------------------------------- stato dell'interfaccia

type Vista =
  | { tipo: 'area' }
  | { tipo: 'storylet'; id: string }
  | { tipo: 'risultato'; id: string; risultato: Risultato }
  | { tipo: 'combattimento'; id: string; indice: number; cs: StatoCombattimento }
  | { tipo: 'negozio'; id: string };

interface Salvataggio { stato: Stato; vista: Vista }

const CHIAVE = 'gioco-nyzar/prototipo/v1';
const AREA_INIZIALE = 'citta-bassa';

let stato: Stato | null = null;
let vista: Vista = { tipo: 'area' };
let origineScelta = c.origini[0]!.id;
let confermaNuovo = false;
let avviso = '';

const app = document.getElementById('app')!;

function salva(): void {
  try {
    if (stato) localStorage.setItem(CHIAVE, JSON.stringify({ stato, vista } satisfies Salvataggio));
    else localStorage.removeItem(CHIAVE);
  } catch { /* la memoria del browser può non esserci: si gioca lo stesso */ }
}

function carica(dati?: Partial<Salvataggio>): void {
  let s = dati;
  if (!s?.stato) {
    try {
      const grezzo = localStorage.getItem(CHIAVE);
      if (grezzo) s = JSON.parse(grezzo) as Salvataggio;
    } catch { s = undefined; }
  }
  if (s?.stato?.versione === 1) {
    stato = s.stato;
    vista = s.vista ?? { tipo: 'area' };
  }
}

const trova = (id: string): TStorylet | undefined => c.storylet.find((x) => x.id === id);
const area = () => c.aree.find((a) => a.id === stato!.area)!;

// ---------------------------------------------------------------- pezzi grafici

function candela(accesa: boolean): string {
  return `<span class="candela${accesa ? ' accesa' : ''}" aria-hidden="true"><i></i></span>`;
}

function dado(f: number): string {
  // posizioni dei punti su una griglia 3×3 (0–8)
  const punti: Record<number, number[]> = { 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const celle = Array.from({ length: 9 }, (_, i) => `<b${punti[f]!.includes(i) ? ' class="p"' : ''}></b>`).join('');
  return `<span class="dado${f >= 4 ? ' ok' : ''}" role="img" aria-label="${f}">${celle}</span>`;
}

function pallini(v: number, max = 5): string {
  return `<span class="pallini" aria-label="${v} su ${max}">${Array.from({ length: max }, (_, i) => `<i${i < v ? ' class="on"' : ''}></i>`).join('')}</span>`;
}

function barraPE(chiave: string): string {
  const { pe, soglia } = progressoPE(stato!, chiave);
  if (!soglia) return '<span class="pe max">max</span>';
  const q = Math.min(1, pe / soglia);
  return `<span class="pe" title="${mezzi(Math.round(pe * 4) / 4)} / ${soglia} PE"><i style="width:${(q * 100).toFixed(1)}%"></i></span>`;
}

function tacche(v: number): string {
  // 16 tacche = 0–8 a mezzi punti
  const n = Math.round(v * 2);
  return `<span class="tacche">${Array.from({ length: MAX_NEGATIVA * 2 }, (_, i) => `<i class="${i < n ? 'on' : ''}${i % 2 ? ' dx' : ''}"></i>`).join('')}</span>`;
}

function descriviArma(id: string): string {
  const a = c.armi.find((x) => x.id === id);
  if (!a) return id;
  const extra = [`${NOMI[a.abilita]}`, `danno +${a.danno}`, ...a.proprieta].join(' · ');
  return `${h(a.nome)} <small>${h(extra)}</small>`;
}

function descriviArmatura(id: string): string {
  const a = c.armature.find((x) => x.id === id);
  if (!a) return id;
  const pen = Object.entries(a.penalita).map(([k, v]) => `${NOMI[k]} ${v}`);
  const extra = [`riduzione ${a.riduzione}`, ...pen].join(' · ');
  return `${h(a.nome)} <small>${h(extra)}</small>`;
}

// ---------------------------------------------------------------- creazione

function vistaCreazione(): string {
  const o = c.origini.find((x) => x.id === origineScelta)!;
  const schede = c.origini
    .map((x) => {
      const top = Object.entries(x.abilita).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => NOMI[k]).join(', ');
      return `<button type="button" class="origine${x.id === origineScelta ? ' scelta' : ''}" data-az="origine" data-id="${x.id}" aria-pressed="${x.id === origineScelta}">
        <strong>${h(x.nome)}</strong>
        <span class="attr">${ATTRIBUTI.map((a) => `${NOMI[a]!.slice(0, 3)} ${x.attributi[a] ?? 1}`).join(' · ')}</span>
        <span class="top">${h(top)}</span>
      </button>`;
    })
    .join('');
  const abil = Object.entries(o.abilita).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const beni = Object.entries(o.quality).map(([k, v]) => `${h(nome(k, c))}${k === 'monete' || v !== 1 ? ` ${mezzi(v)}` : ''}`).join(', ');
  return `
  <main class="creazione">
    <header class="frontespizio">
      <p class="occhiello">Superficie Fratturata di Ny'Zar</p>
      <h1>Qir-Azel</h1>
      <p class="sottotitolo">Tre giorni dopo il Festival delle Foglie Alate. La Città Bassa ripete una parola che nessuno sa pronunciare.</p>
    </header>
    <section class="scelta-origine" aria-labelledby="t-origine">
      <h2 id="t-origine">Da dove vieni</h2>
      <div class="origini">${schede}</div>
      <article class="dettaglio-origine">
        <h3>${h(o.nome)}</h3>
        <p class="narrativa">${h(o.testo)}</p>
        <dl class="scheda-breve">
          ${ATTRIBUTI.map((a) => `<div><dt>${NOMI[a]}</dt><dd>${pallini(o.attributi[a] ?? 1)}</dd></div>`).join('')}
        </dl>
        <p class="abilita-origine">${abil.map(([k, v]) => `<span>${h(NOMI[k])} <b>${v}</b></span>`).join('')}</p>
        <p class="dotazione"><span>Arma</span> ${descriviArma(o.arma)}<br><span>Armatura</span> ${descriviArmatura(o.armatura)}<br><span>Con te</span> ${beni || 'niente'}</p>
      </article>
      <form class="nome" data-form="crea">
        <label for="nome-pg">Il tuo nome</label>
        <div class="riga">
          <input id="nome-pg" name="nome" maxlength="40" autocomplete="off" placeholder="Come ti chiamano nei vicoli" required>
          <button type="submit" class="primario">Scendi in città</button>
        </div>
      </form>
    </section>
  </main>`;
}

// ---------------------------------------------------------------- scheda del personaggio

function vistaScheda(): string {
  const s = stato!;
  const attributi = ATTRIBUTI.map((a) => {
    const abil = ABILITA[a].filter((k) => (s.abilita[k] ?? 0) > 0 || (s.pe[k] ?? 0) > 0);
    const resto = ABILITA[a].filter((k) => !abil.includes(k));
    const riga = (k: string) => `<li><span>${h(NOMI[k])}</span>${pallini(s.abilita[k] ?? 0)}${barraPE(k)}</li>`;
    return `<section class="attributo">
      <h4><span>${NOMI[a]}</span>${pallini(s.attributi[a])}${barraPE(a)}</h4>
      <ul>${abil.map(riga).join('')}</ul>
      ${resto.length ? `<details><summary>altre ${resto.length}</summary><ul>${resto.map(riga).join('')}</ul></details>` : ''}
    </section>`;
  }).join('');

  const negative = NEGATIVE.map((k) => {
    const v = s.quality[k] ?? 0;
    const cls = v >= MAX_NEGATIVA ? 'crisi' : v >= SOGLIA_PERICOLO ? 'pericolo' : '';
    return `<li class="${cls}"><span>${h(nome(k, c))}</span>${tacche(v)}<b>${mezzi(v)}</b></li>`;
  }).join('');

  const perCategoria = (cat: string) => c.quality.filter((q) => q.categoria === cat && (s.quality[q.id] ?? 0) !== 0);
  const reputazioni = perCategoria('reputazione')
    .map((q) => { const v = s.quality[q.id]!; return `<li><span>${h(q.nome)}</span><b class="${v < 0 ? 'neg' : 'pos'}">${segno(v)}</b></li>`; }).join('');
  const famiglie = new Map<string, string[]>();
  for (const q of perCategoria('bene')) {
    const f = q.famiglia ?? 'Altro';
    famiglie.set(f, [...(famiglie.get(f) ?? []), `<li><span>${h(q.nome)}</span><b>${mezzi(s.quality[q.id]!)}</b></li>`]);
  }
  const beni = [...famiglie].map(([f, righe]) => `<li class="famiglia">${h(f)}</li>${righe.join('')}`).join('');
  const varie = [...perCategoria('consumabile'), ...perCategoria('accesso')]
    .map((q) => `<li title="${h(q.descrizione ?? '')}"><span>${h(q.nome)}</span><b>${q.categoria === 'accesso' ? '✓' : mezzi(s.quality[q.id]!)}</b></li>`).join('');
  const piste = perCategoria('pista').map((q) => `<li><span>${h(q.nome)}</span><b>${mezzi(s.quality[q.id]!)}</b></li>`).join('');

  return `<aside class="scheda" aria-label="Scheda del personaggio">
    <div class="identita">
      <h2>${h(s.nome)}</h2>
      <p>${h(c.origini.find((o) => o.id === s.origine)?.nome ?? '')}</p>
      <p class="borsa"><span class="moneta" aria-hidden="true"></span><b>${mezzi(s.quality['monete'] ?? 0)}</b> monete di lyssan</p>
      <p class="equip"><span>Arma</span> ${descriviArma(s.arma)}</p>
      <p class="equip"><span>Armatura</span> ${descriviArmatura(s.armatura)}</p>
    </div>
    <h3>Attributi e abilità</h3>
    ${attributi}
    <h3>Statistiche negative</h3>
    <ul class="negative">${negative}</ul>
    ${piste ? `<h3>Storie in corso</h3><ul class="elenco">${piste}</ul>` : ''}
    ${reputazioni ? `<h3>Reputazione</h3><ul class="elenco">${reputazioni}</ul>` : ''}
    ${beni ? `<h3>Beni</h3><ul class="elenco">${beni}</ul>` : ''}
    ${varie ? `<h3>Con te</h3><ul class="elenco">${varie}</ul>` : ''}
    <div class="strumenti">
      <button type="button" data-az="ricarica" class="piccolo">Riaccendi le candele (test)</button>
      <button type="button" data-az="nuovo" class="piccolo${confermaNuovo ? ' pericolo' : ''}">${confermaNuovo ? 'Sicuro? Il personaggio va perso' : 'Nuovo personaggio'}</button>
    </div>
  </aside>`;
}

// ---------------------------------------------------------------- testata

function vistaTestata(): string {
  const s = stato!;
  const ora = Date.now();
  const prossima = msAllaProssimaCandela(s, ora);
  const candele = Array.from({ length: CANDELE_MAX }, (_, i) => candela(i < s.candele)).join('');
  return `<header class="testata">
    <div class="luogo"><span class="citta">Qir-Azel</span><span class="nome-area">${h(area().nome)}</span></div>
    <div class="candele" aria-label="Candele: ${s.candele} su ${CANDELE_MAX}">
      <div class="fila">${candele}</div>
      <p><b>${s.candele}</b>/${CANDELE_MAX} candele <span class="timer" data-timer="candela">${prossima === null ? 'tutte accese' : `la prossima tra ${durata(prossima)}`}</span></p>
    </div>
  </header>`;
}

// ---------------------------------------------------------------- area

function schedaStorylet(st: TStorylet, carta = false): string {
  const breve = st.testo.split(/(?<=[.!?»])\s/)[0] ?? st.testo;
  const tipo = carta ? 'Carta' : st.ripetibile ? 'Ripetibile' : 'Storia';
  return `<li class="voce ${carta ? 'carta' : st.ripetibile ? 'ripetibile' : 'storia'}">
    <button type="button" data-az="apri" data-id="${st.id}">
      <span class="etichetta">${tipo}</span>
      <strong>${h(st.titolo)}</strong>
      ${st.luogo ? `<em>${h(st.luogo)}</em>` : ''}
      <span class="breve">${h(breve)}</span>
    </button>
    ${carta ? `<button type="button" class="scarta" data-az="scarta" data-id="${st.id}" aria-label="Scarta ${h(st.titolo)}">Scarta</button>` : ''}
  </li>`;
}

function vistaArea(): string {
  const s = stato!;
  const a = area();
  const disponibili = storyletDisponibili(s, c);
  const storie = disponibili.filter((x) => !x.ripetibile);
  const ripetibili = disponibili.filter((x) => x.ripetibile);
  const mano = s.mano.map(trova).filter((x): x is TStorylet => !!x);
  const ora = Date.now();
  const prossimaCarta = msAllaProssimaCarta(s, ora);
  const puoPescare = s.coda > 0 && s.mano.length < MANO_MAX;
  const crisi = NEGATIVE.filter((k) => (s.quality[k] ?? 0) >= MAX_NEGATIVA);

  const negozi = a.negozi.map((id) => c.negozi.find((n) => n.id === id)!).map((n) =>
    `<li><button type="button" data-az="negozio" data-id="${n.id}"><strong>${h(n.nome)}</strong><span>${h(n.testo)}</span></button></li>`).join('');

  const viaggi = c.aree.filter((x) => x.id !== a.id).map((x) => {
    const p = puoEntrare(s, x.id, c);
    const info = !p.ok ? p.motivo! : p.gabella ? `Gabella: ${p.gabella} monete` : 'Nessuna gabella';
    return `<li><button type="button" data-az="vai" data-id="${x.id}" ${p.ok ? '' : 'disabled'}><strong>${h(x.nome)}</strong><span>${h(info)}</span></button></li>`;
  }).join('');

  return `<section class="area">
    ${crisi.length ? `<p class="banda crisi">${crisi.map((k) => nome(k, c)).join(', ')} al massimo. Nel gioco completo qui scatta una crisi; nel prototipo non è ancora scritta, ma conviene rimediare.</p>` : ''}
    <header class="intestazione-area">
      <h1>${h(a.nome)}</h1>
      <p class="narrativa">${h(a.testo)}</p>
    </header>
    ${storie.length ? `<h2>La tua storia</h2><ul class="voci">${storie.map((x) => schedaStorylet(x)).join('')}</ul>` : ''}
    <h2>Cose da fare</h2>
    <ul class="voci">${ripetibili.map((x) => schedaStorylet(x)).join('')}</ul>
    <h2>Occasioni <small>${mano.length}/${MANO_MAX} in mano · ${s.coda}/${CODA_MAX} nel mazzo</small></h2>
    ${mano.length ? `<ul class="voci mano">${mano.map((x) => schedaStorylet(x, true)).join('')}</ul>` : '<p class="vuoto">Nessuna occasione in mano. La città ne offre sempre qualcuna.</p>'}
    <p class="pesca">
      <button type="button" data-az="pesca" ${puoPescare ? '' : 'disabled'}>Pesca un'occasione</button>
      <span class="timer" data-timer="carta">${prossimaCarta === null ? 'Il mazzo è pieno.' : `Nuova occasione nel mazzo tra ${durata(prossimaCarta)}.`}</span>
    </p>
    ${negozi ? `<h2>Botteghe</h2><ul class="luoghi">${negozi}</ul>` : ''}
    <h2>Altrove in città</h2>
    <ul class="luoghi">${viaggi}</ul>
  </section>`;
}

// ---------------------------------------------------------------- storylet

function vistaStorylet(id: string): string {
  const s = stato!;
  const st = trova(id);
  if (!st) return vistaArea();
  const opzioni = st.opzioni.map((o, i) => {
    const a = anteprima(s, o, c);
    const righe: string[] = [];
    if (a.prova) {
      const attr = o.prova!.attributo;
      righe.push(`<span class="prova"><span>${NOMI[attr]} ${s.attributi[attr]} + ${h(NOMI[a.prova.abilita])} ${a.prova.pool - s.attributi[attr]}</span>
        <span>${a.prova.pool} dadi, ${a.prova.richiesti} ${a.prova.richiesti === 1 ? 'successo' : 'successi'}</span>
        <span class="diff">${h(a.prova.difficolta)}</span>
        <b class="prob">${percentuale(a.prova.probabilita)}</b></span>`);
    }
    if (a.combattimento) {
      const sc = c.scontri.find((x) => x.id === o.combattimento)!;
      const nemici = sc.nemici.map((n) => c.nemici.find((x) => x.id === n)!.nome).join(', ');
      righe.push(`<span class="prova"><span>Combattimento: ${h(nemici)}</span><span class="diff">${h(a.combattimento.etichetta)}</span>
        <b class="prob">${percentuale(a.combattimento.probabilita)}</b></span>`);
    }
    const mancanti = a.mancanti.map((r) => `<li>${h(requisitoLeggibile(r, s, c))}</li>`).join('');
    const costo = a.costo === 0 ? 'Gratis' : `${a.costo} ${a.costo === 1 ? 'candela' : 'candele'}`;
    return `<li class="opzione${a.disponibile ? '' : ' chiusa'}">
      <div class="testo-opzione">
        <strong>${h(o.testo)}</strong>
        ${o.descrizione ? `<p>${h(o.descrizione)}</p>` : ''}
        ${righe.join('')}
        ${mancanti ? `<ul class="mancanti">${mancanti}</ul>` : ''}
        ${a.motivo ? `<p class="mancanti">${h(a.motivo)}</p>` : ''}
      </div>
      <button type="button" class="primario" data-az="scegli" data-id="${st.id}" data-i="${i}" ${a.disponibile ? '' : 'disabled'}>
        <span>Vai</span><small>${costo}</small>
      </button>
    </li>`;
  }).join('');
  const carta = st.tipo === 'carta';
  return `<article class="storylet">
    <p class="ritorno"><button type="button" class="link" data-az="area">← ${h(area().nome)}</button></p>
    <header>
      <p class="occhiello">${carta ? 'Occasione' : st.ripetibile ? 'Azione ripetibile' : 'Storia'}${st.luogo ? ` · ${h(st.luogo)}` : ''}</p>
      <h1>${h(st.titolo)}</h1>
    </header>
    <p class="narrativa">${h(st.testo)}</p>
    <ul class="opzioni">${opzioni}</ul>
  </article>`;
}

// ---------------------------------------------------------------- risultato

function vistaRisultato(id: string, r: Risultato): string {
  const s = stato!;
  const st = trova(id);
  const esito = r.riuscito === undefined ? '' : `<p class="verdetto ${r.riuscito ? 'ok' : 'ko'}">${r.riuscito ? 'Riuscito' : 'Fallito'}</p>`;
  const tiro = r.tiro
    ? `<div class="tiro"><div class="dadi">${r.tiro.facce.map(dado).join('')}</div>
        <p>${r.tiro.successi} ${r.tiro.successi === 1 ? 'successo' : 'successi'} su ${r.tiro.richiesti} richiesti · ${h(NOMI[r.tiro.abilita])} · probabilità ${percentuale(r.tiro.probabilita)}</p></div>`
    : '';
  const variazioni = r.variazioni.map((v) => {
    const d = v.dopo - v.prima;
    const q = c.quality.find((x) => x.id === v.chiave);
    const negativa = q?.categoria === 'negativa';
    const buono = negativa ? d < 0 : d > 0;
    return `<li class="${buono ? 'bene' : 'male'}"><span>${h(nome(v.chiave, c))}</span><b>${segno(d)}</b><small>ora ${mezzi(v.dopo)}</small></li>`;
  }).join('');
  const crescite = r.crescite.map((x) => `<li class="${x.nuovoLivello ? 'livello' : ''}"><span>${h(NOMI[x.chiave] ?? x.chiave)}</span><b>+${mezzi(Math.round(x.pe * 4) / 4)} PE</b>${x.nuovoLivello ? `<small>sale a ${x.nuovoLivello}!</small>` : ''}</li>`).join('');
  const ancora = st && (st.tipo === 'carta' ? s.mano.includes(st.id) : storyletDisponibili(s, c).some((x) => x.id === st.id));
  const segue = r.segue ? trova(r.segue) : undefined;
  return `<article class="storylet risultato">
    <header>
      <p class="occhiello">${h(st?.titolo ?? '')}</p>
      ${esito}
    </header>
    ${tiro}
    <p class="narrativa">${h(r.testo)}</p>
    ${variazioni ? `<ul class="variazioni">${variazioni}</ul>` : ''}
    ${crescite ? `<h2 class="piccolo">Esperienza</h2><ul class="variazioni crescite">${crescite}</ul>` : ''}
    <p class="azioni-risultato">
      ${segue ? `<button type="button" class="primario" data-az="apri" data-id="${segue.id}">Continua</button>` : ''}
      ${ancora ? `<button type="button" data-az="apri" data-id="${st!.id}">Ancora</button>` : ''}
      <button type="button" class="${segue ? '' : 'primario'}" data-az="area">Torna: ${h(area().nome)}</button>
    </p>
  </article>`;
}

// ---------------------------------------------------------------- combattimento

function barraPF(x: { pf: number; pfMax: number }): string {
  const q = x.pf / x.pfMax;
  return `<span class="pf${q < 0.4 ? ' basso' : ''}"><i style="width:${(q * 100).toFixed(1)}%"></i></span><b>${x.pf}/${x.pfMax}</b>`;
}

function vistaCombattimento(v: Extract<Vista, { tipo: 'combattimento' }>): string {
  const cs = v.cs;
  const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
  const nemici = cs.combattenti.filter((x) => x.lato === 'nemico');
  const usatiTot = Object.values(cs.usati).reduce((a, b) => a + b, 0);
  const righeNemici = nemici.map((n) => {
    const attivo = inPiedi(n) && !cs.finito;
    const stato = n.fuggito ? 'fuggito' : n.pf === 0 ? 'a terra' : n.malus ? 'esita' : '';
    return `<li class="combattente${attivo ? '' : ' fuori'}">
      <div class="nome-c"><strong>${h(n.nome)}</strong>${stato ? `<em>${stato}</em>` : ''}</div>
      <div class="barra-c">${barraPF(n)}</div>
      ${attivo ? `<div class="mosse">
        <button type="button" class="primario" data-az="attacca" data-id="${n.id}">Attacca</button>
        <button type="button" data-az="intimidisci" data-id="${n.id}">Intimidisci</button>
      </div>` : ''}
    </li>`;
  }).join('');
  const cure = Object.keys(CURE).map((k) => {
    const rimasti = (cs.consumabili[k] ?? 0) - (cs.usati[k] ?? 0);
    const ok = rimasti > 0 && usatiTot < MAX_CONSUMABILI_IN_COMBATTIMENTO && !cs.finito;
    return `<button type="button" data-az="cura" data-id="${k}" ${ok ? '' : 'disabled'}>${h(nome(k, c))} (+${CURE[k]} PF) · ${rimasti}</button>`;
  }).join('');
  const log = cs.log.slice(-14).map((l) => `<li>${h(l)}</li>`).join('');
  return `<article class="storylet combattimento">
    <header>
      <p class="occhiello">Combattimento · round ${Math.min(cs.round, 99)}</p>
      <h1>${h(cs.nome)}</h1>
    </header>
    <ul class="combattenti">
      <li class="combattente pg"><div class="nome-c"><strong>${h(pg.nome)}</strong><em>tu</em></div><div class="barra-c">${barraPF(pg)}</div></li>
      ${righeNemici}
    </ul>
    ${cs.finito
      ? `<p class="verdetto ${cs.vinto ? 'ok' : 'ko'}">${cs.vinto ? 'Vittoria' : 'Sconfitta'}</p>
         <p class="azioni-risultato"><button type="button" class="primario" data-az="concludi">Continua</button></p>`
      : `<div class="cure"><span>Curarsi (${usatiTot}/${MAX_CONSUMABILI_IN_COMBATTIMENTO} usati)</span>${cure}</div>`}
    <ol class="registro" aria-live="polite">${log}</ol>
  </article>`;
}

// ---------------------------------------------------------------- negozio

function vistaNegozio(id: string): string {
  const s = stato!;
  const n = c.negozi.find((x) => x.id === id)!;
  const monete = s.quality['monete'] ?? 0;
  const vende = n.vende.map((v) => {
    let etichetta: string; let posseduto = false;
    if (v.quality.startsWith('arma.')) { etichetta = descriviArma(v.quality.slice(5)); posseduto = s.arma === v.quality.slice(5); }
    else if (v.quality.startsWith('armatura.')) { etichetta = descriviArmatura(v.quality.slice(9)); posseduto = s.armatura === v.quality.slice(9); }
    else {
      const q = c.quality.find((x) => x.id === v.quality);
      etichetta = `${h(q?.nome ?? v.quality)} <small>${h(q?.descrizione ?? '')} · ne hai ${mezzi(s.quality[v.quality] ?? 0)}</small>`;
    }
    const ok = monete >= v.prezzo && !posseduto;
    return `<li><span class="merce">${etichetta}</span><b class="prezzo">${v.prezzo}</b>
      <button type="button" data-az="compra" data-neg="${n.id}" data-id="${v.quality}" ${ok ? '' : 'disabled'}>${posseduto ? 'Equipaggiato' : 'Compra'}</button></li>`;
  }).join('');
  const compra = n.compra.map((v) => {
    const hai = s.quality[v.quality] ?? 0;
    const q = c.quality.find((x) => x.id === v.quality);
    return `<li><span class="merce">${h(q?.nome ?? v.quality)} <small>ne hai ${mezzi(hai)}</small></span><b class="prezzo">${v.prezzo}</b>
      <span class="doppio"><button type="button" data-az="vendi" data-neg="${n.id}" data-id="${v.quality}" data-n="1" ${hai >= 1 ? '' : 'disabled'}>Vendi 1</button>
      <button type="button" data-az="vendi" data-neg="${n.id}" data-id="${v.quality}" data-n="tutti" ${hai >= 2 ? '' : 'disabled'}>Tutti</button></span></li>`;
  }).join('');
  return `<article class="storylet negozio">
    <p class="ritorno"><button type="button" class="link" data-az="area">← ${h(area().nome)}</button></p>
    <header><p class="occhiello">Bottega</p><h1>${h(n.nome)}</h1></header>
    <p class="narrativa">${h(n.testo)}</p>
    <p class="borsa"><span class="moneta" aria-hidden="true"></span><b>${mezzi(monete)}</b> monete di lyssan</p>
    ${vende ? `<h2>In vendita</h2><ul class="listino">${vende}</ul>` : ''}
    ${compra ? `<h2>Compra da te</h2><ul class="listino">${compra}</ul>` : ''}
  </article>`;
}

// ---------------------------------------------------------------- rendering

function render(): void {
  if (!stato) { app.innerHTML = vistaCreazione(); return; }
  aggiornaTempo(stato, Date.now());
  let centro: string;
  switch (vista.tipo) {
    case 'storylet': centro = vistaStorylet(vista.id); break;
    case 'risultato': centro = vistaRisultato(vista.id, vista.risultato); break;
    case 'combattimento': centro = vistaCombattimento(vista); break;
    case 'negozio': centro = vistaNegozio(vista.id); break;
    default: centro = vistaArea();
  }
  app.innerHTML = `${vistaTestata()}
    ${avviso ? `<p class="banda avviso" role="status">${h(avviso)}</p>` : ''}
    <div class="gioco"><main class="centro">${centro}</main>${vistaScheda()}</div>`;
  avviso = '';
}

function cambia(v: Vista): void {
  vista = v;
  confermaNuovo = false;
  salva();
  render();
  window.scrollTo({ top: 0 });
}

// ---------------------------------------------------------------- azioni

function azione(az: string, el: HTMLElement): void {
  const id = el.dataset['id'] ?? '';
  const s = stato;
  if (az === 'origine') { origineScelta = id; const nomeAttuale = (document.getElementById('nome-pg') as HTMLInputElement | null)?.value ?? ''; render(); const inp = document.getElementById('nome-pg') as HTMLInputElement | null; if (inp) inp.value = nomeAttuale; return; }
  if (!s) return;
  const ora = Date.now();
  switch (az) {
    case 'area': cambia({ tipo: 'area' }); break;
    case 'apri': if (trova(id)) cambia({ tipo: 'storylet', id }); break;
    case 'negozio': cambia({ tipo: 'negozio', id }); break;
    case 'scegli': {
      const st = trova(id);
      if (!st) break;
      const indice = Number(el.dataset['i']);
      const r = scegli(s, st, indice, c, ora);
      if (r.tipo === 'errore') { avviso = r.messaggio; render(); }
      else if (r.tipo === 'combattimento') cambia({ tipo: 'combattimento', id, indice, cs: r.combattimento });
      else cambia({ tipo: 'risultato', id, risultato: r.risultato });
      break;
    }
    case 'attacca': case 'intimidisci': case 'cura': {
      if (vista.tipo !== 'combattimento') break;
      const a = az === 'cura' ? { tipo: 'cura' as const, consumabile: id } : { tipo: az === 'attacca' ? 'attacco' as const : 'intimidire' as const, bersaglio: id };
      round(vista.cs, a);
      salva();
      render();
      break;
    }
    case 'concludi': {
      if (vista.tipo !== 'combattimento') break;
      const st = trova(vista.id)!;
      const r = concludiCombattimento(s, st, vista.indice, vista.cs, c);
      cambia({ tipo: 'risultato', id: vista.id, risultato: r });
      break;
    }
    case 'pesca': {
      const presa = pesca(s, c, ora);
      if (!presa) avviso = 'Non ci sono occasioni da pescare adesso.';
      salva(); render();
      break;
    }
    case 'scarta': scarta(s, id); salva(); render(); break;
    case 'vai': {
      if (muovi(s, id, c)) cambia({ tipo: 'area' });
      else { avviso = puoEntrare(s, id, c).motivo ?? 'Non puoi andarci.'; render(); }
      break;
    }
    case 'compra': {
      if (!compra(s, el.dataset['neg']!, id, c)) avviso = 'Non basta il denaro.';
      salva(); render();
      break;
    }
    case 'vendi': {
      const quanti = el.dataset['n'] === 'tutti' ? Math.floor(s.quality[id] ?? 0) : 1;
      for (let i = 0; i < quanti; i++) vendi(s, el.dataset['neg']!, id, c);
      salva(); render();
      break;
    }
    case 'ricarica': s.candele = CANDELE_MAX; s.candeleAl = ora; s.coda = CODA_MAX; s.codaAl = ora; salva(); render(); break;
    case 'nuovo': {
      if (!confermaNuovo) { confermaNuovo = true; render(); break; }
      stato = null; vista = { tipo: 'area' }; confermaNuovo = false; salva(); render();
      break;
    }
  }
}

app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-az]');
  if (!el || (el as HTMLButtonElement).disabled) return;
  azione(el.dataset['az']!, el);
});

app.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  if (form.dataset['form'] !== 'crea') return;
  const nomePg = String(new FormData(form).get('nome') ?? '').trim();
  if (!nomePg) return;
  const o = c.origini.find((x) => x.id === origineScelta)!;
  stato = nuovoPersonaggio(nomePg, o, Date.now(), AREA_INIZIALE);
  cambia({ tipo: 'area' });
});

// Candele e mazzo si ricaricano col tempo: ogni secondo aggiorno i timer,
// e ridisegno tutto solo quando cambia davvero qualcosa.
setInterval(() => {
  if (!stato) return;
  const prima = `${stato.candele}|${stato.coda}`;
  const ora = Date.now();
  aggiornaTempo(stato, ora);
  if (`${stato.candele}|${stato.coda}` !== prima) { salva(); if (vista.tipo !== 'combattimento') render(); return; }
  const tc = app.querySelector('[data-timer="candela"]');
  const pc = msAllaProssimaCandela(stato, ora);
  if (tc) tc.textContent = pc === null ? 'tutte accese' : `la prossima tra ${durata(pc)}`;
  const tk = app.querySelector('[data-timer="carta"]');
  const pk = msAllaProssimaCarta(stato, ora);
  if (tk) tk.textContent = pk === null ? 'Il mazzo è pieno.' : `Nuova occasione nel mazzo tra ${durata(pk)}.`;
}, 1000);

// ---------------------------------------------------------------- avvio
interface Hot { snapshot?: (f: () => unknown) => void; ready?: (f: (d: unknown) => void) => void; data?: unknown }
const hot = (window as unknown as { claude?: { hot?: Hot } }).claude?.hot;
hot?.snapshot?.(() => ({ stato, vista }));
const avvia = (dati: unknown) => { carica(dati as Partial<Salvataggio> | undefined); render(); };
if (hot?.ready) hot.ready(avvia);
else avvia(hot?.data);

// requisitiSoddisfatti resta esportato per il debug dalla console
(window as unknown as Record<string, unknown>)['nyzar'] = { get stato() { return stato; }, contenuti: c, requisitiSoddisfatti };
