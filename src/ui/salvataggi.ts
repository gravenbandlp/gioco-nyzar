// Il salvataggio nell'account. Il personaggio resta sempre anche nel browser (localStorage, in main.ts); qui sta la
// copia remota, che permette di riprenderlo da un altro dispositivo. Gli archivi possibili sono due:
// - dentro l'Artifact di claude.ai: la base dati dell'Artifact (capacità `db` e `user`), nel sottoalbero privato di chi
//   gioca, data/users/<id>/. Salva chi ha un account claude.ai con accesso in scrittura alla pagina (il proprietario e
//   chi è invitato per email come Editor); chi entra da un link pubblico resta al salvataggio nel browser.
// - fuori da claude.ai, su un sito proprio: Supabase con l'accesso Google, se il build ha VITE_SUPABASE_URL e
//   VITE_SUPABASE_CHIAVE (docs/salvataggi.md). Senza configurazione l'opzione non compare.
// In più, per tutti: scaricare il salvataggio su file e ricaricarlo.
import type { Stato } from '../motore/personaggio';
import type { PaginaDiario } from '../motore/diario';

export interface DatiSalvati {
  stato: Stato;
  vista?: unknown;
  scheda?: string;
  luogo?: string;
  salvatoAl: number; // ms, ora dell'ultima modifica del personaggio
}

export type TipoArchivio = 'claude' | 'google';

/** Quello che l'interfaccia deve sapere dell'archivio remoto. */
export interface StatoArchivio {
  tipo: TipoArchivio | null; // null: nessun archivio remoto in questa pagina
  connesso: boolean; // identificato e con un salvataggio remoto funzionante
  chi?: string; // nome o email, se l'archivio lo dà
  ultimo?: number; // ultimo salvataggio remoto riuscito
  errore?: string;
  conflitto?: { remoto: DatiSalvati }; // nell'account c'è un altro personaggio: decide il giocatore
}

export interface Archivio {
  tipo: TipoArchivio;
  chi?: string;
  leggi(): Promise<DatiSalvati | null>;
  ultimo(): Promise<number | null>; // quando è stata salvata la copia remota, senza scaricarla tutta
  scrivi(d: DatiSalvati): Promise<void>;
  esci?(): Promise<void>;
}

// ---------------------------------------------------------------- forma del salvataggio

/** Il personaggio ha un'identità propria, per distinguere "lo stesso personaggio più avanti" da "un altro personaggio". */
export function idPersonaggio(s: Stato): string {
  const x = s as Stato & { id?: string };
  x.id ??= `${s.nome}-${s.origine}-${Math.random().toString(36).slice(2, 10)}`;
  return x.id;
}

/** Per i confronti: l'identità se c'è, altrimenti nome e origine (salvataggi di prima che l'identità esistesse). */
const identita = (s: Stato) => (s as Stato & { id?: string }).id ?? `${s.nome}|${s.origine}`;

/** La vista da tenere nella copia remota: senza la fotografia dello stato precedente, che raddoppierebbe il peso. */
export function vistaLeggera(vista: unknown): unknown {
  if (!vista || typeof vista !== 'object') return vista;
  const { prima: _prima, ...resto } = vista as Record<string, unknown>;
  return resto;
}

/** Il diario può superare il limite di un documento: lo si spezza in blocchi sotto questa misura. */
export const BLOCCO_MAX = 150_000;

export function blocchiDiario(pagine: PaginaDiario[], max = BLOCCO_MAX): PaginaDiario[][] {
  const blocchi: PaginaDiario[][] = [];
  let attuale: PaginaDiario[] = [];
  let peso = 0;
  for (const p of pagine) {
    const w = JSON.stringify(p).length + 1;
    if (attuale.length && peso + w > max) { blocchi.push(attuale); attuale = []; peso = 0; }
    attuale.push(p);
    peso += w;
  }
  if (attuale.length) blocchi.push(attuale);
  return blocchi;
}

/**
 * Cosa fare quando arriva la copia remota.
 * - 'scrivi': nell'account non c'è niente, o c'è una versione più vecchia dello stesso personaggio.
 * - 'adotta': nell'account c'è una versione più recente dello stesso personaggio, o qui non c'è nessun personaggio.
 * - 'conflitto': sono due personaggi diversi, sceglie il giocatore.
 * - 'niente': sono uguali.
 */
export function confronta(locale: DatiSalvati | null, remoto: DatiSalvati | null): 'scrivi' | 'adotta' | 'conflitto' | 'niente' {
  if (!remoto) return locale ? 'scrivi' : 'niente';
  if (!locale) return 'adotta';
  if (identita(locale.stato) !== identita(remoto.stato)) return 'conflitto';
  if (remoto.salvatoAl > locale.salvatoAl) return 'adotta';
  if (remoto.salvatoAl < locale.salvatoAl) return 'scrivi';
  return 'niente';
}

// ---------------------------------------------------------------- file

export const FORMATO_FILE = 'nyzar-salvataggio';

export function aFile(d: DatiSalvati): string {
  return JSON.stringify({ formato: FORMATO_FILE, ...d, vista: vistaLeggera(d.vista) });
}

/** Legge un file di salvataggio; null se non lo è. */
export function daFile(testo: string): DatiSalvati | null {
  try {
    const d = JSON.parse(testo) as Partial<DatiSalvati> & { formato?: string };
    if (d.formato !== FORMATO_FILE || d.stato?.versione !== 1 || typeof d.stato.nome !== 'string') return null;
    return { stato: d.stato, vista: d.vista, scheda: d.scheda, luogo: d.luogo, salvatoAl: Number(d.salvatoAl) || Date.now() };
  } catch {
    return null;
  }
}

export function nomeFile(d: DatiSalvati): string {
  const nome = d.stato.nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'personaggio';
  const giorno = new Date(d.salvatoAl).toISOString().slice(0, 10);
  return `nyzar-${nome}-${giorno}.json`;
}

// ---------------------------------------------------------------- claude.ai (Artifact)

interface DocRef {
  get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
  set(d: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
  collection(p: string): { doc(id: string): DocRef };
}
interface DbCap { doc(path: string): DocRef }
interface UserCap { id(): Promise<string | null>; me(): Promise<{ name: string }> }
interface ClaudeUse { use(nome: string): Promise<unknown> }

export const dentroClaude = (): boolean => typeof (window as unknown as { claude?: ClaudeUse }).claude?.use === 'function';

/** Archivio nella base dati dell'Artifact; null se la pagina non è un Artifact o chi guarda non ha un'identità. */
export async function archivioClaude(): Promise<Archivio | null> {
  const cl = (window as unknown as { claude?: ClaudeUse }).claude;
  if (!cl?.use) return null;
  const [db, user] = (await Promise.all([cl.use('db'), cl.use('user')])) as [DbCap | null, UserCap | null];
  if (!db || !user) return null;
  const id = await user.id();
  if (!id) return null;
  const chi = (await user.me()).name || undefined;
  return archivioSuDb(db, id, chi);
}

/** Separato da archivioClaude per poterlo provare con una base dati finta. */
export function archivioSuDb(db: DbCap, idUtente: string, chi?: string): Archivio {
  const base = db.doc(`data/users/${idUtente}/salvataggio`);
  const blocco = (i: number) => base.collection('diario').doc(`b${i}`);
  const scritti = new Map<number, string>(); // l'ultimo contenuto scritto per ogni blocco del diario
  let quantiBlocchi = 0;
  return {
    tipo: 'claude',
    chi,
    async leggi() {
      const snap = await base.get();
      if (!snap.exists) return null;
      const d = snap.data() as unknown as DatiSalvati & { blocchiDiario?: number };
      const n = d.blocchiDiario ?? 0;
      const diario: PaginaDiario[] = [];
      for (let i = 0; i < n; i++) {
        const b = await blocco(i).get();
        const pagine = (b.data()?.pagine ?? []) as PaginaDiario[];
        scritti.set(i, JSON.stringify(pagine));
        diario.push(...pagine);
      }
      quantiBlocchi = n;
      const stato = { ...d.stato, diario } as Stato;
      return { stato, vista: d.vista, scheda: d.scheda, luogo: d.luogo, salvatoAl: d.salvatoAl };
    },
    async ultimo() {
      const snap = await base.get();
      return snap.exists ? Number(snap.data()?.salvatoAl) || null : null;
    },
    async scrivi(d) {
      const { diario = [], ...senzaDiario } = d.stato;
      const blocchi = blocchiDiario(diario);
      for (let i = 0; i < blocchi.length; i++) {
        const json = JSON.stringify(blocchi[i]);
        if (scritti.get(i) === json) continue;
        await blocco(i).set({ pagine: blocchi[i]! });
        scritti.set(i, json);
      }
      for (let i = blocchi.length; i < quantiBlocchi; i++) { await blocco(i).delete(); scritti.delete(i); }
      quantiBlocchi = blocchi.length;
      let vista = vistaLeggera(d.vista);
      const corpo = () => ({ stato: senzaDiario, vista, scheda: d.scheda ?? null, luogo: d.luogo ?? null, salvatoAl: d.salvatoAl, blocchiDiario: blocchi.length });
      if (JSON.stringify(corpo()).length > 240_000) vista = { tipo: 'area' }; // un combattimento enorme non deve bloccare il salvataggio
      await base.set(JSON.parse(JSON.stringify(corpo())) as Record<string, unknown>);
    },
  };
}

// ---------------------------------------------------------------- Google (Supabase), fuori da claude.ai

interface Env { VITE_SUPABASE_URL?: string; VITE_SUPABASE_CHIAVE?: string }
const ENV: Env = ((import.meta as unknown as { env?: Env }).env) ?? {};

export interface ConfigSupabase { url: string; chiave: string }

export function configSupabase(env: Env = ENV): ConfigSupabase | null {
  const url = env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const chiave = env.VITE_SUPABASE_CHIAVE;
  return url && chiave ? { url, chiave } : null;
}

interface Sessione { access_token: string; refresh_token: string; scade: number }
const CHIAVE_SESSIONE = 'gioco-nyzar/sessione';

function leggiSessione(): Sessione | null {
  try { return JSON.parse(localStorage.getItem(CHIAVE_SESSIONE) ?? 'null') as Sessione | null; } catch { return null; }
}
function scriviSessione(s: Sessione | null): void {
  try { if (s) localStorage.setItem(CHIAVE_SESSIONE, JSON.stringify(s)); else localStorage.removeItem(CHIAVE_SESSIONE); } catch { /* niente */ }
}

/** Al ritorno dal login Google, Supabase mette i gettoni nel frammento dell'indirizzo: li prendo e lo ripulisco. */
export function sessioneDaIndirizzo(hash = location.hash, ora = Date.now()): Sessione | null {
  if (!hash.includes('access_token=')) return null;
  const p = new URLSearchParams(hash.slice(1));
  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token, scade: ora + (Number(p.get('expires_in')) || 3600) * 1000 };
}

export function entraConGoogle(cfg: ConfigSupabase): void {
  const ritorno = location.origin + location.pathname;
  location.href = `${cfg.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(ritorno)}`;
}

/** Archivio su Supabase; null se non c'è una sessione valida. `chiama` è fetch, sostituibile nei test. */
export async function archivioGoogle(cfg: ConfigSupabase, chiama: typeof fetch = fetch.bind(window)): Promise<Archivio | null> {
  const dalLogin = sessioneDaIndirizzo();
  if (dalLogin) { scriviSessione(dalLogin); history.replaceState(null, '', location.pathname + location.search); }
  let sess = leggiSessione();
  if (!sess) return null;

  const rinnova = async (): Promise<boolean> => {
    const r = await chiama(`${cfg.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: cfg.chiave, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: sess!.refresh_token }),
    });
    if (!r.ok) { scriviSessione(null); sess = null; return false; }
    const j = await r.json() as { access_token: string; refresh_token: string; expires_in: number };
    sess = { access_token: j.access_token, refresh_token: j.refresh_token, scade: Date.now() + j.expires_in * 1000 };
    scriviSessione(sess);
    return true;
  };
  const intestazioni = async (): Promise<Record<string, string>> => {
    if (sess && sess.scade - Date.now() < 60_000) await rinnova();
    if (!sess) throw new Error('Sessione scaduta: entra di nuovo con Google.');
    return { apikey: cfg.chiave, Authorization: `Bearer ${sess.access_token}`, 'Content-Type': 'application/json' };
  };

  const u = await chiama(`${cfg.url}/auth/v1/user`, { headers: await intestazioni().catch(() => ({})) });
  if (!u.ok) { scriviSessione(null); return null; }
  const utente = await u.json() as { id: string; email?: string; user_metadata?: { full_name?: string; name?: string } };
  const chi = utente.user_metadata?.full_name || utente.user_metadata?.name || utente.email;

  return {
    tipo: 'google',
    chi,
    async leggi() {
      const r = await chiama(`${cfg.url}/rest/v1/salvataggi?select=dati&utente=eq.${utente.id}`, { headers: await intestazioni() });
      if (!r.ok) throw new Error(`Lettura non riuscita (${r.status}).`);
      const righe = await r.json() as { dati: DatiSalvati }[];
      return righe[0]?.dati ?? null;
    },
    async ultimo() {
      const r = await chiama(`${cfg.url}/rest/v1/salvataggi?select=aggiornato&utente=eq.${utente.id}`, { headers: await intestazioni() });
      if (!r.ok) return null;
      const righe = await r.json() as { aggiornato: string }[];
      return righe[0] ? Date.parse(righe[0].aggiornato) : null;
    },
    async scrivi(d) {
      const r = await chiama(`${cfg.url}/rest/v1/salvataggi`, {
        method: 'POST',
        headers: { ...(await intestazioni()), Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ utente: utente.id, dati: { ...d, vista: vistaLeggera(d.vista) }, aggiornato: new Date(d.salvatoAl).toISOString() }),
      });
      if (!r.ok) throw new Error(`Salvataggio non riuscito (${r.status}).`);
    },
    async esci() {
      try { await chiama(`${cfg.url}/auth/v1/logout`, { method: 'POST', headers: await intestazioni() }); } catch { /* esco comunque */ }
      scriviSessione(null);
    },
  };
}

// ---------------------------------------------------------------- sincronizzazione

/**
 * Tiene allineata la copia remota con quella del browser. `segnala` va chiamato a ogni salvataggio locale: scrive
 * dopo qualche secondo di quiete (una scrittura alla volta), `subito` scrive adesso (pagina nascosta).
 */
export class Sincronia {
  stato: StatoArchivio = { tipo: null, connesso: false };
  private archivio: Archivio | null = null;
  private inAttesa: DatiSalvati | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private scrivendo = false;

  /**
   * `onCambio`: lo stato dell'archivio è cambiato (ridisegnare l'indicatore). `onRemoto`: nell'account c'è una versione
   * più recente dello stesso personaggio, salvata da un altro dispositivo: va ripresa al posto di quella in gioco.
   */
  constructor(private onCambio: () => void, private onRemoto: (d: DatiSalvati) => void = () => {}, private ritardo = 4000) {}

  /** Collega l'archivio e confronta con il salvataggio locale. Torna i dati remoti se vanno adottati. */
  async collega(trova: () => Promise<Archivio | null>, tipo: TipoArchivio, locale: DatiSalvati | null): Promise<DatiSalvati | null> {
    this.stato = { tipo, connesso: false };
    try {
      this.archivio = await trova();
    } catch (e) {
      this.stato.errore = (e as Error).message;
    }
    if (!this.archivio) { this.onCambio(); return null; }
    this.stato.chi = this.archivio.chi;
    let remoto: DatiSalvati | null = null;
    try {
      remoto = await this.archivio.leggi();
    } catch (e) {
      this.stato.errore = (e as Error).message;
      this.onCambio();
      return null;
    }
    this.stato.connesso = true;
    const decisione = confronta(locale, remoto);
    if (decisione === 'conflitto') this.stato.conflitto = { remoto: remoto! };
    if (decisione === 'scrivi' && locale) await this.scrivi(locale);
    if (decisione === 'adotta' || decisione === 'niente') this.stato.ultimo = remoto?.salvatoAl;
    this.onCambio();
    return decisione === 'adotta' ? remoto : null;
  }

  segnala(d: DatiSalvati | null): void {
    if (!d || !this.archivio || !this.stato.connesso || this.stato.conflitto) return;
    this.inAttesa = d;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.scarica(), this.ritardo);
  }

  subito(): void {
    clearTimeout(this.timer);
    void this.scarica();
  }

  /** Il giocatore ha scelto quale personaggio tenere: si scrive anche sopra una copia remota più recente. */
  risolvi(tieni: DatiSalvati): void {
    delete this.stato.conflitto;
    void this.scrivi(tieni, true);
  }

  /** Al ritorno sulla pagina: se un altro dispositivo ha salvato dopo, si riprende da lì. */
  async controlla(locale: DatiSalvati | null): Promise<void> {
    if (!locale || !this.archivio || !this.stato.connesso || this.stato.conflitto || this.scrivendo || this.inAttesa) return;
    const ts = await this.archivio.ultimo().catch(() => null);
    if (!ts || ts <= locale.salvatoAl) return;
    await this.riprendi(locale);
  }

  private async riprendi(locale: DatiSalvati): Promise<void> {
    const remoto = await this.archivio!.leggi().catch(() => null);
    if (!remoto) return;
    const decisione = confronta(locale, remoto);
    if (decisione === 'conflitto') { this.stato.conflitto = { remoto }; this.onCambio(); }
    else if (decisione === 'adotta') { this.stato.ultimo = remoto.salvatoAl; this.inAttesa = null; this.onRemoto(remoto); }
  }

  async esci(): Promise<void> {
    await this.archivio?.esci?.();
    this.archivio = null;
    this.stato = { tipo: this.stato.tipo, connesso: false };
    this.onCambio();
  }

  private async scarica(): Promise<void> {
    if (!this.inAttesa || this.scrivendo) return;
    const d = this.inAttesa;
    this.inAttesa = null;
    await this.scrivi(d);
    if (this.inAttesa) void this.scarica();
  }

  private async scrivi(d: DatiSalvati, forza = false): Promise<void> {
    if (!this.archivio) return;
    this.scrivendo = true;
    try {
      if (!forza) {
        // un altro dispositivo ha salvato dopo l'ultima modifica fatta qui: non lo sovrascrivo, riprendo la sua copia
        const ts = await this.archivio.ultimo();
        if (ts && ts > d.salvatoAl) { this.scrivendo = false; await this.riprendi(d); return; }
      }
      await this.archivio.scrivi(d);
      this.stato.ultimo = d.salvatoAl;
      delete this.stato.errore;
    } catch (e) {
      const codice = (e as { code?: string }).code;
      if (codice === 'invalid_argument' && this.stato.tipo === 'claude') {
        // chi guarda non può scrivere nemmeno nel proprio spazio (per esempio è entrato da un link pubblico)
        this.stato.connesso = false;
        this.stato.errore = 'Da questo accesso alla pagina non si può salvare nell\'account.';
      } else {
        this.stato.errore = (e as Error).message || 'Salvataggio nell\'account non riuscito.';
      }
    } finally {
      this.scrivendo = false;
      this.onCambio();
    }
  }
}
