// Il lettore audio: due canali (musica e ambiente) in loop, con dissolvenza incrociata quando cambia la zona.
// Parte solo dopo il primo gesto del giocatore (i browser bloccano l'audio automatico). Le preferenze
// (volumi, silenzio) restano nel browser di chi gioca.
//
// Perché Web Audio e non un semplice <audio loop>: l'MP3 aggiunge silenzio all'inizio e alla fine
// (ritardo e riempimento dell'encoder), e il loop dell'elemento <audio> fa sentire uno stacco. Qui si legge
// l'intestazione Info/LAME del file e si fa girare il buffer esattamente sui campioni utili.
import type { TTraccia } from '../motore/contenuto';
import type { Scelta } from './colonna';
import { suona, type Suono } from './suoni';

// ---------------------------------------------------------------- MP3 senza stacchi

export interface InfoGapless {
  frame: number; // frame audio (esclusa la cornice Info)
  campioniPerFrame: number;
  frequenza: number;
  ritardo: number; // ritardo dell'encoder, in campioni
  riempimento: number; // campioni aggiunti in fondo
}

const FREQUENZE: Record<number, number[]> = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

/** Legge l'intestazione Xing/Info e l'estensione LAME del primo frame di un MP3. */
export function leggiGapless(dati: ArrayBuffer): InfoGapless | null {
  const b = new Uint8Array(dati);
  let o = 0;
  if (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) { // tag ID3v2 in testa
    o = 10 + ((b[6]! << 21) | (b[7]! << 14) | (b[8]! << 7) | b[9]!) + (b[5]! & 0x10 ? 10 : 0);
  }
  while (o + 4 < b.length && !(b[o] === 0xff && (b[o + 1]! & 0xe0) === 0xe0)) o++;
  if (o + 4 >= b.length) return null;
  const versione = (b[o + 1]! >> 3) & 3; // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
  const frequenza = FREQUENZE[versione]?.[(b[o + 2]! >> 2) & 3];
  if (!frequenza) return null;
  const mono = (b[o + 3]! >> 6) === 3;
  const laterale = versione === 3 ? (mono ? 17 : 32) : (mono ? 9 : 17);
  const x = o + 4 + laterale;
  const tag = String.fromCharCode(...b.slice(x, x + 4));
  if (tag !== 'Xing' && tag !== 'Info') return null;
  const u32 = (i: number) => ((b[i]! << 24) | (b[i + 1]! << 16) | (b[i + 2]! << 8) | b[i + 3]!) >>> 0;
  const flag = u32(x + 4);
  let p = x + 8;
  if (!(flag & 1)) return null;
  const frame = u32(p); p += 4;
  if (flag & 2) p += 4;
  if (flag & 4) p += 100;
  if (flag & 8) p += 4;
  // estensione LAME (anche gli encoder di FFmpeg la scrivono): ritardo e riempimento su 12 bit ciascuno
  const r = p + 21;
  const ritardo = (b[r]! << 4) | (b[r + 1]! >> 4);
  const riempimento = ((b[r + 1]! & 0x0f) << 8) | b[r + 2]!;
  return { frame, campioniPerFrame: versione === 3 ? 1152 : 576, frequenza, ritardo, riempimento };
}

const RITARDO_DECODER = 529;

/**
 * Dove sta il suono utile dentro il buffer decodificato, in secondi. Alcuni browser tolgono da soli ritardo e
 * riempimento (allora il buffer è già giusto), altri no: lo si capisce dalla lunghezza.
 */
export function confiniLoop(lunghezza: number, frequenzaBuffer: number, g: InfoGapless | null): { inizio: number; fine: number } {
  const tutto = { inizio: 0, fine: lunghezza / frequenzaBuffer };
  if (!g) return tutto;
  const scala = frequenzaBuffer / g.frequenza;
  const utili = (g.frame * g.campioniPerFrame - g.ritardo - g.riempimento) * scala;
  if (utili <= 0) return tutto;
  if (Math.abs(lunghezza - utili) <= 0.002 * frequenzaBuffer) return { inizio: 0, fine: utili / frequenzaBuffer };
  const extra = Math.max(0, lunghezza - g.frame * g.campioniPerFrame * scala); // la cornice Info decodificata come silenzio
  const inizio = (g.ritardo + RITARDO_DECODER) * scala + extra;
  if (inizio + utili > lunghezza + 1) return tutto;
  return { inizio: inizio / frequenzaBuffer, fine: (inizio + utili) / frequenzaBuffer };
}

// ---------------------------------------------------------------- preferenze

type Canale = 'musica' | 'ambiente';
type Volume = Canale | 'effetti';
interface Preferenze { musica: number; ambiente: number; effetti: number; muto: boolean }
const CHIAVE = 'gioco-nyzar/audio';
const PREDEFINITE: Preferenze = { musica: 0.6, ambiente: 0.5, effetti: 0.7, muto: false };

function leggiPreferenze(): Preferenze {
  try { return { ...PREDEFINITE, ...JSON.parse(localStorage.getItem(CHIAVE) ?? '{}') as Partial<Preferenze> }; } catch { return { ...PREDEFINITE }; }
}
function salvaPreferenze(p: Preferenze): void {
  try { localStorage.setItem(CHIAVE, JSON.stringify(p)); } catch { /* senza memoria del browser vale per questa sessione */ }
}

// ---------------------------------------------------------------- lettore

const DISSOLVENZA = 2.5; // secondi
const CACHE_MAX = 4; // buffer decodificati tenuti in memoria per canale

interface Caricata { buffer: AudioBuffer; inizio: number; fine: number }
interface InCorso { id: string; sorgente: AudioBufferSourceNode; guadagno: GainNode }

export class Lettore {
  private ctx: AudioContext | null = null;
  private principale: Record<Volume, GainNode> | null = null;
  private desiderato: Scelta = { musica: null, ambiente: null };
  private attuale: Record<Canale, InCorso | null> = { musica: null, ambiente: null };
  private cache: Record<Canale, Map<string, Promise<Caricata | null>>> = { musica: new Map(), ambiente: new Map() };
  prefs = leggiPreferenze();
  private ascoltatori: (() => void)[] = [];
  /** Chi vuole sapere quando cambia qualcosa (il pannello). */
  set onCambio(f: (() => void) | null) { if (f) this.ascoltatori.push(f); }
  private avvisa(): void { for (const f of this.ascoltatori) f(); }

  constructor(private tracce: TTraccia[]) {}

  traccia(id: string | null): TTraccia | undefined { return id ? this.tracce.find((t) => t.id === id) : undefined; }
  /** Le tracce che suonano davvero adesso (o suoneranno al primo gesto). */
  inAscolto(): Scelta { return { musica: this.attuale.musica?.id ?? null, ambiente: this.attuale.ambiente?.id ?? null }; }
  avviato(): boolean { return !!this.ctx; }
  /** Il browser ha davvero concesso l'audio (il contesto può restare sospeso se il gesto non bastava). */
  inFunzione(): boolean { return this.ctx?.state === 'running'; }

  /** Al primo gesto del giocatore: crea il contesto audio e fa partire quello che serve. */
  avvia(): void {
    if (this.prefs.muto) return;
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx({ latencyHint: 'playback' });
    this.principale = { musica: this.ctx.createGain(), ambiente: this.ctx.createGain(), effetti: this.ctx.createGain() };
    for (const k of ['musica', 'ambiente', 'effetti'] as Volume[]) {
      this.principale[k].gain.value = this.prefs[k];
      this.principale[k].connect(this.ctx.destination);
    }
    void this.ctx.resume();
    this.applica();
  }

  /** Chiamata a ogni render: se la zona è cambiata, sfuma verso le tracce nuove. */
  imposta(s: Scelta): void {
    if (s.musica === this.desiderato.musica && s.ambiente === this.desiderato.ambiente) return;
    this.desiderato = { ...s };
    this.applica();
  }

  /** Un effetto sonoro del combattimento, se l'audio è acceso. */
  effetto(s: Suono): void {
    if (!this.ctx || !this.principale || this.prefs.muto || this.ctx.state !== 'running' || this.prefs.effetti <= 0) return;
    suona(this.ctx, this.principale.effetti, s);
  }

  volume(k: Volume, v: number): void {
    this.prefs[k] = v; salvaPreferenze(this.prefs);
    if (!this.ctx) return;
    this.principale?.[k].gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  silenzia(muto: boolean): void {
    this.prefs.muto = muto; salvaPreferenze(this.prefs);
    if (muto) { void this.ctx?.suspend(); }
    else if (this.ctx) void this.ctx.resume();
    else this.avvia();
    this.avvisa();
  }

  /** Quando la scheda va in secondo piano l'audio si ferma, e riparte al ritorno. */
  visibilita(visibile: boolean): void {
    if (!this.ctx || this.prefs.muto) return;
    if (visibile) void this.ctx.resume(); else void this.ctx.suspend();
  }

  private applica(): void {
    if (!this.ctx) return;
    for (const k of ['musica', 'ambiente'] as Canale[]) void this.passaA(k, this.desiderato[k]);
  }

  private carica(k: Canale, id: string): Promise<Caricata | null> {
    const c = this.cache[k];
    let p = c.get(id);
    if (p) { c.delete(id); c.set(id, p); return p; } // in fondo: usata di recente
    const ctx = this.ctx!;
    p = fetch(`audio/${k}/${id}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then(async (dati) => {
        const g = leggiGapless(dati);
        const buffer = await ctx.decodeAudioData(dati);
        return { buffer, ...confiniLoop(buffer.length, buffer.sampleRate, g) };
      })
      .catch(() => null); // traccia non importata o rete assente: si resta in silenzio su quel canale
    c.set(id, p);
    for (const vecchia of [...c.keys()]) { // via le meno recenti, ma mai quella che sta suonando
      if (c.size <= CACHE_MAX) break;
      if (vecchia !== this.attuale[k]?.id && vecchia !== id) c.delete(vecchia);
    }
    return p;
  }

  private async passaA(k: Canale, id: string | null): Promise<void> {
    const ctx = this.ctx!;
    if (this.attuale[k]?.id === id) return;
    const vecchio = this.attuale[k];
    if (vecchio) {
      const ora = ctx.currentTime;
      vecchio.guadagno.gain.cancelScheduledValues(ora);
      vecchio.guadagno.gain.setValueAtTime(vecchio.guadagno.gain.value, ora);
      vecchio.guadagno.gain.linearRampToValueAtTime(0, ora + DISSOLVENZA);
      vecchio.sorgente.stop(ora + DISSOLVENZA + 0.1);
      this.attuale[k] = null;
    }
    if (!id) { this.avvisa(); return; }
    const t = this.traccia(id);
    const caricata = await this.carica(k, id);
    if (!caricata || this.desiderato[k] !== id || this.attuale[k]) return; // nel frattempo è cambiato tutto
    const sorgente = ctx.createBufferSource();
    sorgente.buffer = caricata.buffer;
    sorgente.loop = true;
    sorgente.loopStart = caricata.inizio;
    sorgente.loopEnd = caricata.fine;
    const guadagno = ctx.createGain();
    const ora = ctx.currentTime;
    guadagno.gain.setValueAtTime(0, ora);
    guadagno.gain.linearRampToValueAtTime(t?.volume ?? 1, ora + DISSOLVENZA);
    sorgente.connect(guadagno).connect(this.principale![k]);
    sorgente.start(ora, caricata.inizio);
    this.attuale[k] = { id, sorgente, guadagno };
    this.avvisa();
  }
}

// ---------------------------------------------------------------- controlli

const NOTA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.5a2.5 2.5 0 1 1-2-2.45V5l11-2v11.5a2.5 2.5 0 1 1-2-2.45V6.6L9 7.9z"/></svg>';
const SILENZIO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.5a2.5 2.5 0 1 1-2-2.45V5l11-2v11.5a2.5 2.5 0 1 1-2-2.45V6.6L9 7.9z"/><path d="M3 3l18 18" stroke="currentColor" stroke-width="2"/></svg>';

/** Il pulsante dell'audio, fuori da #app così il render non lo ricostruisce. */
export function montaControlli(l: Lettore): void {
  const box = document.createElement('div');
  box.className = 'audio';
  box.innerHTML = `
    <div class="audio-pannello" id="audio-pannello" hidden>
      <p class="etichetta velo">Audio</p>
      <label><span>Musica</span><input type="range" min="0" max="1" step="0.05" data-canale="musica"></label>
      <label><span>Ambiente</span><input type="range" min="0" max="1" step="0.05" data-canale="ambiente"></label>
      <label><span>Effetti</span><input type="range" min="0" max="1" step="0.05" data-canale="effetti"></label>
      <button type="button" class="bottone piccolo" data-audio="muto"></button>
      <p class="audio-ora"></p>
    </div>
    <button type="button" class="audio-tasto" aria-controls="audio-pannello" aria-expanded="false" title="Audio"></button>`;
  document.body.appendChild(box);
  const tasto = box.querySelector<HTMLButtonElement>('.audio-tasto')!;
  const pannello = box.querySelector<HTMLElement>('.audio-pannello')!;
  const muto = box.querySelector<HTMLButtonElement>('[data-audio=muto]')!;
  const ora = box.querySelector<HTMLElement>('.audio-ora')!;
  const cursori = box.querySelectorAll<HTMLInputElement>('input[type=range]');

  const aggiorna = () => {
    const icona = l.prefs.muto ? SILENZIO : NOTA;
    if (tasto.innerHTML !== icona) tasto.innerHTML = icona;
    tasto.classList.toggle('muto', l.prefs.muto);
    tasto.setAttribute('aria-label', l.prefs.muto ? 'Audio spento' : 'Audio');
    muto.textContent = l.prefs.muto ? 'Accendi l\'audio' : 'Spegni l\'audio';
    cursori.forEach((c) => { c.value = String(l.prefs[c.dataset['canale'] as Volume]); c.disabled = l.prefs.muto; });
    const a = l.inAscolto();
    const nomi = [l.traccia(a.musica), l.traccia(a.ambiente)].filter((t): t is TTraccia => !!t).map((t) => t.titolo);
    ora.textContent = l.prefs.muto ? '' : nomi.length ? `In ascolto: ${nomi.join(' · ')}` : l.avviato() ? '' : 'Parte al primo clic nella pagina.';
  };
  l.onCambio = aggiorna;
  tasto.addEventListener('click', () => {
    const aperto = pannello.hidden;
    pannello.hidden = !aperto;
    tasto.setAttribute('aria-expanded', String(aperto));
    aggiorna();
  });
  muto.addEventListener('click', () => l.silenzia(!l.prefs.muto));
  cursori.forEach((c) => c.addEventListener('input', () => l.volume(c.dataset['canale'] as Volume, Number(c.value))));
  // il cursore degli effetti fa sentire un colpo quando lo lasci, per sapere quanto è forte
  box.querySelector('[data-canale=effetti]')?.addEventListener('change', () => l.effetto('colpo'));
  document.addEventListener('click', (e) => {
    if (!pannello.hidden && !e.composedPath().includes(box)) { pannello.hidden = true; tasto.setAttribute('aria-expanded', 'false'); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pannello.hidden) { pannello.hidden = true; tasto.setAttribute('aria-expanded', 'false'); tasto.focus(); } });
  // il primo gesto ovunque nella pagina fa partire l'audio; si riprova a ogni gesto finché il browser non lo concede
  const gesti = ['pointerdown', 'pointerup', 'click', 'touchend', 'keydown'] as const;
  const primo = () => {
    l.avvia(); aggiorna();
    if (l.inFunzione() || l.prefs.muto) for (const g of gesti) document.removeEventListener(g, primo, true);
  };
  for (const g of gesti) document.addEventListener(g, primo, true);
  document.addEventListener('visibilitychange', () => l.visibilita(document.visibilityState === 'visible'));
  aggiorna();
}
