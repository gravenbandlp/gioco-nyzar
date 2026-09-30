// Interfaccia del prototipo: stato, salvataggio, eventi. L'HTML sta in viste.ts.
import './stile.css';
import { CONTENUTI as c } from '../dati/contenuti';
import { CANDELE_MAX, CODA_MAX } from '../motore/regole';
import type { TFrammento } from '../motore/contenuto';
import {
  nuovoPersonaggio, aggiornaTempo, msAllaProssimaCandela, msAllaProssimaCarta, pesca, scarta, type Stato,
} from '../motore/personaggio';
import { scegli, concludiCombattimento, puoEntrare, muovi, compra, vendi } from '../motore/azioni';
import { round } from '../motore/combattimento';
import { durata } from './formato';
import {
  pagina, storia, personaggio, averi, bazar, mappa, creazione, type Contesto, type Scheda, type Vista,
} from './viste';

interface Salvataggio { stato: Stato; vista: Vista; scheda?: Scheda }

const CHIAVE = 'gioco-nyzar/prototipo/v1';
const AREA_INIZIALE = 'citta-bassa';

let stato: Stato | null = null;
let vista: Vista = { tipo: 'area' };
let scheda: Scheda = 'storia';
let origineScelta = c.origini[0]!.id;
let confermaNuovo = false;
let avviso = '';
let frammentoId: string | null = null;

const app = document.getElementById('app')!;

// ---------------------------------------------------------------- salvataggio

function salva(): void {
  try {
    if (stato) localStorage.setItem(CHIAVE, JSON.stringify({ stato, vista, scheda } satisfies Salvataggio));
    else localStorage.removeItem(CHIAVE);
  } catch { /* senza memoria del browser si gioca lo stesso, solo senza salvare */ }
}

function carica(dati?: Partial<Salvataggio>): void {
  let s = dati;
  if (!s?.stato) {
    try {
      const grezzo = localStorage.getItem(CHIAVE);
      if (grezzo) s = JSON.parse(grezzo) as Salvataggio;
    } catch { s = undefined; }
  }
  if (s?.stato?.versione === 1 && c.aree.some((a) => a.id === s!.stato!.area)) {
    stato = s.stato;
    vista = s.vista ?? { tipo: 'area' };
    scheda = s.scheda ?? 'storia';
  }
}

// ---------------------------------------------------------------- frammenti del Codex

function frammentiQui(): TFrammento[] {
  const area = stato?.area;
  const locali = c.frammenti.filter((f) => f.area === area);
  const generali = c.frammenti.filter((f) => !f.area);
  return [...locali, ...generali];
}

function frammentoCorrente(): TFrammento | undefined {
  const lista = frammentiQui();
  if (!lista.length) return undefined;
  let f = lista.find((x) => x.id === frammentoId);
  if (!f) { f = lista[Math.floor(Math.random() * lista.length)]!; frammentoId = f.id; }
  return f;
}

function prossimoFrammento(): void {
  const lista = frammentiQui();
  if (lista.length < 2) return;
  const i = lista.findIndex((x) => x.id === frammentoId);
  frammentoId = lista[(i + 1) % lista.length]!.id;
}

// ---------------------------------------------------------------- rendering

function render(): void {
  if (!stato) {
    document.body.classList.add('in-creazione');
    app.innerHTML = creazione(c, origineScelta);
    return;
  }
  document.body.classList.remove('in-creazione');
  const ora = Date.now();
  aggiornaTempo(stato, ora);
  const x: Contesto = { s: stato, c, vista, scheda, frammento: frammentoCorrente(), confermaNuovo, avviso, ora };
  const centro = scheda === 'personaggio' ? personaggio(x)
    : scheda === 'averi' ? averi(x)
    : scheda === 'bazar' ? bazar(x)
    : scheda === 'mappa' ? mappa(x)
    : storia(x);
  app.innerHTML = pagina(x, centro);
  avviso = '';
}

/** Cambia vista e riporta lo sguardo sul pannello centrale. */
function cambia(v: Vista, nuovaScheda: Scheda = 'storia'): void {
  vista = v;
  scheda = nuovaScheda;
  confermaNuovo = false;
  salva();
  render();
  scorriAlPannello();
}

function scorriAlPannello(): void {
  const el = app.querySelector('.barra-schede');
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 8;
  if (window.scrollY > y || window.innerWidth < 900) window.scrollTo({ top: Math.max(0, y) });
}

// ---------------------------------------------------------------- azioni

function azione(az: string, el: HTMLElement): void {
  const id = el.dataset['id'] ?? '';
  if (az === 'origine') {
    const nomeAttuale = (document.getElementById('nome-pg') as HTMLInputElement | null)?.value ?? '';
    origineScelta = id;
    render();
    const inp = document.getElementById('nome-pg') as HTMLInputElement | null;
    if (inp) inp.value = nomeAttuale;
    return;
  }
  const s = stato;
  if (!s) return;
  const ora = Date.now();
  switch (az) {
    case 'scheda': {
      scheda = id as Scheda;
      confermaNuovo = false; salva(); render(); scorriAlPannello();
      break;
    }
    case 'area': cambia({ tipo: 'area' }); break;
    case 'apri': if (c.storylet.some((z) => z.id === id)) cambia({ tipo: 'storylet', id }); break;
    case 'scegli': {
      const st = c.storylet.find((z) => z.id === id);
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
      const a = az === 'cura'
        ? { tipo: 'cura' as const, consumabile: id }
        : { tipo: az === 'attacca' ? ('attacco' as const) : ('intimidire' as const), bersaglio: id };
      round(vista.cs, a);
      salva(); render();
      break;
    }
    case 'concludi': {
      if (vista.tipo !== 'combattimento') break;
      const st = c.storylet.find((z) => z.id === (vista as { id: string }).id)!;
      const r = concludiCombattimento(s, st, vista.indice, vista.cs, c);
      cambia({ tipo: 'risultato', id: st.id, risultato: r });
      break;
    }
    case 'pesca': {
      if (!pesca(s, c, ora)) avviso = 'Non ci sono occasioni da pescare adesso.';
      salva(); render();
      break;
    }
    case 'scarta': scarta(s, id); salva(); render(); break;
    case 'vai': {
      if (muovi(s, id, c)) { frammentoId = null; cambia({ tipo: 'area' }); }
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
    case 'frammento': prossimoFrammento(); render(); break;
    case 'ricarica': s.candele = CANDELE_MAX; s.candeleAl = ora; s.coda = CODA_MAX; s.codaAl = ora; salva(); render(); break;
    case 'nuovo': {
      if (!confermaNuovo) { confermaNuovo = true; render(); break; }
      stato = null; vista = { tipo: 'area' }; scheda = 'storia'; confermaNuovo = false; salva(); render();
      window.scrollTo({ top: 0 });
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
  if (!nomePg) { (form.querySelector('input') as HTMLInputElement | null)?.focus(); return; }
  const o = c.origini.find((z) => z.id === origineScelta)!;
  stato = nuovoPersonaggio(nomePg, o, Date.now(), AREA_INIZIALE);
  cambia({ tipo: 'area' });
  window.scrollTo({ top: 0 });
});

// Candele e occasioni tornano col tempo: ogni secondo aggiorno i timer,
// e ridisegno tutto solo quando cambia davvero qualcosa.
setInterval(() => {
  if (!stato) return;
  const prima = `${stato.candele}|${stato.coda}`;
  const ora = Date.now();
  aggiornaTempo(stato, ora);
  if (`${stato.candele}|${stato.coda}` !== prima) {
    salva();
    if (vista.tipo !== 'combattimento') render();
    return;
  }
  const pc = msAllaProssimaCandela(stato, ora);
  app.querySelectorAll('[data-timer="candela"]').forEach((el) => { el.textContent = pc === null ? 'Tutte accese' : `La prossima tra ${durata(pc)}`; });
  const tk = app.querySelector('[data-timer="carta"]');
  const pk = msAllaProssimaCarta(stato, ora);
  if (tk) tk.textContent = pk === null ? `Mazzo pieno (${CODA_MAX})` : `Un'altra tra ${durata(pk)}`;
}, 1000);

// ---------------------------------------------------------------- avvio
interface Hot { snapshot?: (f: () => unknown) => void; ready?: (f: (d: unknown) => void) => void; data?: unknown }
const hot = (window as unknown as { claude?: { hot?: Hot } }).claude?.hot;
hot?.snapshot?.(() => ({ stato, vista, scheda }));
const avvia = (dati: unknown) => { carica(dati as Partial<Salvataggio> | undefined); render(); };
if (hot?.ready) hot.ready(avvia);
else avvia(hot?.data);

// Per il debug dalla console del browser: window.nyzar.stato
(window as unknown as Record<string, unknown>)['nyzar'] = { get stato() { return stato; }, contenuti: c };
