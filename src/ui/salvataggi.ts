// Il salvataggio: un solo personaggio per account Google, nella tabella `salvataggi` su Supabase (docs/salvataggi.md).
// Nel browser non resta nessuna copia del personaggio, solo i gettoni del login. L'account è l'unica verità.
//
// Ogni salvataggio porta un numero di versione (`rev`). Si scrive solo se nell'account c'è ancora la versione da cui si
// è partiti (un solo UPDATE con il filtro sulla versione, quindi atomico): un dispositivo rimasto indietro non può
// sovrascrivere i progressi fatti altrove, viene respinto e riprende la copia dell'account.
import type { Stato } from '../motore/personaggio';

export interface DatiSalvati {
  stato: Stato;
  vista?: unknown;
  scheda?: string;
  luogo?: string | null;
  salvatoAl: number; // ms, ora dell'ultima modifica: solo informativa, non decide niente
  rev: number; // versione nell'account
}

/** Quello che l'interfaccia deve sapere dell'account. */
export interface StatoArchivio {
  connesso: boolean;
  chi?: string; // nome o email
  ultimo?: number; // ultimo salvataggio riuscito
  errore?: string;
  scaduta?: boolean; // la sessione non vale più: bisogna rientrare con Google
}

/** Esito di una scrittura: 'superato' vuol dire che nell'account c'è già una versione successiva. */
export type Esito = 'ok' | 'superato';

export interface Archivio {
  chi?: string;
  leggi(): Promise<DatiSalvati | null>;
  rev(): Promise<number>; // versione nell'account, 0 se non c'è niente
  scrivi(d: DatiSalvati, base: number): Promise<Esito>; // d.rev è già base + 1
  esci(): Promise<void>;
}

export class SessioneScaduta extends Error {
  constructor() { super('La sessione è scaduta: rientra con Google.'); }
}

/** Il personaggio ha un'identità propria. */
export function idPersonaggio(s: Stato): string {
  const x = s as Stato & { id?: string };
  x.id ??= `${s.nome}-${s.origine}-${Math.random().toString(36).slice(2, 10)}`;
  return x.id;
}

/** La vista da salvare: senza la fotografia dello stato precedente, che raddoppierebbe il peso. */
export function vistaLeggera(vista: unknown): unknown {
  if (!vista || typeof vista !== 'object') return vista;
  const { prima: _prima, ...resto } = vista as Record<string, unknown>;
  return resto;
}

// ---------------------------------------------------------------- Supabase

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

  const rinnova = async (): Promise<void> => {
    // un'altra scheda può aver già rinnovato: il gettone di rinnovo vecchio non vale più, si usa il suo
    const altrove = leggiSessione();
    if (altrove && altrove.access_token !== sess!.access_token && altrove.scade - Date.now() > 60_000) { sess = altrove; return; }
    const r = await chiama(`${cfg.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: cfg.chiave, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: sess!.refresh_token }),
    });
    if (!r.ok) {
      if (r.status >= 400 && r.status < 500) { scriviSessione(null); sess = null; throw new SessioneScaduta(); }
      throw new Error(`Rinnovo dell'accesso non riuscito (${r.status}).`);
    }
    const j = await r.json() as { access_token: string; refresh_token: string; expires_in: number };
    sess = { access_token: j.access_token, refresh_token: j.refresh_token, scade: Date.now() + j.expires_in * 1000 };
    scriviSessione(sess);
  };
  const intestazioni = async (): Promise<Record<string, string>> => {
    if (!sess) throw new SessioneScaduta();
    if (sess.scade - Date.now() < 60_000) await rinnova();
    return { apikey: cfg.chiave, Authorization: `Bearer ${sess!.access_token}`, 'Content-Type': 'application/json' };
  };
  const controlla = (r: Response, cosa: string) => {
    if (r.status === 401) { scriviSessione(null); sess = null; throw new SessioneScaduta(); }
    if (!r.ok) throw new Error(`${cosa} non riuscito (${r.status}).`);
  };

  let u: Response;
  try { u = await chiama(`${cfg.url}/auth/v1/user`, { headers: await intestazioni() }); } catch (e) {
    if (e instanceof SessioneScaduta) return null;
    throw e;
  }
  if (!u.ok) { if (u.status < 500) { scriviSessione(null); return null; } throw new Error(`Accesso non riuscito (${u.status}).`); }
  const utente = await u.json() as { id: string; email?: string; user_metadata?: { full_name?: string; name?: string } };
  const riga = `${cfg.url}/rest/v1/salvataggi?utente=eq.${utente.id}`;

  return {
    chi: utente.user_metadata?.full_name || utente.user_metadata?.name || utente.email,
    async leggi() {
      const r = await chiama(`${riga}&select=dati`, { headers: await intestazioni() });
      controlla(r, 'Caricamento');
      const righe = await r.json() as { dati: DatiSalvati }[];
      const d = righe[0]?.dati;
      return d ? { ...d, rev: Number(d.rev) || 0 } : null;
    },
    async rev() {
      const r = await chiama(`${riga}&select=rev:dati->rev`, { headers: await intestazioni() });
      controlla(r, 'Controllo');
      const righe = await r.json() as { rev: number | null }[];
      return Number(righe[0]?.rev) || 0;
    },
    async scrivi(d, base) {
      const corpo = { dati: { ...d, vista: vistaLeggera(d.vista) }, aggiornato: new Date().toISOString() };
      // base 0: la riga non c'è, o è un salvataggio di prima delle versioni (senza rev)
      const filtro = base === 0 ? 'dati->>rev=is.null' : `dati->>rev=eq.${base}`;
      const r = await chiama(`${riga}&${filtro}&select=utente`, {
        method: 'PATCH', headers: { ...(await intestazioni()), Prefer: 'return=representation' }, body: JSON.stringify(corpo),
      });
      controlla(r, 'Salvataggio');
      if (((await r.json()) as unknown[]).length) return 'ok';
      if (base !== 0) return 'superato';
      // nessuna riga: un inserimento, che fallisce se un altro dispositivo l'ha appena creata
      const n = await chiama(`${cfg.url}/rest/v1/salvataggi`, {
        method: 'POST', headers: { ...(await intestazioni()), Prefer: 'return=minimal' }, body: JSON.stringify({ utente: utente.id, ...corpo }),
      });
      if (n.status === 409) return 'superato';
      controlla(n, 'Salvataggio');
      return 'ok';
    },
    async esci() {
      try { await chiama(`${cfg.url}/auth/v1/logout`, { method: 'POST', headers: await intestazioni() }); } catch { /* esco comunque */ }
      scriviSessione(null);
    },
  };
}

// ---------------------------------------------------------------- sincronizzazione

/**
 * Tiene il personaggio in gioco allineato con l'account. `segnala` va chiamato a ogni mossa: scrive dopo un attimo di
 * quiete (una scrittura alla volta), `subito` scrive adesso. `controlla` guarda se un altro dispositivo ha salvato.
 */
export class Sincronia {
  stato: StatoArchivio = { connesso: false };
  private archivio: Archivio | null = null;
  private rev = 0; // la versione dell'account da cui parte il personaggio in gioco
  private inAttesa: DatiSalvati | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private scrivendo: Promise<void> | null = null;

  /**
   * `onCambio`: lo stato è cambiato (ridisegnare l'indicatore). `onRemoto`: nell'account c'è una versione più recente,
   * salvata da un altro dispositivo: va ripresa al posto di quella in gioco. `onScaduta`: bisogna rientrare con Google.
   */
  constructor(
    private onCambio: () => void,
    private onRemoto: (d: DatiSalvati) => void = () => {},
    private onScaduta: () => void = () => {},
    private ritardo = 1500,
  ) {}

  /** Collega l'account e torna il personaggio che vi è salvato (null se non ce n'è). */
  async collega(trova: () => Promise<Archivio | null>): Promise<DatiSalvati | null> {
    this.stato = { connesso: false };
    try {
      this.archivio = await trova();
      if (!this.archivio) { this.onCambio(); return null; }
      this.stato.chi = this.archivio.chi;
      const remoto = await this.archivio.leggi();
      this.rev = remoto?.rev ?? 0;
      this.stato.connesso = true;
      this.stato.ultimo = remoto?.salvatoAl;
      this.onCambio();
      return remoto;
    } catch (e) {
      this.archivio = null;
      this.stato.errore = (e as Error).message;
      this.onCambio();
      return null;
    }
  }

  get connesso(): boolean { return this.stato.connesso; }

  segnala(d: DatiSalvati | null): void {
    if (!d || !this.archivio || !this.stato.connesso) return;
    this.inAttesa = d;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.scarica(), this.ritardo);
  }

  subito(): Promise<void> {
    clearTimeout(this.timer);
    return this.scarica();
  }

  /** Al ritorno sulla pagina e a intervalli: se un altro dispositivo ha salvato, si riprende da lì. */
  async controlla(): Promise<void> {
    if (!this.archivio || !this.stato.connesso) return;
    if (this.inAttesa || this.scrivendo) { await this.subito(); return; } // la scrittura stessa scopre se è rimasta indietro
    try {
      const r = await this.archivio.rev();
      if (r !== this.rev && !this.inAttesa && !this.scrivendo) await this.riprendi();
    } catch (e) { this.errore(e); }
  }

  /** Esce dall'account dopo aver scritto quello che era in attesa. Torna true se l'account ha l'ultima mossa. */
  async esci(): Promise<boolean> {
    await this.subito();
    const allineato = this.stato.connesso && !this.stato.errore && !this.inAttesa;
    await this.archivio?.esci();
    this.archivio = null;
    this.inAttesa = null;
    this.rev = 0;
    this.stato = { connesso: false };
    this.onCambio();
    return allineato;
  }

  private async riprendi(): Promise<void> {
    const remoto = await this.archivio!.leggi();
    this.inAttesa = null;
    clearTimeout(this.timer);
    this.rev = remoto?.rev ?? 0;
    if (remoto) { this.stato.ultimo = remoto.salvatoAl; this.onRemoto(remoto); }
    this.onCambio();
  }

  private scarica(): Promise<void> {
    if (this.scrivendo) return this.scrivendo.then(() => (this.inAttesa ? this.scarica() : undefined));
    if (!this.inAttesa || !this.archivio) return Promise.resolve();
    this.scrivendo = this.scrivi().finally(() => { this.scrivendo = null; });
    return this.scrivendo.then(() => (this.inAttesa ? this.scarica() : undefined));
  }

  private async scrivi(): Promise<void> {
    const d = this.inAttesa!;
    this.inAttesa = null;
    const base = this.rev;
    try {
      const esito = await this.archivio!.scrivi({ ...d, rev: base + 1 }, base);
      if (esito === 'ok') {
        this.rev = base + 1;
        this.stato.ultimo = d.salvatoAl;
        delete this.stato.errore;
        this.onCambio();
      } else {
        // un altro dispositivo ha salvato nel frattempo: vale la sua copia, e le mosse fatte qui da allora si perdono
        await this.riprendi();
      }
    } catch (e) {
      if (!this.inAttesa) this.inAttesa = d; // rete assente: si riprova alla prossima mossa o fra poco
      clearTimeout(this.timer);
      if (!(e instanceof SessioneScaduta)) this.timer = setTimeout(() => void this.scarica(), 10_000);
      this.errore(e);
    }
  }

  private errore(e: unknown): void {
    if (e instanceof SessioneScaduta) {
      this.stato.connesso = false;
      this.stato.scaduta = true;
      this.stato.errore = e.message;
      this.onCambio();
      this.onScaduta();
      return;
    }
    this.stato.errore = (e as Error).message || 'Salvataggio nell\'account non riuscito.';
    this.onCambio();
  }
}
