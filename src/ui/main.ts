// Interfaccia del prototipo: stato, salvataggio, eventi. L'HTML sta in viste.ts.
import './stile.css';
import { CONTENUTI as c } from '../dati/contenuti';
import { CODA_MAX } from '../motore/regole';
import type { TFrammento } from '../motore/contenuto';
import {
  nuovoPersonaggio, aggiornaTempo, msAlProssimoRintocco, msAllaProssimaCarta, pesca, scarta, requisitiSoddisfatti, type Stato,
} from '../motore/personaggio';
import { scegli, concludiCombattimento, concludiZekar, lateraliDi, puoEntrare, muovi, compra, vendi, vendibili, correggi, secondaScelta } from '../motore/azioni';
import { ritirati } from '../motore/spedizioni';
import { annota, strappa } from '../motore/diario';
import { indossa, togli, ricaricaReperto, migraOggetti, perchéNonIndossabile } from '../motore/oggetti';
import { cambiaRepertorio, limiteRepertorio } from '../motore/magia';
import { round } from '../motore/combattimento';
import { riproduci, saltaScena, cambiaVelocita } from './scontro';
import { riproduciZekar, saltaZekar } from './zekar';
import { avviaLettura, continuaLettura, tuttoLettura, montaOpzioneLettura } from './lettura';
import { siediti, muovi as muoviZekar, lateraliValide, LATERALI_IN_MANO } from '../motore/zekar';
import { durata } from './formato';
import { impostaGlossario } from './componenti';
import { avviaSchede, nascondiScheda } from './tooltip';
import { precaricaIntorno, precaricaMiniature } from './precarica';
import { Lettore, montaControlli } from './audio';
import { montaIngresso } from './ingresso';
import { avviaSfondo } from './sfondo';
import { sceltaAudio } from './colonna';
import { paginaInfo, corpoSalvataggio, PAGINE_INFO, type PaginaInfo } from './pagine';
import { Sincronia, archivioGoogle, configSupabase, entraConGoogle, idPersonaggio, type DatiSalvati } from './salvataggi';
import { crisiAttiva } from '../motore/crisi';
import { segnaTempo, sospendiTempo } from '../motore/tempo';
import { serieDi } from '../motore/serie';
import {
  pagina, storia, personaggio, averi, bazar, mappa, diario, creazione, schedaAperta, type Contesto, type Scheda, type Vista,
} from './viste';

interface Salvataggio { stato: Stato; vista: Vista; scheda?: Scheda; luogo?: string | null; salvatoAl?: number }

const VECCHIE_CHIAVI = ['gioco-nyzar/prototipo/v1', 'gioco-nyzar/proprietario']; // il salvataggio nel browser non esiste più
try { for (const k of VECCHIE_CHIAVI) localStorage.removeItem(k); } catch { /* niente */ }
const AREA_INIZIALE = 'citta-bassa';

let stato: Stato | null = null;
let vista: Vista = { tipo: 'area' };
let scheda: Scheda = 'storia';
let origineScelta = c.origini[0]!.id;
let confermaNuovo = false;
let avviso = '';
let frammentoId: string | null = null;
let bersaglio: string | undefined;
let zekarScelte: number[] | null = null; // le laterali scelte prima di sedersi al tavolo dello Zekar
let ultimoContesto: Contesto | undefined;
let luogo: string | undefined; // il mini-hub aperto dentro l'area
let info: PaginaInfo | null = null; // regolamento, termini, crediti o salvataggio, aperti dal piè di pagina
let salvatoAl = 0; // ultima modifica del personaggio, mostrata nella pagina del salvataggio

const app = document.getElementById('app')!;
const lettore = new Lettore(c.tracce);

// ---------------------------------------------------------------- salvataggio

function salva(): void {
  if (stato) salvatoAl = Date.now();
  sincro.segnala(dati());
}

/** Il personaggio in gioco, nella forma del salvataggio. */
function dati(): DatiSalvati | null {
  return stato ? { stato, vista, scheda, luogo: luogo ?? null, salvatoAl, rev: 0 } : null;
}

/** Sostituisce il personaggio in gioco con la copia dell'account. */
function adotta(d: DatiSalvati, messaggio?: string): void {
  carica({ stato: d.stato, vista: (d.vista as Vista | undefined) ?? { tipo: 'area' }, scheda: d.scheda as Scheda | undefined, luogo: d.luogo, salvatoAl: d.salvatoAl });
  if (vista.tipo === 'risultato' && !c.storylet.some((z) => z.id === (vista as { id: string }).id)) vista = { tipo: 'area' };
  if (messaggio) avviso = messaggio;
  render();
}

const sincro = new Sincronia(
  () => { if (info) render(); else if (stato) aggiornaIndicatore(); },
  (d) => { info = null; adotta(d, `Hai giocato ${d.stato.nome} da un altro dispositivo: riprendi da lì.`); },
  () => soglia.mostra('accedi', 'La sessione è scaduta: rientra con Google per continuare a salvare.'),
);

/** L'indicatore del salvataggio nella barra in alto, senza ridisegnare la pagina. */
function aggiornaIndicatore(): void {
  const el = app.querySelector<HTMLElement>('[data-indicatore=salvataggio]');
  if (el) { el.textContent = etichettaSalvataggio(); el.classList.toggle('account', sincro.stato.connesso && !sincro.stato.errore); }
}

function etichettaSalvataggio(): string {
  const a = sincro.stato;
  if (!a.connesso) return 'Non salvato: rientra con Google';
  return a.errore ? 'Salvataggio: errore, riprovo' : "Salvato nell'account";
}

/** All'avvio: si entra nell'account e si riprende il personaggio che vi è salvato. */
async function avviaArchivio(): Promise<void> {
  const cfg = configSupabase();
  if (!cfg) { soglia.mostra('accedi', 'Il salvataggio non è configurato in questa versione del gioco.'); return; }
  const remoto = await sincro.collega(() => archivioGoogle(cfg));
  if (remoto) adotta(remoto);
  if (sincro.stato.connesso) soglia.mostra('entra', remoto ? `Bentornato: riprendi ${remoto.stato.nome}.` : undefined);
  else soglia.mostra('accedi', sincro.stato.errore);
}

/** Toglie il personaggio dalla pagina e torna alla creazione. */
function ricomincia(): void {
  stato = null; vista = { tipo: 'area' }; scheda = 'storia'; luogo = undefined; confermaNuovo = false;
}

async function esciDallAccount(): Promise<void> {
  const allineato = await sincro.esci();
  ricomincia();
  info = null;
  render();
  soglia.mostra('accedi', allineato
    ? 'Sei uscito. Il personaggio è salvato nel tuo account: rientra con Google per riprenderlo.'
    : "Sei uscito, ma l'ultima mossa non è arrivata nell'account.");
}

function carica(s: Partial<Salvataggio>): void {
  if (s.stato?.versione === 1 && c.aree.some((a) => a.id === s.stato!.area)) {
    stato = s.stato;
    stato.repertorio ??= [];
    migraOggetti(stato);
    vista = s.vista ?? { tipo: 'area' };
    scheda = s.scheda ?? 'storia';
    luogo = s.luogo ?? undefined;
    salvatoAl = s.salvatoAl ?? 0;
    idPersonaggio(stato);
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
  if (main) main.innerHTML = contenutoInfo(id);
  return tmp.innerHTML;
}

function contenutoInfo(id: PaginaInfo): string {
  if (id !== 'salvataggio') return paginaInfo(id);
  return paginaInfo(id, corpoSalvataggio({
    archivio: sincro.stato,
    personaggio: stato ? { nome: stato.nome, salvatoAl } : undefined,
    messaggio: stato ? undefined : avviso, // in gioco l'avviso lo mostra già la pagina
  }));
}

function render(): void {
  if (!stato) {
    document.body.classList.add('in-creazione');
    app.innerHTML = info ? creazioneInfo(info) : creazione(c, origineScelta);
    avviso = '';
    lettore.imposta(sceltaAudio(c, { creazione: true }));
    return;
  }
  document.body.classList.remove('in-creazione');
  const s = stato;
  if (!schedaAperta(s, scheda)) scheda = 'storia'; // un salvataggio rimasto sulla mappa durante il prologo
  if (luogo && !c.luoghi.some((l) => l.id === luogo && l.area === s.area)) luogo = undefined; // cambiata area da una storia
  impostaGlossario(c.glossario, (v) => requisitiSoddisfatti(s, v.requisiti, c));
  nascondiScheda();
  precaricaIntorno(s, c);
  const ora = Date.now();
  aggiornaTempo(stato, ora);
  if (vista.tipo === 'zekar' && !zekarScelte) zekarScelte = [...lateraliDi(s)]; // una partita ripresa da un salvataggio
  const x: Contesto = { s: stato, c, vista, scheda: info ? ('info' as Scheda) : scheda, frammento: frammentoCorrente(), confermaNuovo, avviso, ora, bersaglio, zekarScelte: zekarScelte ?? [], luogo };
  ultimoContesto = x;
  const centro = info ? contenutoInfo(info)
    : scheda === 'personaggio' ? personaggio(x)
    : scheda === 'averi' ? averi(x)
    : scheda === 'bazar' ? bazar(x)
    : scheda === 'mappa' ? mappa(x)
    : scheda === 'diario' ? diario(x)
    : storia(x);
  app.innerHTML = pagina(x, centro);
  avviaLettura(app);
  aggiornaIndicatore();
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
  if (az === 'entra-google') { const cfg = configSupabase(); if (cfg) entraConGoogle(cfg); return; }
  if (az === 'esci-account') { void esciDallAccount(); return; }
  const s = stato;
  if (!s) return;
  const ora = Date.now();
  switch (az) {
    case 'scheda': {
      if (!schedaAperta(s, id as Scheda)) break; // nel prologo restano chiuse mappa, bazar e diario
      info = null;
      scheda = id as Scheda;
      confermaNuovo = false; salva(); render(); scorriAlPannello();
      break;
    }
    case 'area': cambia({ tipo: 'area' }); break;
    case 'luogo': luogo = id; cambia({ tipo: 'area' }); break;
    case 'esci-luogo': luogo = undefined; cambia({ tipo: 'area' }); break;
    case 'apri': {
      // una crisi aperta passa davanti a tutto, tranne il seguito della scena appena chiusa
      const seguito = vista.tipo === 'risultato' && vista.risultato?.segue === id;
      const crisi = crisiAttiva(s, c);
      if (crisi && !seguito && crisi.id !== id) cambia({ tipo: 'area' });
      else if (c.storylet.some((z) => z.id === id)) cambia({ tipo: 'storylet', id });
      break;
    }
    case 'scegli': {
      const st = c.storylet.find((z) => z.id === id);
      if (!st) break;
      const indice = Number(el.dataset['i']);
      const prima = structuredClone(s);
      const r = scegli(s, st, indice, c, ora);
      if (r.tipo === 'errore') { avviso = r.messaggio; render(); }
      else if (r.tipo === 'combattimento') {
        bersaglio = undefined;
        cambia({ tipo: 'combattimento', id, indice, cs: r.combattimento });
        app.querySelector('.scena.combattimento')?.classList.add('entrata');
      }
      else if (r.tipo === 'zekar') {
        zekarScelte = [...lateraliDi(s)];
        cambia({ tipo: 'zekar', id, indice, zs: r.zekar });
      }
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
      const daRiga = vista.cs.log.length;
      round(vista.cs, a);
      salva(); render();
      void riproduci(app, vista.cs, daRiga, (s) => lettore.effetto(s));
      break;
    }
    case 'salta-scena': if (!saltaZekar()) saltaScena(); break;
    case 'continua-lettura': continuaLettura(); break;
    case 'tutto-lettura': tuttoLettura(); break;
    case 'zk-scegli': {
      const v = Number(el.dataset['i']);
      zekarScelte ??= [];
      zekarScelte = zekarScelte.includes(v) ? zekarScelte.filter((z) => z !== v) : zekarScelte.length < LATERALI_IN_MANO ? [...zekarScelte, v] : zekarScelte;
      render();
      break;
    }
    case 'zk-siediti': {
      if (vista.tipo !== 'zekar' || !zekarScelte || !lateraliValide(zekarScelte)) break;
      s.zekarLaterali = [...zekarScelte].sort((a, b) => a - b);
      siediti(vista.zs, zekarScelte);
      salva(); render();
      if (ultimoContesto) void riproduciZekar(app, vista.zs, ultimoContesto, 0, (x) => lettore.effetto(x));
      break;
    }
    case 'zk-gioca': case 'zk-passa': case 'zk-stai': {
      if (vista.tipo !== 'zekar') break;
      const da = vista.zs.eventi.length;
      const m = az === 'zk-gioca' ? { tipo: 'laterale' as const, indice: Number(el.dataset['i']) } : { tipo: az === 'zk-stai' ? ('stai' as const) : ('passa' as const) };
      if (!muoviZekar(vista.zs, m)) break;
      salva(); render();
      if (ultimoContesto) void riproduciZekar(app, vista.zs, ultimoContesto, da, (x) => lettore.effetto(x));
      break;
    }
    case 'zk-concludi': {
      if (vista.tipo !== 'zekar' || vista.zs.fase !== 'finita') break;
      const st = c.storylet.find((z) => z.id === (vista as { id: string }).id)!;
      const r = concludiZekar(s, st, vista.indice, vista.zs, c);
      cambia({ tipo: 'risultato', id: st.id, risultato: r, indice: vista.indice });
      break;
    }
    case 'ritmo': cambiaVelocita(el); break;
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
      const quanti = el.dataset['n'] === 'tutti' ? vendibili(s, id, c) : 1;
      for (let i = 0; i < quanti; i++) vendi(s, el.dataset['neg']!, id, c);
      salva(); render();
      break;
    }
    case 'frammento': prossimoFrammento(); render(); break;
    case 'nuovo': {
      if (!confermaNuovo) { confermaNuovo = true; render(); break; }
      ricomincia(); render();
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
  if (document.hidden) { sospendiTempo(stato, Date.now(), serieInCorso()); salva(); void sincro.subito(); }
  else { segnaTempo(stato, Date.now()); void sincro.controlla(); }
});
// una finestra può restare visibile senza essere in primo piano: si controlla anche al ritorno del fuoco e ogni tanto
window.addEventListener('focus', () => void sincro.controlla());
setInterval(() => { if (!document.hidden) void sincro.controlla(); }, 20_000);

app.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  if (form.dataset['form'] !== 'crea') return;
  const nomePg = String(new FormData(form).get('nome') ?? '').trim();
  if (!nomePg) { (form.querySelector('input') as HTMLInputElement | null)?.focus(); return; }
  const o = c.origini.find((z) => z.id === origineScelta)!;
  stato = nuovoPersonaggio(nomePg, o, Date.now(), AREA_INIZIALE);
  idPersonaggio(stato);
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
    if (vista.tipo !== 'combattimento' && vista.tipo !== 'zekar') render();
    return;
  }
  const pc = msAlProssimoRintocco(stato, ora);
  app.querySelectorAll('[data-timer="rintocco"]').forEach((el) => { el.textContent = pc === null ? 'Tutti pronti' : `Il prossimo tra ${durata(pc)}`; });
  const tk = app.querySelector('[data-timer="carta"]');
  const pk = msAllaProssimaCarta(stato, ora);
  if (tk) tk.textContent = pk === null ? `Mazzo pieno (${CODA_MAX})` : `Un'altra tra ${durata(pk)}`;
}, 1000);

// ---------------------------------------------------------------- avvio
avviaSchede(c.glossario);
montaControlli(lettore);
montaOpzioneLettura();
// si gioca solo da dentro l'account Google: la soglia resta chiusa finché il personaggio non arriva dall'account
const soglia = montaIngresso(lettore, {
  modo: 'attesa',
  accedi: () => { const cfg = configSupabase(); if (cfg) entraConGoogle(cfg); },
  caricamento: () => (stato ? `Torni a Qir-Azel con ${stato.nome}…` : 'Scendi a Qir-Azel…'),
});
render();
precaricaMiniature(c);
void avviaArchivio();

// Per il debug dalla console del browser: window.nyzar.stato
(window as unknown as Record<string, unknown>)['nyzar'] = { get stato() { return stato; }, contenuti: c, lettore, sincro, soglia };
