// Il salvataggio: un solo personaggio nell'account Google su Supabase, con le versioni che impediscono a un dispositivo
// rimasto indietro di sovrascrivere i progressi fatti altrove. Il client Supabase gira contro un server finto.
import { describe, it, expect, beforeEach } from 'vitest';
import { nuovoPersonaggio } from '../src/motore/personaggio';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { archivioGoogle, idPersonaggio, sessioneDaIndirizzo, Sincronia, type DatiSalvati } from '../src/ui/salvataggi';

const cfg = { url: 'https://progetto.supabase.co', chiave: 'chiave-pubblica' };
const pg = (nome = 'Vessa') => { const s = nuovoPersonaggio(nome, c.origini[0]!, 0, 'citta-bassa'); idPersonaggio(s); return s; };
const dati = (stato = pg(), salvatoAl = 1000): DatiSalvati => ({ stato, vista: { tipo: 'area' }, scheda: 'storia', salvatoAl, rev: 0 });

/** Un Supabase in memoria: una riga per utente, PATCH con il filtro sulla versione come PostgREST. */
function supabaseFinto() {
  const righe = new Map<string, { dati: DatiSalvati }>();
  const chiamate: string[] = [];
  const ok = (body: unknown, status = 200) => ({ ok: status < 300, status, json: async () => body }) as Response;
  const fetchFinto = (utente: string) => (async (url: string, init?: RequestInit) => {
    const metodo = init?.method ?? 'GET';
    const percorso = url.replace(cfg.url, '');
    chiamate.push(`${metodo} ${percorso}`);
    expect((init?.headers as Record<string, string>)?.['apikey']).toBe(cfg.chiave);
    if (percorso === '/auth/v1/user') return ok({ id: utente, email: `${utente}@example.com`, user_metadata: { full_name: 'Luca' } });
    if (percorso === '/auth/v1/logout') return ok({});
    const q = new URLSearchParams(percorso.split('?')[1] ?? '');
    const riga = righe.get(utente);
    if (metodo === 'GET' && q.get('select') === 'dati') return ok(riga ? [{ dati: structuredClone(riga.dati) }] : []);
    if (metodo === 'GET' && q.get('select') === 'rev:dati->rev') return ok(riga ? [{ rev: riga.dati.rev ?? null }] : []);
    if (metodo === 'POST') {
      if (riga) return ok({ code: '23505' }, 409);
      const b = JSON.parse(String(init!.body)) as { utente: string; dati: DatiSalvati };
      righe.set(b.utente, { dati: b.dati });
      return ok(null, 201);
    }
    if (metodo === 'PATCH') {
      const filtro = q.get('dati->>rev')!;
      const vale = filtro === 'is.null' ? riga?.dati.rev == null : String(riga?.dati.rev) === filtro.replace('eq.', '');
      if (!riga || !vale) return ok([]);
      riga.dati = (JSON.parse(String(init!.body)) as { dati: DatiSalvati }).dati;
      return ok([{ utente }]);
    }
    return ok({}, 404);
  }) as typeof fetch;
  return { righe, chiamate, fetchFinto };
}

/** Un dispositivo: la sua memoria del browser (solo il login) e la sua sincronia. */
function dispositivo(server: ReturnType<typeof supabaseFinto>, utente = 'uid-1') {
  const memoria: Record<string, string> = { 'gioco-nyzar/sessione': JSON.stringify({ access_token: 'AT', refresh_token: 'RT', scade: Date.now() + 3_600_000 }) };
  const ripresi: DatiSalvati[] = [];
  const sincro = new Sincronia(() => {}, (d) => ripresi.push(d), () => {}, 0);
  const usa = () => Object.assign(globalThis, {
    localStorage: { getItem: (k: string) => memoria[k] ?? null, setItem: (k: string, v: string) => { memoria[k] = v; }, removeItem: (k: string) => { delete memoria[k]; } },
  });
  return {
    sincro, ripresi, memoria,
    async collega() { usa(); return sincro.collega(() => archivioGoogle(cfg, server.fetchFinto(utente))); },
    async mossa(d: DatiSalvati) { usa(); sincro.segnala(d); await sincro.subito(); },
    async controlla() { usa(); await sincro.controlla(); },
  };
}

describe('salvataggio nell\'account Google', () => {
  beforeEach(() => {
    Object.assign(globalThis, {
      location: { hash: '', pathname: '/', search: '', origin: 'https://gioco-nyzar.pages.dev' },
      history: { replaceState: () => {} },
    });
  });

  it('legge i gettoni dal ritorno del login', () => {
    expect(sessioneDaIndirizzo('#access_token=A&refresh_token=R&expires_in=10', 0)).toEqual({ access_token: 'A', refresh_token: 'R', scade: 10_000 });
    expect(sessioneDaIndirizzo('#altro=1')).toBeNull();
  });

  it('senza sessione non c\'è archivio', async () => {
    Object.assign(globalThis, { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });
    expect(await archivioGoogle(cfg, (async () => { throw new Error('non dovrebbe chiamare'); }) as typeof fetch)).toBeNull();
  });

  it('il primo personaggio si crea nell\'account, poi ogni mossa alza la versione', async () => {
    const server = supabaseFinto();
    const pc = dispositivo(server);
    expect(await pc.collega()).toBeNull();
    const s = pg();
    await pc.mossa(dati(s, 1));
    expect(server.righe.get('uid-1')!.dati.rev).toBe(1);
    await pc.mossa(dati(s, 2));
    expect(server.righe.get('uid-1')!.dati.rev).toBe(2);
    expect(server.righe.get('uid-1')!.dati.stato).toEqual(s);
  });

  it('un altro dispositivo riprende il personaggio dall\'account', async () => {
    const server = supabaseFinto();
    const pc = dispositivo(server);
    await pc.collega();
    const s = pg('Daeran');
    await pc.mossa(dati(s, 1));
    const telefono = dispositivo(server);
    const preso = await telefono.collega();
    expect(preso!.stato.nome).toBe('Daeran');
    expect(preso!.rev).toBe(1);
  });

  it('un dispositivo rimasto indietro non sovrascrive: la sua mossa è respinta e riprende la copia dell\'account', async () => {
    const server = supabaseFinto();
    const pc = dispositivo(server);
    await pc.collega();
    const s = pg('Daeran');
    await pc.mossa(dati(s, 1));
    const portatile = dispositivo(server);
    await portatile.collega(); // versione 1
    await pc.mossa(dati({ ...s, nome: 'A' }, 2)); // il PC va avanti: versione 2
    // il portatile, con l'orologio avanti di un giorno, fa una mossa dalla versione 1
    await portatile.mossa(dati({ ...s, nome: 'B' }, 2 + 86_400_000));
    expect(server.righe.get('uid-1')!.dati.stato.nome).toBe('A');
    expect(portatile.ripresi.at(-1)!.stato.nome).toBe('A');
    // e da lì in poi scrive sopra la versione giusta
    await portatile.mossa(dati({ ...s, nome: 'C' }, 3));
    expect(server.righe.get('uid-1')!.dati).toMatchObject({ rev: 3 });
    expect(server.righe.get('uid-1')!.dati.stato.nome).toBe('C');
  });

  it('tornando sulla pagina si scopre che un altro dispositivo ha salvato', async () => {
    const server = supabaseFinto();
    const pc = dispositivo(server);
    await pc.collega();
    const s = pg();
    await pc.mossa(dati(s, 1));
    const telefono = dispositivo(server);
    await telefono.collega();
    await telefono.controlla();
    expect(telefono.ripresi).toHaveLength(0); // niente di nuovo
    await pc.mossa(dati({ ...s, nome: 'D' }, 2));
    await telefono.controlla();
    expect(telefono.ripresi.at(-1)!.stato.nome).toBe('D');
  });

  it('un salvataggio di prima delle versioni si riprende e si sovrascrive', async () => {
    const server = supabaseFinto();
    const s = pg();
    const vecchio = dati(s, 5) as Partial<DatiSalvati>;
    delete vecchio.rev;
    server.righe.set('uid-1', { dati: vecchio as DatiSalvati });
    const pc = dispositivo(server);
    expect((await pc.collega())!.rev).toBe(0);
    await pc.mossa(dati(s, 6));
    expect(pc.ripresi).toHaveLength(0);
    expect(server.righe.get('uid-1')!.dati.rev).toBe(1);
  });

  it('nel browser resta solo il login', async () => {
    const server = supabaseFinto();
    const pc = dispositivo(server);
    await pc.collega();
    await pc.mossa(dati(pg(), 1));
    expect(Object.keys(pc.memoria)).toEqual(['gioco-nyzar/sessione']);
  });

  it('uscendo dall\'account si scrive prima la mossa in attesa', async () => {
    const server = supabaseFinto();
    const pc = dispositivo(server);
    await pc.collega();
    const s = pg();
    pc.sincro.segnala(dati(s, 1));
    expect(await pc.sincro.esci()).toBe(true);
    expect(server.righe.get('uid-1')!.dati.stato).toEqual(s);
    expect(pc.memoria['gioco-nyzar/sessione']).toBeUndefined();
  });
});
