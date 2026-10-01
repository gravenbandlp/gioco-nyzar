// Interfaccia del prototipo: stato, salvataggio, eventi. L'HTML sta in viste.ts.
import './stile.css';
import { CONTENUTI as c } from '../dati/contenuti';
import { CANDELE_MAX, CODA_MAX } from '../motore/regole';
import type { TFrammento } from '../motore/contenuto';
import {
  nuovoPersonaggio, aggiornaTempo, msAllaProssimaCandela, msAllaProssimaCarta, pesca, scarta, requisitiSoddisfatti, type Stato,
} from '../motore/personaggio';
import { scegli, concludiCombattimento, puoEntrare, muovi, compra, vendi, correggi, secondaScelta } from '../motore/azioni';
import { ritirati } from '../motore/spedizioni';
import { annota, strappa } from '../motore/diario';
import { indossa, togli, ricaricaReperto, migraOggetti, perchéNonIndossabile } from '../motore/oggetti';
import { cambiaRepertorio, limiteRepertorio } from '../motore/magia';
import { round } from '../motore/combattimento';
import { durata } from './formato';
import { impostaGlossario } from './componenti';
import { avviaSchede, nascondiScheda } from './tooltip';
import { precaricaIntorno, precaricaMiniature } from './precarica';
import {
  pagina, storia, personaggio, averi, bazar, mappa, diario, creazione, type Contesto, type Scheda, type Vista,
} from './viste';

interface Salvataggio { stato: Stato; vista: Vista; scheda?: Scheda; luogo?: string }

const CHIAVE = 'gioco-nyzar/prototipo/v1';
const AREA_INIZIALE = 'citta-bassa';

let stato: Stato | null = null;
let vista: Vista = { tipo: 'area' };
let scheda: Scheda = 'storia';
let origineScelta = c.origini[0]!.id;
let confermaNuovo = false;
let avviso = '';
let frammentoId: string | null = null;
let bersaglio: string | undefined;
let luogo: string | undefined; // il mini-hub aperto dentro l'area

const app = document.getElementById('app')!;

// ---------------------------------------------------------------- salvataggio

function salva(): void {
  try {
    if (stato) localStorage.setItem(CHIAVE, JSON.stringify({ stato, vista, scheda, luogo } satisfies Salvataggio));
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
    stato.repertorio ??= [];
    migraOggetti(stato);
    vista = s.vista ?? { tipo: 'area' };
    scheda = s.scheda ?? 'storia';
    luogo = s.luogo;
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
  const s = stato;
  if (luogo && !c.luoghi.some((l) => l.id === luogo && l.area === s.area)) luogo = undefined; // cambiata area da una storia
  impostaGlossario(c.glossario, (v) => requisitiSoddisfatti(s, v.requisiti, c));
  nascondiScheda();
  precaricaIntorno(s, c);
  const ora = Date.now();
  aggiornaTempo(stato, ora);
  const x: Contesto = { s: stato, c, vista, scheda, frammento: frammentoCorrente(), confermaNuovo, avviso, ora, bersaglio, luogo };
  const centro = scheda === 'personaggio' ? personaggio(x)
    : scheda === 'averi' ? averi(x)
    : scheda === 'bazar' ? bazar(x)
    : scheda === 'mappa' ? mappa(x)
    : scheda === 'diario' ? diario(x)
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
    case 'luogo': luogo = id; cambia({ tipo: 'area' }); break;
    case 'esci-luogo': luogo = undefined; cambia({ tipo: 'area' }); break;
    case 'apri': if (c.storylet.some((z) => z.id === id)) cambia({ tipo: 'storylet', id }); break;
    case 'scegli': {
      const st = c.storylet.find((z) => z.id === id);
      if (!st) break;
      const indice = Number(el.dataset['i']);
      const prima = structuredClone(s);
      const r = scegli(s, st, indice, c, ora);
      if (r.tipo === 'errore') { avviso = r.messaggio; render(); }
      else if (r.tipo === 'combattimento') { bersaglio = undefined; cambia({ tipo: 'combattimento', id, indice, cs: r.combattimento }); }
      else cambia({ tipo: 'risultato', id, risultato: r.risultato, indice, prima });
      break;
    }
    case 'bersaglio': bersaglio = id; render(); break;
    case 'attacca': case 'intimidisci': case 'cura': case 'lancia': case 'reperto': {
      if (vista.tipo !== 'combattimento') break;
      const b = bersaglio ?? '';
      const a = az === 'cura' ? { tipo: 'cura' as const, consumabile: id }
        : az === 'lancia' ? { tipo: 'incantesimo' as const, incantesimo: id, bersaglio: b }
        : az === 'reperto' ? { tipo: 'reperto' as const, reperto: id, bersaglio: b }
        : { tipo: az === 'attacca' ? ('attacco' as const) : ('intimidire' as const), bersaglio: b };
      round(vista.cs, a);
      salva(); render();
      break;
    }
    case 'indossa': {
      const motivo = perchéNonIndossabile(s, c, id);
      if (motivo) avviso = motivo; else indossa(s, c, id);
      salva(); render();
      break;
    }
    case 'togli': togli(s, id); salva(); render(); break;
    case 'ricarica-reperto': {
      if (!ricaricaReperto(s, c, id)) avviso = 'Non puoi ricaricarlo adesso.';
      salva(); render();
      break;
    }
    case 'seconda-scelta': {
      if (vista.tipo !== 'risultato' || !vista.prima || vista.indice === undefined) break;
      const st = c.storylet.find((z) => z.id === (vista as { id: string }).id)!;
      const indice = vista.indice;
      const r = secondaScelta(s, vista.prima, st, indice, c, ora);
      if (r.tipo === 'errore') { avviso = r.messaggio; render(); }
      else if (r.tipo === 'risultato') cambia({ tipo: 'risultato', id: st.id, risultato: r.risultato, indice }); // una volta per esito
      break;
    }
    case 'fine-mutazioni': {
      // nessuna mutazione rimasta da proporre: la Marea si ritira comunque
      s.quality['contaminazione'] = Math.min(s.quality['contaminazione'] ?? 0, 3);
      salva(); cambia({ tipo: 'area' });
      break;
    }
    case 'repertorio': {
      if (!cambiaRepertorio(s, id, c)) avviso = `Puoi portare al massimo ${limiteRepertorio(s)} incantesimi in combattimento.`;
      salva(); render();
      break;
    }
    case 'correggi': {
      if (vista.tipo !== 'risultato' || !vista.prima || vista.indice === undefined) break;
      const st = c.storylet.find((z) => z.id === (vista as { id: string }).id)!;
      const indice = vista.indice;
      const r = correggi(s, vista.prima, st, indice, c, ora);
      if (r.tipo === 'errore') { avviso = r.messaggio; render(); }
      else if (r.tipo === 'risultato') cambia({ tipo: 'risultato', id: st.id, risultato: r.risultato, indice }); // una sola Correzione per esito
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
      if (muovi(s, id, c)) { frammentoId = null; luogo = undefined; cambia({ tipo: 'area' }); }
      else { avviso = puoEntrare(s, id, c).motivo ?? 'Non puoi andarci.'; render(); }
      break;
    }
    case 'annota': {
      const v = vista;
      if (v.tipo !== 'risultato') break;
      const r = v.risultato;
      const st = c.storylet.find((z) => z.id === v.id);
      const titolo = r.titolo ?? (r.riuscito === undefined ? st?.titolo ?? '' : r.riuscito ? 'Riuscito' : 'Fallito');
      annota(s, {
        quando: Date.now(), storylet: v.id, scena: st?.titolo ?? '', titolo, testo: r.testo, prima: st?.testo,
        luogo: c.aree.find((a) => a.id === st?.area)?.nome ?? c.aree.find((a) => a.id === s.area)?.nome ?? '',
        immagine: r.immagine ?? st?.immagine, esito: r.riuscito === undefined ? undefined : r.riuscito ? 'successo' : 'fallimento',
      });
      salva(); render();
      break;
    }
    case 'strappa': strappa(s, Number(id)); salva(); render(); break;
    case 'ritirata': {
      if (ritirati(s, c)) { luogo = undefined; salva(); frammentoId = null; cambia({ tipo: 'area' }); }
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
      stato = null; vista = { tipo: 'area' }; scheda = 'storia'; luogo = undefined; confermaNuovo = false; salva(); render();
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
hot?.snapshot?.(() => ({ stato, vista, scheda, luogo }));
avviaSchede(c.glossario);
const avvia = (dati: unknown) => { carica(dati as Partial<Salvataggio> | undefined); render(); precaricaMiniature(c); };
if (hot?.ready) hot.ready(avvia);
else avvia(hot?.data);

// Per il debug dalla console del browser: window.nyzar.stato
(window as unknown as Record<string, unknown>)['nyzar'] = { get stato() { return stato; }, contenuti: c };
