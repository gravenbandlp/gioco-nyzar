import { rngConSeme } from '../src/motore/dadi';
import { nuovoPersonaggio, type Stato } from '../src/motore/personaggio';
import { anteprima, scegli, correggi, correggibile, concludiCombattimento } from '../src/motore/azioni';
import { round, modifica, iniziaCombattimento, combattenteDaStato, azioneAutomatica, type StatoCombattimento } from '../src/motore/combattimento';
import { repertorio, cambiaRepertorio, limiteRepertorio, incantesimiConosciuti } from '../src/motore/magia';
import { CONTENUTI as c } from '../src/dati/contenuti';

const origine = (id: string) => c.origini.find((o) => o.id === id)!;
const storylet = (id: string) => c.storylet.find((s) => s.id === id)!;
const inc = (id: string) => c.incantesimi.find((i) => i.id === id)!;
const allievo = (): Stato => nuovoPersonaggio('Besk', origine('allievo-di-torvessa'), 0, 'citta-bassa');

function scontroCon(s: Stato, scontro: string, seme = 1): StatoCombattimento {
  const sc = c.scontri.find((x) => x.id === scontro)!;
  return iniziaCombattimento(combattenteDaStato(s, c), sc, c, {}, rngConSeme(seme), repertorio(s, c));
}

describe('origini e repertorio', () => {
  it("l'Allievo di Torvessa parte con Dardo e Luce fredda", () => {
    const s = allievo();
    expect(incantesimiConosciuti(s, c).map((i) => i.id).sort()).toEqual(['dardo', 'luce-fredda']);
    expect(repertorio(s, c).map((i) => i.id)).toEqual(['dardo']); // Luce fredda è solo per le storie
  });
  it('Accolito e Figlio del Circolo hanno Magia 1 e un incantesimo', () => {
    const a = nuovoPersonaggio('A', origine('accolito-del-velo'), 0, 'citta-bassa');
    const f = nuovoPersonaggio('F', origine('figlio-del-circolo'), 0, 'citta-bassa');
    expect(a.abilita['magia']).toBe(1);
    expect(a.quality['incantesimo.benedizione']).toBe(1);
    expect(f.quality['incantesimo.richiamo']).toBe(1);
  });
  it('il repertorio ha un limite di Magia + 2', () => {
    const s = allievo();
    for (const id of ['scudo-arcano', 'fiamma', 'rapidita', 'sussurro-di-paura', 'lancia-di-luce']) s.quality[`incantesimo.${id}`] = 1;
    expect(limiteRepertorio(s)).toBe(5);
    expect(repertorio(s, c)).toHaveLength(5);
    expect(cambiaRepertorio(s, 'dardo', c)).toBe(true); // lo toglie
    expect(repertorio(s, c).map((i) => i.id)).not.toContain('dardo');
    expect(cambiaRepertorio(s, 'dardo', c)).toBe(true); // lo rimette
    expect(cambiaRepertorio(s, 'lancia-di-luce', c)).toBe(false); // pieno
  });
});

describe('incantesimi in combattimento', () => {
  it("Dardo spende Energia e fa danno ignorando l'armatura", () => {
    const s = allievo();
    const cs = scontroCon(s, 'rissa-segheria', 3);
    const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
    expect(pg.energia).toBe(6);
    round(cs, { tipo: 'incantesimo', incantesimo: 'dardo', bersaglio: 'marko-thessel#1' }, rngConSeme(3));
    expect(pg.energia).toBe(5);
    expect(cs.log.some((l) => l.startsWith('Dardo'))).toBe(true);
  });
  it('senza Energia non si lancia', () => {
    const s = allievo();
    const cs = scontroCon(s, 'rissa-pignatta');
    cs.combattenti.find((x) => x.lato === 'pg')!.energia = 0;
    round(cs, { tipo: 'incantesimo', incantesimo: 'dardo' }, rngConSeme(1));
    expect(cs.log.some((l) => l.includes('Non hai abbastanza Energia'))).toBe(true);
  });
  it('potenziamenti e indebolimenti durano i round indicati', () => {
    const s = allievo();
    s.quality['incantesimo.scudo-arcano'] = 1;
    const cs = scontroCon(s, 'rissa-pignatta', 5);
    const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
    pg.magia = 30; // abbastanza dadi da non fallire mai
    for (const x of cs.combattenti) { x.pf = 999; x.pfMax = 999; } // nessuno cade prima della fine
    // la durata si conta nei tuoi turni dopo quello del lancio: Scudo arcano copre i 3 round successivi
    round(cs, { tipo: 'incantesimo', incantesimo: 'scudo-arcano' }, rngConSeme(5));
    expect(pg.effetti.find((e) => e.fonte === 'scudo-arcano')?.round).toBe(3);
    round(cs, { tipo: 'attacco', bersaglio: '' }, rngConSeme(6));
    round(cs, { tipo: 'attacco', bersaglio: '' }, rngConSeme(7));
    expect(pg.effetti.find((e) => e.fonte === 'scudo-arcano')?.round).toBe(1);
    round(cs, { tipo: 'attacco', bersaglio: '' }, rngConSeme(8));
    expect(pg.effetti.find((e) => e.fonte === 'scudo-arcano')).toBeUndefined();
  });
  it('Benedizione vale per i due attacchi dopo il lancio', () => {
    const s = allievo();
    s.quality['incantesimo.benedizione'] = 1;
    const cs = scontroCon(s, 'rissa-pignatta', 5);
    cs.incantesimi = c.incantesimi.filter((i) => i.id === 'benedizione');
    const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
    pg.magia = 30;
    for (const x of cs.combattenti) { x.pf = 999; x.pfMax = 999; }
    round(cs, { tipo: 'incantesimo', incantesimo: 'benedizione' }, rngConSeme(5));
    expect(modifica(pg, 'attacco')).toBe(1);
    round(cs, { tipo: 'attacco', bersaglio: '' }, rngConSeme(6));
    expect(modifica(pg, 'attacco')).toBe(1);
    round(cs, { tipo: 'attacco', bersaglio: '' }, rngConSeme(7));
    expect(modifica(pg, 'attacco')).toBe(0);
  });
  it('zero successi: Dissonanza, mezza tacca di Tormento alla fine dello scontro', () => {
    const s = allievo();
    s.quality['pista.dama-argento'] = 2;
    s.quality['intimidire'] = 0;
    const cs = scontroCon(s, 'rissa-pignatta');
    const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
    pg.magia = 0; // nessun dado: zero successi garantiti
    round(cs, { tipo: 'incantesimo', incantesimo: 'dardo' }, rngConSeme(1));
    expect(cs.costi['tormento']).toBe(0.5);
    cs.finito = true; cs.vinto = true;
    const r = concludiCombattimento(s, storylet('rissa-pignatta'), 0, cs, c);
    expect(s.quality['tormento']).toBe(0.5);
    expect(r.variazioni.some((v) => v.chiave === 'tormento')).toBe(true);
  });
  it('le formule precuriane costano a ogni lancio', () => {
    const s = allievo();
    s.abilita['magia'] = 4;
    s.quality['incantesimo.maledizione'] = 1;
    const cs = scontroCon(s, 'rissa-pignatta');
    const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
    pg.magia = 30;
    round(cs, { tipo: 'incantesimo', incantesimo: 'maledizione' }, rngConSeme(2));
    expect(cs.costi['tormento']).toBe(0.5);
  });
  it('Richiamo funziona solo sugli animali', () => {
    const s = nuovoPersonaggio('F', origine('figlio-del-circolo'), 0, 'citta-bassa');
    const cs = scontroCon(s, 'rissa-pignatta');
    round(cs, { tipo: 'incantesimo', incantesimo: 'richiamo' }, rngConSeme(1));
    expect(cs.log.some((l) => l.includes('Funziona solo su'))).toBe(true);
  });
  it("il simulatore usa gli incantesimi quando convengono", () => {
    const s = allievo();
    const cs = scontroCon(s, 'rissa-pignatta');
    expect(azioneAutomatica(cs)).toMatchObject({ tipo: 'incantesimo', incantesimo: 'dardo' });
  });
});

describe('incantesimi nelle storie', () => {
  it("un'opzione con incantesimo è chiusa a chi non lo conosce", () => {
    const s = nuovoPersonaggio('V', origine('figlio-della-citta-bassa'), 0, 'citta-bassa');
    const opz = storylet('orlo-rottami').opzioni.find((o) => o.incantesimo === 'luce-fredda')!;
    const a = anteprima(s, opz, c);
    expect(a.disponibile).toBe(false);
    expect(a.mancanti).toContain('incantesimo.luce-fredda >= 1');
  });
  it('fuori dal combattimento la Dissonanza arriva con zero successi', () => {
    const s = allievo();
    s.attributi.mentale = 0; s.abilita['magia'] = 0; // pool 0: zero successi garantiti
    s.quality['incantesimo.luce-fredda'] = 1;
    const i = storylet('orlo-rottami').opzioni.findIndex((o) => o.incantesimo === 'luce-fredda');
    const r = scegli(s, storylet('orlo-rottami'), i, c, 0, rngConSeme(1));
    expect(r.tipo).toBe('risultato');
    if (r.tipo !== 'risultato') return;
    expect(r.risultato.dissonanza).toBe(true);
    expect(s.quality['tormento']).toBe(0.5);
  });
  it('Correzione annulla una prova fallita e la ripete', () => {
    const s = allievo();
    s.quality['incantesimo.correzione'] = 1;
    s.quality['pista.dama-argento'] = 3;
    const st = storylet('sorriso-di-marko');
    const prima = structuredClone(s);
    // cerco un seme che faccia fallire la prima prova
    let seme = 1, r = scegli(s, st, 0, c, 0, rngConSeme(seme));
    while (r.tipo === 'risultato' && r.risultato.riuscito) {
      Object.assign(s, structuredClone(prima));
      r = scegli(s, st, 0, c, 0, rngConSeme(++seme));
    }
    if (r.tipo !== 'risultato') throw new Error('atteso risultato');
    expect(correggibile(s, r.risultato)).toBe(true);
    s.attributi.mentale = 5; s.abilita['magia'] = 5; // Correzione quasi certa
    s.attributi.fisico = 10; s.abilita['atletica'] = 5; // e la prova ripetuta riesce
    const r2 = correggi(s, prima, st, 0, c, 0, rngConSeme(99));
    expect(r2.tipo).toBe('risultato');
    if (r2.tipo !== 'risultato') return;
    expect(r2.risultato.corretto).toBe(true);
    expect(s.quality['tormento']).toBeGreaterThanOrEqual(0.5); // il prezzo della formula resta
    expect(r2.risultato.riuscito).toBe(true);
    expect(s.quality['sospetto'] ?? 0).toBe(prima.quality['sospetto'] ?? 0); // il fallimento è annullato
  });
  it('le lezioni insegnano e consumano monete', () => {
    const s = allievo();
    s.quality['monete'] = 100;
    s.abilita['magia'] = 5; s.attributi.mentale = 5;
    const st = c.storylet.find((x) => x.id === 'accademia-di-torvessa')!;
    const i = st.opzioni.findIndex((o) => o.testo === 'Fiamma');
    let r = scegli(s, st, i, c, 0, rngConSeme(1));
    for (let k = 2; r.tipo === 'risultato' && !r.risultato.riuscito && k < 20; k++) r = scegli(s, st, i, c, 0, rngConSeme(k));
    expect(s.quality['incantesimo.fiamma']).toBe(1);
    expect(s.quality['monete']).toBe(50);
    expect(inc('fiamma').livello).toBe(2);
  });
});
