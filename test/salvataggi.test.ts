// Il salvataggio nell'account: forma dei dati, diario a blocchi, confronto fra copie, protezione dai dispositivi rimasti
// indietro, file, e il client Supabase con un server finto.
import { describe, it, expect, beforeEach } from 'vitest';
import { nuovoPersonaggio } from '../src/motore/personaggio';
import { CONTENUTI as c } from '../src/dati/contenuti';
import {
  blocchiDiario, confronta, aFile, daFile, nomeFile, archivioSuDb, archivioGoogle, idPersonaggio, sessioneDaIndirizzo, Sincronia,
  type DatiSalvati, type Archivio,
} from '../src/ui/salvataggi';
import type { PaginaDiario } from '../src/motore/diario';

const pg = (nome = 'Vessa') => { const s = nuovoPersonaggio(nome, c.origini[0]!, 0, 'citta-bassa'); idPersonaggio(s); return s; };
const dati = (stato = pg(), salvatoAl = 1000): DatiSalvati => ({ stato, vista: { tipo: 'area' }, scheda: 'storia', salvatoAl });
const pagina = (i: number, lunghezza = 3000): PaginaDiario => ({ quando: i, storylet: `s${i}`, scena: 'Scena', luogo: 'Qir-Azel', titolo: `T${i}`, testo: 'x'.repeat(lunghezza) });

/** Una base dati in memoria con la stessa forma della capacità `db` (solo quello che serve qui). */
function dbFinto() {
  const docs = new Map<string, Record<string, unknown>>();
  let scritture = 0;
  const ref = (path: string) => ({
    async get() { const d = docs.get(path); return { exists: !!d, data: () => (d ? structuredClone(d) : undefined) }; },
    async set(d: Record<string, unknown>) {
      if (JSON.stringify(d).length > 256 * 1024) throw Object.assign(new Error('troppo grande'), { code: 'invalid_argument' });
      scritture++; docs.set(path, structuredClone(d));
    },
    async delete() { docs.delete(path); },
    collection: (p: string) => ({ doc: (id: string) => ref(`${path}/${p}/${id}`) }),
  });
  return { db: { doc: ref }, docs, scritture: () => scritture };
}

describe('salvataggio nell\'account', () => {
  it('il diario si spezza in blocchi sotto il limite di un documento', () => {
    const pagine = Array.from({ length: 300 }, (_, i) => pagina(i));
    const blocchi = blocchiDiario(pagine);
    expect(blocchi.flat()).toEqual(pagine);
    for (const b of blocchi) expect(JSON.stringify(b).length).toBeLessThan(160_000);
  });

  it('confronto fra copia del browser e copia dell\'account', () => {
    const s = pg();
    expect(confronta(dati(s, 2000), null)).toBe('scrivi');
    expect(confronta(null, dati(s))).toBe('adotta');
    expect(confronta(dati(s, 1000), dati(structuredClone(s), 2000))).toBe('adotta');
    expect(confronta(dati(s, 3000), dati(structuredClone(s), 2000))).toBe('scrivi');
    expect(confronta(dati(s, 2000), dati(structuredClone(s), 2000))).toBe('niente');
    expect(confronta(dati(pg('Vessa')), dati(pg('Orsk')))).toBe('conflitto');
    // salvataggi di prima dell'identità: decide nome e origine
    const vecchio = structuredClone(s) as typeof s & { id?: string }; delete vecchio.id;
    const vecchio2 = structuredClone(vecchio);
    expect(confronta(dati(vecchio, 1), dati(vecchio2, 2))).toBe('adotta');
  });

  it('nella base dati dell\'Artifact il personaggio torna intero, diario compreso, e i blocchi inutili spariscono', async () => {
    const { db, docs, scritture } = dbFinto();
    const a = archivioSuDb(db, 'u_1');
    const s = pg();
    s.diario = Array.from({ length: 300 }, (_, i) => pagina(i));
    const d = { ...dati(s, 5000), vista: { tipo: 'risultato', id: 'x', prima: structuredClone(s) } };
    await a.scrivi(d);
    expect([...docs.keys()].every((k) => k.startsWith('data/users/u_1/'))).toBe(true);
    const letto = await archivioSuDb(db, 'u_1').leggi();
    expect(letto!.stato).toEqual(s);
    expect((letto!.vista as Record<string, unknown>)['prima']).toBeUndefined();
    expect(await a.ultimo()).toBe(5000);
    // una seconda scrittura senza cambi al diario riscrive solo il documento principale
    const prima = scritture();
    await a.scrivi({ ...d, salvatoAl: 6000 });
    expect(scritture() - prima).toBe(1);
    // il diario si accorcia: i blocchi in più vengono tolti
    s.diario = s.diario.slice(0, 5);
    await a.scrivi({ ...d, stato: s, salvatoAl: 7000 });
    expect([...docs.keys()].filter((k) => k.includes('/diario/')).length).toBe(1);
    expect((await archivioSuDb(db, 'u_1').leggi())!.stato.diario).toHaveLength(5);
  });

  it('un dispositivo rimasto indietro non sovrascrive l\'account: riprende la copia più recente', async () => {
    const { db } = dbFinto();
    const s = pg();
    await archivioSuDb(db, 'u_1').scrivi(dati(s, 1000));
    const ripresi: DatiSalvati[] = [];
    const sincro = new Sincronia(() => {}, (d) => ripresi.push(d), 0);
    const adottato = await sincro.collega(async () => archivioSuDb(db, 'u_1'), 'claude', dati(structuredClone(s), 1000));
    expect(adottato).toBeNull();
    // un altro dispositivo gioca e salva dopo
    const altrove = structuredClone(s); altrove.quality['monete'] = 99;
    await archivioSuDb(db, 'u_1').scrivi(dati(altrove, 9000));
    // questo dispositivo fa una mossa con lo stato vecchio
    sincro.segnala(dati(structuredClone(s), 2000));
    await new Promise((r) => setTimeout(r, 20));
    expect(ripresi.length).toBe(1);
    expect(ripresi[0]!.stato.quality['monete']).toBe(99);
    expect((await archivioSuDb(db, 'u_1').leggi())!.stato.quality['monete']).toBe(99);
  });

  it('due personaggi diversi: decide il giocatore, e la scelta si scrive', async () => {
    const { db } = dbFinto();
    await archivioSuDb(db, 'u_1').scrivi(dati(pg('Orsk'), 9000));
    const sincro = new Sincronia(() => {}, () => {}, 0);
    const locale = dati(pg('Vessa'), 1000);
    expect(await sincro.collega(async () => archivioSuDb(db, 'u_1'), 'claude', locale)).toBeNull();
    expect(sincro.stato.conflitto?.remoto.stato.nome).toBe('Orsk');
    sincro.segnala(locale); // finché non sceglie, non si scrive niente
    await new Promise((r) => setTimeout(r, 20));
    expect((await archivioSuDb(db, 'u_1').leggi())!.stato.nome).toBe('Orsk');
    sincro.risolvi(locale);
    await new Promise((r) => setTimeout(r, 20));
    expect((await archivioSuDb(db, 'u_1').leggi())!.stato.nome).toBe('Vessa');
  });

  it('chi non può scrivere nell\'account resta al salvataggio nel browser, con un messaggio', async () => {
    const negato: Archivio = {
      tipo: 'claude', leggi: async () => null, ultimo: async () => null,
      scrivi: async () => { throw Object.assign(new Error('no'), { code: 'invalid_argument' }); },
    };
    const sincro = new Sincronia(() => {}, () => {}, 0);
    await sincro.collega(async () => negato, 'claude', dati());
    expect(sincro.stato.connesso).toBe(false);
    expect(sincro.stato.errore).toMatch(/non si può salvare/);
  });

  it('il file di salvataggio si scarica e si ricarica', () => {
    const d = dati(pg(), Date.UTC(2026, 9, 2));
    const letto = daFile(aFile(d))!;
    expect(letto.stato).toEqual(d.stato);
    expect(nomeFile(d)).toBe('nyzar-vessa-2026-10-02.json');
    expect(daFile('{"ciao":1}')).toBeNull();
    expect(daFile('non è json')).toBeNull();
  });
});

describe('accesso Google (Supabase)', () => {
  const cfg = { url: 'https://progetto.supabase.co', chiave: 'chiave-pubblica' };
  let memoria: Record<string, string>;
  beforeEach(() => {
    memoria = {};
    Object.assign(globalThis, {
      localStorage: { getItem: (k: string) => memoria[k] ?? null, setItem: (k: string, v: string) => { memoria[k] = v; }, removeItem: (k: string) => { delete memoria[k]; } },
      location: { hash: '#access_token=AT&refresh_token=RT&expires_in=3600&token_type=bearer', pathname: '/', search: '', origin: 'https://nyzar.pages.dev' },
      history: { replaceState: () => {} },
    });
  });

  it('legge i gettoni dal ritorno del login', () => {
    expect(sessioneDaIndirizzo('#access_token=A&refresh_token=R&expires_in=10', 0)).toEqual({ access_token: 'A', refresh_token: 'R', scade: 10_000 });
    expect(sessioneDaIndirizzo('#altro=1')).toBeNull();
  });

  it('dopo il login salva e legge la propria riga', async () => {
    const righe = new Map<string, unknown>();
    const chiamate: string[] = [];
    const finto = (async (url: string, init?: RequestInit) => {
      chiamate.push(`${init?.method ?? 'GET'} ${url.replace(cfg.url, '')}`);
      const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;
      expect((init?.headers as Record<string, string>)?.['apikey']).toBe(cfg.chiave);
      if (url.endsWith('/auth/v1/user')) return ok({ id: 'uid-1', email: 'luca@example.com', user_metadata: { full_name: 'Luca' } });
      if (url.includes('/rest/v1/salvataggi?select=dati')) return ok(righe.has('uid-1') ? [{ dati: righe.get('uid-1') }] : []);
      if (url.includes('/rest/v1/salvataggi?select=aggiornato')) return ok([]);
      if (url.endsWith('/rest/v1/salvataggi') && init?.method === 'POST') {
        const b = JSON.parse(String(init.body)) as { utente: string; dati: unknown };
        righe.set(b.utente, b.dati);
        return ok(null);
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    }) as typeof fetch;
    const a = (await archivioGoogle(cfg, finto))!;
    expect(a.chi).toBe('Luca');
    expect(await a.leggi()).toBeNull();
    const d = dati();
    await a.scrivi(d);
    expect((await a.leggi())!.stato).toEqual(d.stato);
    expect(JSON.parse(memoria['gioco-nyzar/sessione']!).access_token).toBe('AT');
    expect(chiamate.some((x) => x.startsWith('POST /rest/v1/salvataggi'))).toBe(true);
  });

  it('senza sessione non c\'è archivio', async () => {
    (globalThis as unknown as { location: { hash: string } }).location.hash = '';
    expect(await archivioGoogle(cfg, (async () => { throw new Error('non dovrebbe chiamare'); }) as typeof fetch)).toBeNull();
  });
});
