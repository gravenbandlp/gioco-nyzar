// Ogni spedizione si attraversa fino al cuore giocando soltanto quello che il gioco mostra: le stanze di
// stanzeVisibili (senza quelle già superate in questa visita) e gli storylet non ripetibili dell'area. A ogni
// profondità resta almeno qualcosa da giocare. Se una storia ti caccia fuori (l'allarme del Maniero), si rientra.
import { describe, it, expect } from 'vitest';
import { nuovoPersonaggio, requisitiSoddisfatti, parseRequisito, storyletDisponibili, type Stato } from '../src/motore/personaggio';
import { scegli, concludiCombattimento, anteprima } from '../src/motore/azioni';
import { round } from '../src/motore/combattimento';
import { stanzeVisibili, profondita } from '../src/motore/spedizioni';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { rngConSeme, type Rng } from '../src/motore/dadi';
import { RINTOCCHI_MAX } from '../src/motore/regole';
import type { TStorylet } from '../src/motore/contenuto';

function gioca(s: Stato, st: TStorylet, rng: Rng): void {
  const ok = st.opzioni.map((_, i) => i).filter((i) => anteprima(s, st.opzioni[i]!, c).mancanti.length === 0);
  if (!ok.length) throw new Error(`${st.id}: nessuna opzione giocabile`);
  const i = ok[Math.floor(rng() * ok.length)]!;
  const r = scegli(s, st, i, c, 0, rng);
  if (r.tipo === 'combattimento') {
    const cs = r.combattimento;
    while (!cs.finito) {
      const b = cs.combattenti.find((x) => x.lato === 'nemico' && x.pf > 0 && !x.fuggito)!;
      round(cs, { tipo: 'attacco', bersaglio: b.id }, rng);
    }
    concludiCombattimento(s, st, i, cs, c);
  } else if (r.tipo === 'errore') throw new Error(`${st.id}: ${r.messaggio}`);
}

const spedizioni = c.aree.filter((a) => a.spedizione).map((a) => {
  const soglia = a.spedizione!.soglia;
  const cuore = c.storylet.find((st) => st.area === a.id && !st.ripetibile && st.requisiti.some((r) => {
    const q = parseRequisito(r);
    return q.chiave === `profondita.${a.id}` && q.op === '>=' && q.n === soglia;
  }));
  return { area: a, soglia, cuore };
});

describe('spedizioni percorribili', () => {
  it('ogni spedizione ha un cuore alla sua soglia', () => {
    for (const z of spedizioni) expect(z.cuore, z.area.id).toBeDefined();
  });

  for (const { area, soglia, cuore } of spedizioni) {
    it(`${area.id}: si arriva al cuore con le stanze mostrate`, () => {
      // le condizioni del cuore che non riguardano la profondità (la pista, di solito) sono il punto di partenza
      const base: Record<string, number> = { raschiatore: 1, monete: 200, bende: 2 };
      for (const r of cuore!.requisiti) {
        const q = parseRequisito(r);
        if (q.op === '==' && !q.chiave.startsWith('profondita.')) base[q.chiave] = q.n;
      }
      for (let seme = 1; seme <= 25; seme++) {
        const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, area.id);
        delete s.quality['prologo'];
        Object.assign(s.quality, base);
        const rng = rngConSeme(seme);
        let n = 0;
        let uscite = 0;
        while (profondita(s, area.id) < soglia) {
          if (++n > 2000) throw new Error(`${area.id}/${seme}: troppi passi a profondità ${profondita(s, area.id)}`);
          s.rintocchi = RINTOCCHI_MAX;
          for (const k of ['ferite', 'scandalo', 'sospetto', 'tormento', 'contaminazione']) s.quality[k] = 0;
          const sospeso = s.sospeso ? c.storylet.find((x) => x.id === s.sospeso) : undefined;
          if (sospeso && requisitiSoddisfatti(s, sospeso.requisiti, c)) { gioca(s, sospeso, rng); continue; }
          if (s.sospeso) delete s.sospeso;
          const storie = storyletDisponibili(s, c).filter((st) => st.area === area.id && !st.ripetibile && st.id !== cuore!.id);
          const stanze = [...stanzeVisibili(s, c), ...storie].filter((st) => st.opzioni.some((o) => anteprima(s, o, c).mancanti.length === 0));
          expect(stanze.length, `${area.id}/${seme}: niente da giocare a profondità ${profondita(s, area.id)} (superate: ${(s.stanzePassate ?? []).join(', ')})`).toBeGreaterThan(0);
          const st = stanze[Math.floor(rng() * stanze.length)]!;
          gioca(s, st, rng);
          if (s.area !== area.id) {
            // cacciato fuori da una storia: si rientra da capo, come farebbe il giocatore
            expect(st.ripetibile, `${area.id}/${seme}: la stanza ${st.id} porta fuori dalla spedizione`).toBeFalsy();
            if (++uscite > 60) throw new Error(`${area.id}/${seme}: troppe uscite`);
            for (const k of Object.keys(s.quality)) if (k.startsWith('allarme.')) s.quality[k] = 0;
            s.area = area.id;
          }
        }
        expect(requisitiSoddisfatti(s, cuore!.requisiti, c), `${area.id}/${seme}: il cuore non si apre`).toBe(true);
      }
    });
  }
});
