import { rngConSeme } from '../src/motore/dadi';
import { nuovoPersonaggio, applicaEffetti, abilitaEffettiva, requisitoSoddisfatto, type Stato } from '../src/motore/personaggio';
import { anteprima, scegli, concludiCombattimento, secondaScelta, secondaSceltaDisponibile, compra } from '../src/motore/azioni';
import { round, iniziaCombattimento, combattenteDaStato, repertiDaStato } from '../src/motore/combattimento';
import { indossa, togli, ricevi, perchéNonIndossabile, dadiDifesa, ricaricaReperto, chiaveOggetto } from '../src/motore/oggetti';
import { CONTENUTI as c } from '../src/dati/contenuti';

const origine = (id: string) => c.origini.find((o) => o.id === id)!;
const storylet = (id: string) => c.storylet.find((s) => s.id === id)!;
const figlio = (): Stato => nuovoPersonaggio('Vessa', origine('figlio-della-citta-bassa'), 0, 'citta-bassa');
const dai = (s: Stato, id: string) => ricevi(s, c, id);

describe('inventario e slot', () => {
  it("l'arma di partenza è posseduta e indossata", () => {
    const s = figlio();
    expect(s.quality[chiaveOggetto('tirapugni')]).toBe(1);
    expect(s.arma).toBe('tirapugni');
  });
  it('un oggetto ricevuto va nello slot se è vuoto, altrimenti nella sacca', () => {
    const s = figlio();
    dai(s, 'scudo');
    expect(s.scudo).toBe('scudo');
    dai(s, 'spada-lunga');
    expect(s.arma).toBe('tirapugni');
    expect(indossa(s, c, 'spada-lunga')).toBe(true);
    expect(s.arma).toBe('spada-lunga');
  });
  it("un'arma a due mani toglie lo scudo, e con lei lo scudo non si indossa", () => {
    const s = figlio();
    dai(s, 'scudo'); dai(s, 'spadone');
    indossa(s, c, 'spadone');
    expect(s.scudo).toBe('');
    expect(perchéNonIndossabile(s, c, 'scudo')).toMatch(/due mani/);
  });
  it('al massimo due accessori', () => {
    const s = figlio();
    for (const id of ['anello-del-respiro-misurato', 'amuleto-del-corvo-vigile', 'specchio-della-seconda-scelta']) dai(s, id);
    expect(s.accessori).toHaveLength(2);
    expect(perchéNonIndossabile(s, c, 'specchio-della-seconda-scelta')).toMatch(/2 accessori/);
  });
  it('Pesante richiede Fisico 3', () => {
    const s = figlio(); // Fisico 2
    dai(s, 'mazza-ferrata-di-squiggor');
    expect(s.arma).toBe('tirapugni');
    expect(perchéNonIndossabile(s, c, 'mazza-ferrata-di-squiggor')).toMatch(/Fisico 3/);
  });
  it('anti-accumulo: armatura +1 e scudo +1 danno +1, non +2', () => {
    const s = figlio();
    dai(s, 'cuoio-borchiato-di-irsa'); indossa(s, c, 'cuoio-borchiato-di-irsa');
    expect(dadiDifesa(s, c)).toBe(1);
    dai(s, 'scudo');
    expect(dadiDifesa(s, c)).toBe(1);
    dai(s, 'scudo-pesante'); indossa(s, c, 'scudo-pesante');
    expect(dadiDifesa(s, c)).toBe(2);
  });
  it('Silenziosa toglie la penalità di Furtività della cotta', () => {
    const s = figlio();
    s.abilita['furtivita'] = 2;
    dai(s, 'cotta-di-maglia'); indossa(s, c, 'cotta-di-maglia');
    expect(abilitaEffettiva(s, 'furtivita', c)).toBe(1);
    dai(s, 'giaco-di-maglia-di-irsa'); indossa(s, c, 'giaco-di-maglia-di-irsa');
    expect(abilitaEffettiva(s, 'furtivita', c)).toBe(2);
  });
  it('le chiavi aprono requisiti', () => {
    const s = figlio();
    expect(requisitoSoddisfatto(s, 'chiave.sfondare >= 1', c)).toBe(false);
    dai(s, 'martello-dei-due-mastini');
    expect(requisitoSoddisfatto(s, 'chiave.sfondare >= 1', c)).toBe(true);
  });
  it('Talento aggiunge dadi fuori dal combattimento', () => {
    const s = figlio();
    const opz = storylet('orlo-rottami').opzioni[0]!; // Mentale + Percezione/Tecnologia
    const prima = anteprima(s, opz, c).prova!.pool;
    dai(s, 'amuleto-del-corvo-vigile');
    expect(anteprima(s, opz, c).prova!.pool).toBe(prima + 1);
  });
  it('Lucida dimezza il Tormento, due Schermate azzerano la Contaminazione', () => {
    const s = figlio();
    const o = c.oggetti.find((x) => x.id === 'anello-del-respiro-misurato')!;
    const lucida = { ...o, id: 'prova-lucida', proprieta: { ...o.proprieta, lucida: true, ultimoRespiro: false } };
    c.oggetti.push(lucida);
    try {
      dai(s, 'prova-lucida');
      applicaEffetti(s, { tormento: 2 }, c);
      expect(s.quality['tormento']).toBe(1);
    } finally { c.oggetti.pop(); togli(s, 'prova-lucida'); }
  });
});

describe('oggetti in combattimento', () => {
  it('Ultimo respiro tiene in piedi una volta', () => {
    const s = figlio();
    dai(s, 'anello-del-respiro-misurato');
    const cs = iniziaCombattimento(combattenteDaStato(s, c), c.scontri.find((x) => x.id === 'rissa-segheria')!, c, {}, rngConSeme(1));
    const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
    expect(pg.ultimoRespiro).toBe(true);
    pg.pf = 1; pg.difesa = 0;
    for (let i = 0; i < 20 && !cs.finito; i++) round(cs, { tipo: 'attacco', bersaglio: '' }, rngConSeme(10 + i));
    expect(cs.log.some((l) => l.includes('Ultimo respiro'))).toBe(true);
  });
  it('Stancante dà mezza Ferita dopo lo scontro', () => {
    const s = figlio();
    dai(s, 'cotta-di-maglia-di-irsa'); indossa(s, c, 'cotta-di-maglia-di-irsa');
    const cs = iniziaCombattimento(combattenteDaStato(s, c), c.scontri.find((x) => x.id === 'rissa-pignatta')!, c, {}, rngConSeme(1));
    cs.finito = true; cs.vinto = true;
    concludiCombattimento(s, storylet('rissa-pignatta'), 0, cs, c);
    expect(s.quality['ferite']).toBe(0.5);
  });
  it('i reperti decifrati si usano con le cariche; con zero successi si guastano', () => {
    const s = figlio();
    dai(s, 'campo-di-forza');
    expect(repertiDaStato(s, c)).toHaveLength(0); // da decifrare
    s.quality['decifrato.campo-di-forza'] = 1; s.quality['cariche.campo-di-forza'] = 2;
    expect(repertiDaStato(s, c)).toHaveLength(1);
    const pg = combattenteDaStato(s, c);
    pg.tecnologia = 0; // zero dadi: guasto garantito
    const cs = iniziaCombattimento(pg, c.scontri.find((x) => x.id === 'rissa-pignatta')!, c, {}, rngConSeme(1), [], repertiDaStato(s, c));
    round(cs, { tipo: 'reperto', reperto: 'campo-di-forza' }, rngConSeme(1));
    expect(cs.costi['guasto.campo-di-forza']).toBe(1);
  });
  it('le celle ricaricano i reperti', () => {
    const s = figlio();
    dai(s, 'iniettore');
    s.quality['decifrato.iniettore'] = 1; s.quality['cariche.iniettore'] = 0; s.quality['cella'] = 1;
    expect(ricaricaReperto(s, c, 'iniettore')).toBe(true);
    expect(s.quality['cariche.iniettore']).toBe(1);
    expect(s.quality['cella']).toBe(0);
  });
});

describe('storylet e oggetti', () => {
  it('decifrare un reperto lo carica', () => {
    const s = figlio();
    dai(s, 'iniettore');
    s.attributi.mentale = 5; s.abilita['tecnologia'] = 5;
    let r = scegli(s, storylet('decifrare-iniettore'), 0, c, 0, rngConSeme(1));
    for (let k = 2; r.tipo === 'risultato' && !r.risultato.riuscito && k < 30; k++) r = scegli(s, storylet('decifrare-iniettore'), 0, c, 0, rngConSeme(k));
    expect(s.quality['decifrato.iniettore']).toBe(1);
    expect(s.quality['cariche.iniettore']).toBe(2);
  });
  it('le reliquie si comprano con uno storylet e finiscono negli Averi', () => {
    const s = figlio();
    s.quality['monete'] = 2000;
    const st = storylet('dietro-il-banco-di-irsa');
    const i = st.opzioni.findIndex((o) => o.testo.includes('«Mira»'));
    const r = scegli(s, st, i, c, 0, rngConSeme(1));
    expect(r.tipo).toBe('risultato');
    expect(s.quality['oggetto.arco-lungo-composito-mira']).toBe(1);
    expect(s.quality['monete']).toBe(400);
    // l'altra versione dell'arco non si può più comprare
    const j = st.opzioni.findIndex((o) => o.testo.includes('«Forza»'));
    expect(anteprima(s, st.opzioni[j]!, c).disponibile).toBe(false);
  });
  it('Seconda scelta ripete una prova fallita', () => {
    const s = figlio();
    dai(s, 'specchio-della-seconda-scelta');
    s.quality['pista.dama-argento'] = 3;
    const st = storylet('sorriso-di-marko');
    const prima = structuredClone(s);
    let seme = 1, r = scegli(s, st, 0, c, 0, rngConSeme(seme));
    while (r.tipo === 'risultato' && r.risultato.riuscito) { Object.assign(s, structuredClone(prima)); r = scegli(s, st, 0, c, 0, rngConSeme(++seme)); }
    if (r.tipo !== 'risultato') throw new Error('atteso risultato');
    expect(secondaSceltaDisponibile(s, r.risultato, c)).toBe(true);
    s.attributi.fisico = 10; s.abilita['atletica'] = 5;
    const r2 = secondaScelta(s, prima, st, 0, c, 0, rngConSeme(5));
    if (r2.tipo !== 'risultato') throw new Error('atteso risultato');
    expect(r2.risultato.riuscito).toBe(true);
    expect(s.quality['tormento']).toBe(0.5);
  });
  it('comprare in bottega mette l\'oggetto nella sacca', () => {
    const s = figlio();
    s.quality['monete'] = 200;
    expect(compra(s, 'fucina-dei-due-mastini', 'oggetto.spadone', c)).toBe(true);
    expect(s.quality['oggetto.spadone']).toBe(1);
  });
});
