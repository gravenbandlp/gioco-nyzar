// Percorsi casuali lungo le piste: nessuna combinazione di scelte deve lasciare il giocatore bloccato.
import { nuovoPersonaggio, requisitiSoddisfatti, storyletDisponibili, type Stato } from '../src/motore/personaggio';
import { scegli, concludiCombattimento } from '../src/motore/azioni';
import { round } from '../src/motore/combattimento';
import { crisiAttiva } from '../src/motore/crisi';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { rngConSeme, type Rng } from '../src/motore/dadi';
import { CANDELE_MAX } from '../src/motore/regole';
import type { TStorylet } from '../src/motore/contenuto';

function passo(s: Stato, st: TStorylet, rng: Rng): void {
  const ok = st.opzioni.map((o, i) => i).filter((i) => requisitiSoddisfatti(s, st.opzioni[i]!.requisiti, c));
  if (!ok.length) throw new Error(`${st.id}: nessuna opzione disponibile`);
  const i = ok[Math.floor(rng() * ok.length)]!;
  const r = scegli(s, st, i, c, 0, rng);
  if (r.tipo === 'combattimento') {
    const cs = r.combattimento;
    while (!cs.finito) {
      const b = cs.combattenti.find((x) => x.lato === 'nemico' && x.pf > 0 && !x.fuggito)!;
      round(cs, { tipo: 'attacco', bersaglio: b.id }, rng);
    }
    concludiCombattimento(s, st, i, cs, c);
  } else if (r.tipo === 'errore') throw new Error(`${st.id}: ${r.messaggio ?? 'errore'}`);
}

function percorri(origine: string, seme: number, pista: string, fine: number): number {
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === origine)!, 0, 'citta-bassa');
  delete s.quality['prologo'];
  s.quality['informazioni.voce'] = 2;
  s.quality['monete'] = 60;
  const rng = rngConSeme(seme);
  for (let n = 0; n < 200; n++) {
    s.candele = CANDELE_MAX;
    for (const k of ['ferite', 'scandalo', 'sospetto', 'tormento', 'contaminazione']) s.quality[k] = Math.min(s.quality[k] ?? 0, 3);
    if ((s.quality[pista] ?? 0) >= fine) return n;
    const obbligato = crisiAttiva(s, c);
    if (obbligato) { passo(s, obbligato, rng); continue; }
    // metà delle volte il giocatore chiude il risultato invece di proseguire: il seguito deve restare
    const sospeso = s.sospeso ? c.storylet.find((x) => x.id === s.sospeso) : undefined;
    if (sospeso && requisitiSoddisfatti(s, sospeso.requisiti, c) && rng() < 0.5) { passo(s, sospeso, rng); continue; }
    const v = (s.quality[pista] ?? 0);
    const st = c.storylet.find((x) => x.tipo !== 'carta' && requisitiSoddisfatti(s, x.requisiti, c)
      && x.requisiti.some((r) => r.replace(/\s/g, '') === `${pista}==${v}`));
    if (!st) throw new Error(`${origine}/${seme}: bloccato a ${pista} = ${v} (area ${s.area})`);
    s.area = st.area;
    passo(s, st, rng);
  }
  throw new Error(`${origine}/${seme}: troppi passi, fermo a ${s.quality[pista]} (${JSON.stringify(Object.fromEntries(Object.entries(s.quality).filter(([k]) => /rennick|dama|monete|rep/.test(k))))})`);
}

describe('piste', () => {
  it('la Dama d\'Argento arriva a 11 con ogni origine e scelte a caso', () => {
    for (const o of c.origini) for (let seme = 1; seme <= 25; seme++) expect(percorri(o.id, seme, 'pista.dama-argento', 11)).toBeGreaterThan(5);
  });
  it('storyletDisponibili non si rompe a pista chiusa', () => {
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');
    s.quality['pista.dama-argento'] = 11;
    expect(() => storyletDisponibili(s, c)).not.toThrow();
  });
});
