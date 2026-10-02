// Percorsi casuali: giocano a caso le storie di una pista, di una spedizione o di un luogo, e falliscono se il
// giocatore resta bloccato. Usati dai test delle piste e della città viva.
import { nuovoPersonaggio, requisitiSoddisfatti, storyletDisponibili, type Stato } from '../src/motore/personaggio';
import { scegli, concludiCombattimento, anteprima } from '../src/motore/azioni';
import { round } from '../src/motore/combattimento';
import { crisiAttiva } from '../src/motore/crisi';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { rngConSeme, type Rng } from '../src/motore/dadi';
import { RINTOCCHI_MAX } from '../src/motore/regole';
import type { TStorylet } from '../src/motore/contenuto';

function passo(s: Stato, st: TStorylet, rng: Rng): void {
  const ok = st.opzioni.map((o, i) => i).filter((i) => anteprima(s, st.opzioni[i]!, c).mancanti.length === 0);
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

export function percorri(origine: string, seme: number, pista: string, fine: number, extra: Record<string, number> = {}): number {
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === origine)!, 0, 'citta-bassa');
  delete s.quality['prologo'];
  s.quality['informazioni.voce'] = 2;
  s.quality['monete'] = 60;
  s.quality['conosci.liaren'] = 1; // il primo ingresso al Grifone apre la caccia di Corin
  Object.assign(s.quality, extra);
  const rng = rngConSeme(seme);
  for (let n = 0; n < 1000; n++) {
    s.rintocchi = RINTOCCHI_MAX;
    for (const k of ['ferite', 'scandalo', 'sospetto', 'tormento', 'contaminazione']) s.quality[k] = Math.min(s.quality[k] ?? 0, 3);
    if ((s.quality[pista] ?? 0) >= fine) return n;
    const obbligato = crisiAttiva(s, c);
    if (obbligato) { passo(s, obbligato, rng); continue; }
    // metà delle volte il giocatore chiude il risultato invece di proseguire: il seguito deve restare
    const sospeso = s.sospeso ? c.storylet.find((x) => x.id === s.sospeso) : undefined;
    if (sospeso && requisitiSoddisfatti(s, sospeso.requisiti, c) && rng() < 0.5) { passo(s, sospeso, rng); continue; }
    const v = (s.quality[pista] ?? 0);
    const tutti = c.storylet.filter((x) => x.tipo !== 'carta' && requisitiSoddisfatti(s, x.requisiti, c)
      && x.requisiti.some((r) => r.replace(/\s/g, '') === `${pista}==${v}`)
      && x.opzioni.some((o) => anteprima(s, o, c).mancanti.length === 0)); // uno storylet senza opzioni giocabili adesso si salta
    // si gioca nell'area in cui si è (in spedizione si resta dentro); altrimenti ci si sposta
    const qui = tutti.filter((x) => x.area === s.area);
    const scelta = qui.length ? qui : tutti;
    const st = scelta[Math.floor(rng() * scelta.length)];
    if (!st) throw new Error(`${origine}/${seme}: bloccato a ${pista} = ${v} (area ${s.area})`);
    if (st.area !== s.area && c.aree.find((a) => a.id === s.area)?.spedizione) throw new Error(`${origine}/${seme}: uscito dalla spedizione senza storia (${s.area}, ${pista}=${v}, verso ${st.id}, qui: ${tutti.map((x) => x.id).join(",")})`);
    s.area = st.area;
    passo(s, st, rng);
  }
  throw new Error(`${origine}/${seme}: troppi passi, fermo a ${s.quality[pista]} (${JSON.stringify(Object.fromEntries(Object.entries(s.quality).filter(([k]) => /rennick|dama|monete|rep/.test(k))))})`);
}

/** Una spedizione ripetibile: si entra dall'ingresso e si gioca a caso finché la quality del fondo non vale 1. */
export function scendi(origine: string, seme: number, ingresso: string, fondo: string): number {
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === origine)!, 0, 'ponti-sospesi');
  delete s.quality['prologo'];
  Object.assign(s.quality, { raschiatore: 1, 'pista.acciaio': 8, monete: 200, bende: 2 });
  const rng = rngConSeme(seme);
  const entrata = c.storylet.find((x) => x.id === ingresso)!;
  for (let n = 0; n < 400; n++) {
    s.rintocchi = RINTOCCHI_MAX;
    for (const k of ['ferite', 'scandalo', 'sospetto', 'tormento', 'contaminazione']) s.quality[k] = Math.min(s.quality[k] ?? 0, 3);
    if ((s.quality[fondo] ?? 0) >= 1) return n;
    const obbligato = crisiAttiva(s, c);
    if (obbligato) { passo(s, obbligato, rng); continue; }
    const sospeso = s.sospeso ? c.storylet.find((x) => x.id === s.sospeso) : undefined;
    if (sospeso && requisitiSoddisfatti(s, sospeso.requisiti, c)) { passo(s, sospeso, rng); continue; }
    if (!c.aree.find((a) => a.id === s.area)?.spedizione) { s.area = entrata.area; passo(s, entrata, rng); continue; }
    const qui = storyletDisponibili(s, c).filter((x) => x.area === s.area && x.opzioni.some((o) => anteprima(s, o, c).mancanti.length === 0));
    const st = qui[Math.floor(rng() * qui.length)];
    if (!st) throw new Error(`${origine}/${seme}: bloccato in ${s.area}`);
    passo(s, st, rng);
  }
  throw new Error(`${origine}/${seme}: troppi passi in ${ingresso}`);
}

/** Un luogo della città viva: si gioca a caso fra le storie e le attività del luogo finché la quality finale vale 1. */
export function frequenta(origine: string, seme: number, luoghi: string | string[], fine: string, extra: Record<string, number> = {}): number {
  const tutti = Array.isArray(luoghi) ? luoghi : [luoghi];
  const luogo = tutti[0]!;
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === origine)!, 0, 'citta-bassa');
  delete s.quality['prologo'];
  Object.assign(s.quality, { monete: 200, bende: 2 }, extra);
  const l = c.luoghi.find((x) => x.id === luogo)!;
  s.area = l.area;
  const rng = rngConSeme(seme);
  for (let n = 0; n < 5000; n++) {
    s.rintocchi = RINTOCCHI_MAX;
    for (const k of ['ferite', 'scandalo', 'sospetto', 'tormento', 'contaminazione']) s.quality[k] = Math.min(s.quality[k] ?? 0, 3);
    if ((s.quality[fine] ?? 0) >= 1) return n;
    const obbligato = crisiAttiva(s, c);
    if (obbligato) { passo(s, obbligato, rng); continue; }
    const sospeso = s.sospeso ? c.storylet.find((x) => x.id === s.sospeso) : undefined;
    if (sospeso && requisitiSoddisfatti(s, sospeso.requisiti, c)) { s.area = sospeso.area; passo(s, sospeso, rng); continue; }
    s.area = l.area;
    const qui = storyletDisponibili(s, c).filter((x) => !!x.presso && tutti.includes(x.presso) && x.opzioni.some((o) => anteprima(s, o, c).mancanti.length === 0));
    const st = qui[Math.floor(rng() * qui.length)];
    if (!st) throw new Error(`${origine}/${seme}: niente da fare in ${luogo}`);
    passo(s, st, rng);
  }
  throw new Error(`${origine}/${seme}: troppi passi in ${luogo} (${JSON.stringify(Object.fromEntries(Object.entries(s.quality).filter(([k]) => k.startsWith('rep.') || k.includes(luogo.split('-')[0] ?? luogo))))})`);
}

