// Interfaccia del prototipo: stato, salvataggio, eventi. L'HTML sta in viste.ts.
import './stile.css';
import { CONTENUTI as c } from '../dati/contenuti';
import { RINTOCCHI_MAX, CODA_MAX } from '../motore/regole';
import type { TFrammento } from '../motore/contenuto';
import {
  nuovoPersonaggio, aggiornaTempo, msAlProssimoRintocco, msAllaProssimaCarta, pesca, scarta, requisitiSoddisfatti, type Stato,
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
import { Lettore, montaControlli } from './audio';
import { sceltaAudio } from './colonna';
import { paginaInfo, PAGINE_INFO, type PaginaInfo } from './pagine';
import { crisiAttiva } from '../motore/crisi';
import { segnaTempo, sospendiTempo } from '../motore/tempo';
import { serieDi } from '../motore/serie';
import registrati from '../../doppiaggio/registrati.json';
import {
  idVoceEsito, pagina, storia, personaggio, averi, bazar, mappa, diario, creazione, type Contesto, type Scheda, type Vista,
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
let info: PaginaInfo | null = null; // aiuto, termini o crediti, aperti dal piè di pagina

const app = document.getElementById('app')!;
const lettore = new Lettore(c.tracce);
const VOCI = new Set(Object.keys(registrati as Record<string, string>)); // i pezzi del copione già doppiati

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
  const ok = (f: TFrammento) => !stato || requisitiSoddisfatti(stato, f.requisiti, c);
  const locali = c.frammenti.filter((f) => f.area === area && ok(f));
  const generali = c.frammenti.filter((f) => !f.area && ok(f));
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

/** Le pagine informative prima di creare il personaggio: stesso impianto della creazione. */
function creazioneInfo(id: PaginaInfo): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = creazione(c, origineScelta);
  const main = tmp.querySelector('main.creazione');
  if (main) main.innerHTML = paginaInfo(id);
  return tmp.innerHTML;
}

function render(): void {
  if (!stato) {
    document.body.classList.add('in-creazione');
    app.innerHTML = info ? creazioneInfo(info) : creazione(c, origineScelta);
    lettore.imposta(sceltaAudio(c, { creazione: true }));
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
  const x: Contesto = { s: stato, c, vista, scheda: info ? ('info' as Scheda) : scheda, frammento: frammentoCorrente(), confermaNuovo, avviso, ora, bersaglio, luogo, voci: VOCI, voceInCorso: lettore.voceInCorso() };
  const centro = info ? paginaInfo(info)
    : scheda === 'personaggio' ? personaggio(x)
    : scheda === 'averi' ? averi(x)
    : scheda === 'bazar' ? bazar(x)
    : scheda === 'mappa' ? mappa(x)
    : scheda === 'diario' ? diario(x)
    : storia(x);
  app.innerHTML = pagina(x, centro);
  avviso = '';
  suona(s);
}

/** La musica e l'ambiente del momento: la scena aperta, il luogo, l'area. */
function suona(s: Stato): void {
  const idScena = vista.tipo === 'area' ? crisiAttiva(s, c)?.id : vista.id;
  const st = idScena ? c.storylet.find((z) => z.id === idScena) : undefined;
  lettore.imposta(sceltaAudio(c, {
    area: s.area,
    luogo: st?.presso ?? (luogo && c.luoghi.some((l) => l.id === luogo && l.area === s.area) ? luogo : undefined),
    prologo: st?.tipo === 'prologo',
    crisi: st?.tipo === 'crisi',
    combattimento: vista.tipo === 'combattimento',
  }));
}

/** Cambia vista e riporta lo sguardo sul pannello centrale. */
function cambia(v: Vista, nuovaScheda: Scheda = 'storia'): void {
  vista = v;
  info = null;
  scheda = nuovaScheda;
  confermaNuovo = false;
  salva();
  render();
  scorriAlPannello();
  leggi();
}

/** Il pezzo doppiato della schermata attuale: la scena aperta (anche un prologo o una crisi) o l'esito. */
function voceDellaVista(): string | null {
  if (!stato) return null;
  const v = vista;
  if (v.tipo === 'risultato') {
    const st = c.storylet.find((z) => z.id === v.id);
    return st && v.indice !== undefined ? idVoceEsito(st, v.indice, v.risultato) : null;
  }
  if (v.tipo === 'storylet') return v.id;
  if (vista.tipo === 'area') return crisiAttiva(stato, c)?.id ?? null;
  return null;
}

/** A ogni cambio di schermata la voce precedente tace; se c'è un pezzo doppiato e la lettura è attiva, parte. */
function leggi(): void {
  const id = voceDellaVista();
  if (id && id === lettore.voceInCorso()) return;
  lettore.taci();
  if (id && VOCI.has(id) && lettore.prefs.lettura) void lettore.parla(id);
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
  if (az === 'pagina' && (PAGINE_INFO as string[]).includes(id)) { info = id as PaginaInfo; render(); if (stato) scorriAlPannello(); else window.scrollTo({ top: 0 }); return; }
  if (az === 'chiudi-pagina') { info = null; render(); scorriAlPannello(); return; }
  const s = stato;
  if (!s) return;
  const ora = Date.now();
  switch (az) {
    case 'scheda': {
      info = null;
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
    case 'voce': {
      lettore.avvia();
      if (lettore.voceInCorso() === id) lettore.taci(); else void lettore.parla(id);
      break;
    }
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
      cambia({ tipo: 'risultato', id: st.id, risultato: r, indice: vista.indice });
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
    case 'ricarica': s.rintocchi = RINTOCCHI_MAX; s.rintocchiAl = ora; s.coda = CODA_MAX; s.codaAl = ora; salva(); render(); break;
    case 'nuovo': {
      if (!confermaNuovo) { confermaNuovo = true; render(); break; }
      stato = null; vista = { tipo: 'area' }; scheda = 'storia'; luogo = undefined; confermaNuovo = false; salva(); render();
      window.scrollTo({ top: 0 });
      break;
    }
  }
}

/** La serie della scena aperta, per attribuirle il tempo di gioco. */
function serieInCorso(): string | undefined {
  return vista.tipo === 'area' ? undefined : serieDi(c).diStorylet.get(vista.id)?.id;
}

app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-az]');
  if (!el || (el as HTMLButtonElement).disabled) return;
  if (stato) segnaTempo(stato, Date.now(), serieInCorso());
  azione(el.dataset['az']!, el);
});

// la pagina in background non conta: si chiude il conto e si riapre al ritorno
document.addEventListener('visibilitychange', () => {
  if (!stato) return;
  if (document.hidden) { sospendiTempo(stato, Date.now(), serieInCorso()); salva(); }
  else segnaTempo(stato, Date.now());
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

// Rintocchi e occasioni tornano col tempo: ogni secondo aggiorno i timer,
// e ridisegno tutto solo quando cambia davvero qualcosa.
setInterval(() => {
  if (!stato) return;
  const prima = `${stato.rintocchi}|${stato.coda}`;
  const ora = Date.now();
  aggiornaTempo(stato, ora);
  if (`${stato.rintocchi}|${stato.coda}` !== prima) {
    salva();
    if (vista.tipo !== 'combattimento') render();
    return;
  }
  const pc = msAlProssimoRintocco(stato, ora);
  app.querySelectorAll('[data-timer="rintocco"]').forEach((el) => { el.textContent = pc === null ? 'Tutti pronti' : `Il prossimo tra ${durata(pc)}`; });
  const tk = app.querySelector('[data-timer="carta"]');
  const pk = msAllaProssimaCarta(stato, ora);
  if (tk) tk.textContent = pk === null ? `Mazzo pieno (${CODA_MAX})` : `Un'altra tra ${durata(pk)}`;
}, 1000);

// ---------------------------------------------------------------- avvio
interface Hot { snapshot?: (f: () => unknown) => void; ready?: (f: (d: unknown) => void) => void; data?: unknown }
const hot = (window as unknown as { claude?: { hot?: Hot } }).claude?.hot;
hot?.snapshot?.(() => ({ stato, vista, scheda, luogo }));
avviaSchede(c.glossario);
montaControlli(lettore);
// il pulsante Ascolta segue lo stato della voce senza ridisegnare la pagina
lettore.onCambio = () => {
  const ora = lettore.voceInCorso();
  app.querySelectorAll<HTMLButtonElement>('[data-az=voce]').forEach((b) => {
    const parla = b.dataset['id'] === ora;
    b.textContent = parla ? 'Ferma la voce' : 'Ascolta';
    b.classList.toggle('parla', parla);
    b.setAttribute('aria-pressed', String(parla));
  });
};
const avvia = (dati: unknown) => { carica(dati as Partial<Salvataggio> | undefined); render(); precaricaMiniature(c); };
if (hot?.ready) hot.ready(avvia);
else avvia(hot?.data);

// Per il debug dalla console del browser: window.nyzar.stato
(window as unknown as Record<string, unknown>)['nyzar'] = { get stato() { return stato; }, contenuti: c, lettore };
