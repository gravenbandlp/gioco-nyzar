import { probabilita, tira, rngConSeme } from '../src/motore/dadi';
import { peDaProbabilita, CANDELE_MAX, CODA_MAX } from '../src/motore/regole';
import {
  nuovoPersonaggio, requisitoSoddisfatto, applicaEffetti, assegnaPE, aggiornaTempo, spendiCandele,
  msAllaProssimaCandela, pesca, storyletDisponibili, type Stato,
} from '../src/motore/personaggio';
import { anteprima, scegli, concludiCombattimento, puoEntrare, muovi, compra, vendi } from '../src/motore/azioni';
import { round, feriteDopo, type StatoCombattimento } from '../src/motore/combattimento';
import { CONTENUTI as c } from '../src/dati/contenuti';

const MIN = 60_000;
const origine = (id: string) => c.origini.find((o) => o.id === id)!;
const storylet = (id: string) => c.storylet.find((s) => s.id === id)!;
const figlio = (): Stato => nuovoPersonaggio('Vessa', origine('figlio-della-citta-bassa'), 0, 'citta-bassa');

describe('dadi', () => {
  it('probabilità esatte del pool', () => {
    expect(probabilita(1, 1)).toBe(0.5);
    expect(probabilita(4, 2)).toBeCloseTo(11 / 16);
    expect(probabilita(5, 3)).toBe(0.5);
    expect(probabilita(2, 3)).toBe(0);
    expect(probabilita(0, 0)).toBe(1);
  });
  it('tiro deterministico con seme', () => {
    const a = tira(6, rngConSeme(42));
    const b = tira(6, rngConSeme(42));
    expect(a).toEqual(b);
    expect(a.successi).toBe(a.facce.filter((f) => f >= 4).length);
  });
  it('la frequenza simulata corrisponde a quella calcolata', () => {
    const rng = rngConSeme(1);
    let ok = 0;
    for (let i = 0; i < 20000; i++) if (tira(5, rng).successi >= 3) ok++;
    expect(ok / 20000).toBeCloseTo(0.5, 1);
  });
});

describe('crescita', () => {
  it('PE per probabilità di successo', () => {
    expect([0.95, 0.8, 0.5, 0.3, 0.1, 0.01].map(peDaProbabilita)).toEqual([1, 2, 3, 4, 3, 1]);
  });
  it('sale di livello con riporto e dà un quarto all\'attributo', () => {
    const s = figlio(); // empatia 1: soglia 1→2 = 40
    s.pe['empatia'] = 38;
    const cr = assegnaPE(s, 'empatia', 4);
    expect(s.abilita['empatia']).toBe(2);
    expect(s.pe['empatia']).toBe(2);
    expect(cr[0]!.nuovoLivello).toBe(2);
    expect(s.pe['sociale']).toBe(1);
  });
});

describe('requisiti ed effetti', () => {
  it('legge attributi, abilità e quality', () => {
    const s = figlio();
    expect(requisitoSoddisfatto(s, 'rissa >= 3')).toBe(true);
    expect(requisitoSoddisfatto(s, 'fisico == 2')).toBe(true);
    expect(requisitoSoddisfatto(s, 'pista.dama-argento == 0')).toBe(true);
    expect(requisitoSoddisfatto(s, 'monete > 15')).toBe(false);
  });
  it('limita negative e reputazioni', () => {
    const s = figlio();
    applicaEffetti(s, { ferite: 10, 'rep.malgrani': -9, monete: -100 }, c);
    expect(s.quality['ferite']).toBe(8);
    expect(s.quality['rep.malgrani']).toBe(-5);
    expect(s.quality['monete']).toBe(0);
  });
});

describe('candele e mazzo', () => {
  it('si consumano e si ricaricano a 1 ogni 10 minuti', () => {
    const s = figlio();
    expect(spendiCandele(s, 3, 0)).toBe(true);
    expect(s.candele).toBe(CANDELE_MAX - 3);
    expect(msAllaProssimaCandela(s, 4 * MIN)).toBe(6 * MIN);
    aggiornaTempo(s, 25 * MIN);
    expect(s.candele).toBe(CANDELE_MAX - 1);
    expect(msAllaProssimaCandela(s, 25 * MIN)).toBe(5 * MIN);
    aggiornaTempo(s, 999 * MIN);
    expect(s.candele).toBe(CANDELE_MAX);
    expect(msAllaProssimaCandela(s, 999 * MIN)).toBeNull();
  });
  it('non si spende quello che non si ha', () => {
    const s = figlio();
    s.candele = 0;
    expect(spendiCandele(s, 1, 0)).toBe(false);
  });
  it('pesca fino a 3 carte dalla coda', () => {
    const s = figlio();
    const rng = rngConSeme(3);
    for (let i = 0; i < 5; i++) pesca(s, c, 0, rng);
    expect(s.mano.length).toBe(3);
    expect(new Set(s.mano).size).toBe(3);
    expect(s.coda).toBe(CODA_MAX - 3);
  });
});

describe('storylet', () => {
  it('la pista si apre con due voci', () => {
    const s = figlio();
    expect(storyletDisponibili(s, c).map((x) => x.id)).not.toContain('parola-orchesca');
    s.quality['informazioni.voce'] = 2;
    expect(storyletDisponibili(s, c).map((x) => x.id)).toContain('parola-orchesca');
  });
  it('una prova spende una candela, tira i dadi e dà PE', () => {
    const s = figlio();
    const r = scegli(s, storylet('orecchie-pignatta'), 0, c, 0, rngConSeme(5));
    expect(r.tipo).toBe('risultato');
    if (r.tipo !== 'risultato') return;
    expect(s.candele).toBe(CANDELE_MAX - 1);
    expect(r.risultato.tiro!.facce.length).toBe(5); // Sociale 2 + Conoscenze della strada 3
    expect(r.risultato.crescite[0]!.chiave).toBe('conoscenze-della-strada');
    expect(r.risultato.crescite[0]!.pe).toBe(3); // 50% di successo → 3 PE
  });
  it('la percentuale mostrata è quella del pool migliore', () => {
    const s = figlio();
    const a = anteprima(s, storylet('orecchie-pignatta').opzioni[0]!, c);
    expect(a.prova!.abilita).toBe('conoscenze-della-strada');
    expect(a.prova!.pool).toBe(5);
    expect(a.prova!.probabilita).toBe(0.5);
  });
  it('senza candele l\'opzione è bloccata', () => {
    const s = figlio();
    s.candele = 0;
    const r = scegli(s, storylet('turno-acciaieria'), 0, c, 0);
    expect(r.tipo).toBe('errore');
  });
});

describe('combattimento', () => {
  function combatti(seme: number): { s: Stato; cs: StatoCombattimento } {
    const s = figlio();
    s.quality['pista.dama-argento'] = 2;
    const rng = rngConSeme(seme);
    const r = scegli(s, storylet('segheria-malgrani'), 1, c, 0, rng);
    if (r.tipo !== 'combattimento') throw new Error('atteso combattimento');
    const cs = r.combattimento;
    while (!cs.finito) {
      const bersaglio = cs.combattenti.find((x) => x.lato === 'nemico' && x.pf > 0 && !x.fuggito)!;
      round(cs, { tipo: 'attacco', bersaglio: bersaglio.id }, rng);
    }
    return { s, cs };
  }
  it('è deterministico con lo stesso seme', () => {
    expect(combatti(9).cs.log).toEqual(combatti(9).cs.log);
  });
  it('la Segheria è una rissa "Medio" per il Figlio della Città Bassa', () => {
    const a = anteprima(figlio(), storylet('segheria-malgrani').opzioni[1]!, c);
    expect(a.combattimento!.etichetta).toBe('Medio');
  });
  it('vittoria e sconfitta portano avanti la storia in modo diverso', () => {
    let vinte = 0, perse = 0;
    for (let seme = 1; seme <= 40 && (vinte === 0 || perse === 0); seme++) {
      const { s, cs } = combatti(seme);
      const r = concludiCombattimento(s, storylet('segheria-malgrani'), 1, cs, c);
      if (cs.vinto) {
        vinte++;
        expect(s.quality['pista.dama-argento']).toBe(4);
        expect(r.crescite[0]!.chiave).toBe('rissa');
      } else {
        perse++;
        expect(s.quality['pista.dama-argento']).toBe(2);
        expect(s.quality['ferite']).toBe(3);
      }
    }
    expect(vinte).toBeGreaterThan(0);
    expect(perse).toBeGreaterThan(0);
  });
  it('ferite a fine scontro in base ai PF rimasti', () => {
    const cs = { vinto: true, combattenti: [{ lato: 'pg', pf: 7, pfMax: 7 }] } as unknown as StatoCombattimento;
    expect(feriteDopo(cs, 3)).toBe(0);
    cs.combattenti[0]!.pf = 4;
    expect(feriteDopo(cs, 3)).toBe(0.5);
    cs.combattenti[0]!.pf = 1;
    expect(feriteDopo(cs, 3)).toBe(1);
    cs.vinto = false;
    expect(feriteDopo(cs, 3)).toBe(3);
  });
});

describe('spostamenti e negozi', () => {
  it('gabella sui Ponti, esenzione con la licenza', () => {
    const s = figlio();
    expect(puoEntrare(s, 'ponti-sospesi', c).gabella).toBe(2);
    expect(muovi(s, 'ponti-sospesi', c)).toBe(true);
    expect(s.quality['monete']).toBe(13);
    s.quality['licenza-gilda'] = 1;
    expect(puoEntrare(s, 'citta-bassa', c).gabella).toBe(0);
  });
  it('i Quartieri Alti chiedono un invito', () => {
    expect(puoEntrare(figlio(), 'quartieri-alti', c).ok).toBe(false);
  });
  it('vendere beni e comprare armi', () => {
    const s = figlio();
    s.quality['informazioni.voce'] = 1;
    expect(vendi(s, 'banco-di-grusk', 'informazioni.voce', c)).toBe(true);
    expect(s.quality['monete']).toBe(16);
    expect(compra(s, 'armeria-di-irsa', 'arma.pugnale', c)).toBe(true);
    expect(s.arma).toBe('pugnale');
    expect(s.quality['monete']).toBe(6);
    expect(compra(s, 'armeria-di-irsa', 'arma.spada-lunga', c)).toBe(false);
  });
});
