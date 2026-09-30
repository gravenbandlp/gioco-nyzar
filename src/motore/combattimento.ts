// Combattimento a round (Regolamento v0.4, sezione 6) e simulatore delle etichette.
import { tira, rngConSeme, type Rng } from './dadi';
import { ETICHETTE_COMBATTIMENTO, MAX_CONSUMABILI_IN_COMBATTIMENTO, ROUND_MAX } from './regole';
import type { TContenuti, TNemico, TScontro } from './contenuto';
import { abilitaEffettiva, type Stato } from './personaggio';

export const CURE: Record<string, number> = { bende: 2, tonico: 4 };

export interface Combattente {
  id: string;
  nome: string;
  lato: 'pg' | 'nemico';
  attacco: number;
  difesa: number;
  difesaMentale: number;
  intimidire: number;
  pf: number;
  pfMax: number;
  danno: number;
  riduzione: number;
  ignora: number;
  iniziativa: number;
  sommaIniziativa: number;
  puoFuggire: boolean;
  malus: number;
  malusRound: number;
  fuggito: boolean;
}

export type Azione =
  | { tipo: 'attacco'; bersaglio: string }
  | { tipo: 'intimidire'; bersaglio: string }
  | { tipo: 'cura'; consumabile: string };

export interface StatoCombattimento {
  scontro: string;
  nome: string;
  combattenti: Combattente[];
  ordine: string[];
  round: number;
  log: string[];
  finito: boolean;
  vinto: boolean;
  consumabili: Record<string, number>; // disponibili all'inizio
  usati: Record<string, number>;
}

export const inPiedi = (c: Combattente) => c.pf > 0 && !c.fuggito;

export function combattenteDaStato(s: Stato, c: TContenuti): Combattente {
  const arma = c.armi.find((a) => a.id === s.arma);
  const armatura = c.armature.find((a) => a.id === s.armatura);
  const abilArma = arma?.abilita ?? 'rissa';
  const leggera = arma?.proprieta.includes('Leggera') ? 1 : 0;
  const ignora = (arma?.proprieta.includes('Perforante') ? 2 : 0) + (arma?.proprieta.includes('Contundente') ? 1 : 0);
  const eff = (a: string) => abilitaEffettiva(s, a, c);
  return {
    id: 'pg',
    nome: s.nome,
    lato: 'pg',
    attacco: s.attributi.fisico + eff(abilArma) + (arma?.qualita ?? 0),
    difesa: s.attributi.fisico + eff('acrobazia') + (armatura?.qualita ?? 0),
    difesaMentale: s.attributi.mentale + eff('resilienza'),
    intimidire: s.attributi.sociale + eff('intimidire'),
    pf: 5 + s.attributi.fisico + s.abilita['resistenza']!,
    pfMax: 5 + s.attributi.fisico + s.abilita['resistenza']!,
    danno: arma?.danno ?? 0,
    riduzione: armatura?.riduzione ?? 0,
    ignora,
    iniziativa: eff('atletica') + eff('percezione') + leggera,
    sommaIniziativa: eff('atletica') + eff('percezione'),
    puoFuggire: false,
    malus: 0,
    malusRound: 0,
    fuggito: false,
  };
}

export function combattenteDaNemico(n: TNemico, indice: number): Combattente {
  return {
    id: `${n.id}#${indice}`,
    nome: n.nome,
    lato: 'nemico',
    attacco: n.attacco,
    difesa: n.difesa,
    difesaMentale: n.difesaMentale,
    intimidire: 0,
    pf: n.pf,
    pfMax: n.pf,
    danno: n.danno,
    riduzione: n.riduzione,
    ignora: 0,
    iniziativa: n.iniziativa,
    sommaIniziativa: n.iniziativa,
    puoFuggire: n.puoFuggire,
    malus: 0,
    malusRound: 0,
    fuggito: false,
  };
}

function nemiciDelloScontro(sc: TScontro, c: TContenuti): Combattente[] {
  const conta: Record<string, number> = {};
  const lista = sc.nemici.map((id) => {
    const n = c.nemici.find((x) => x.id === id);
    if (!n) throw new Error(`Nemico sconosciuto: ${id}`);
    conta[id] = (conta[id] ?? 0) + 1;
    return combattenteDaNemico(n, conta[id]!);
  });
  // nomi distinti per i doppioni: "Sgherro 1", "Sgherro 2"
  for (const id of Object.keys(conta)) {
    if (conta[id]! > 1) lista.filter((x) => x.id.startsWith(id + '#')).forEach((x, i) => (x.nome = `${x.nome} ${i + 1}`));
  }
  return lista;
}

export function iniziaCombattimento(
  pg: Combattente, sc: TScontro, c: TContenuti, consumabili: Record<string, number>, rng: Rng = Math.random,
): StatoCombattimento {
  const combattenti = [{ ...pg }, ...nemiciDelloScontro(sc, c)];
  const tiri = combattenti.map((x) => ({ id: x.id, s: tira(x.iniziativa, rng).successi, somma: x.sommaIniziativa, r: rng() }));
  tiri.sort((a, b) => b.s - a.s || b.somma - a.somma || b.r - a.r);
  return {
    scontro: sc.id,
    nome: sc.nome,
    combattenti,
    ordine: tiri.map((t) => t.id),
    round: 1,
    log: [`Iniziativa: ${tiri.map((t) => combattenti.find((x) => x.id === t.id)!.nome).join(' → ')}.`],
    finito: false,
    vinto: false,
    consumabili,
    usati: {},
  };
}

function attacca(att: Combattente, dif: Combattente, rng: Rng, log: string[]): void {
  const a = tira(Math.max(0, att.attacco - att.malus), rng).successi;
  const d = tira(dif.difesa, rng).successi;
  const soggetto = att.lato === 'pg' ? 'Colpisci' : `${att.nome} colpisce`;
  const oggetto = dif.lato === 'pg' ? 'te' : dif.nome;
  if (a > d) {
    const danno = Math.max(1, a - d + att.danno - Math.max(0, dif.riduzione - att.ignora));
    dif.pf = Math.max(0, dif.pf - danno);
    log.push(`${soggetto} ${oggetto}: ${a} contro ${d}, ${danno} ${danno === 1 ? 'danno' : 'danni'}.${dif.pf === 0 ? (dif.lato === 'pg' ? ' Crolli a terra.' : ` ${dif.nome} è fuori combattimento.`) : ''}`);
  } else {
    log.push(att.lato === 'pg' ? `Attacchi ${oggetto}: ${a} contro ${d}, parato.` : `${att.nome} attacca ${oggetto}: ${a} contro ${d}, schivato.`);
  }
}

function intimidisci(att: Combattente, dif: Combattente, rng: Rng, log: string[]): void {
  const a = tira(att.intimidire, rng).successi;
  const d = tira(dif.difesaMentale, rng).successi;
  if (a > d) {
    const margine = a - d;
    if (margine >= 3 && dif.puoFuggire) {
      dif.fuggito = true;
      log.push(`Intimidisci ${dif.nome}: ${a} contro ${d}. Scappa.`);
    } else {
      dif.malus = 1;
      dif.malusRound = 2;
      log.push(`Intimidisci ${dif.nome}: ${a} contro ${d}. Esita: −1 dado in attacco per 2 round.`);
    }
  } else log.push(`Provi a intimidire ${dif.nome}: ${a} contro ${d}. Non abbocca.`);
}

function controllaFine(cs: StatoCombattimento): boolean {
  const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
  const nemici = cs.combattenti.filter((x) => x.lato === 'nemico');
  if (!inPiedi(pg)) { cs.finito = true; cs.vinto = false; }
  else if (!nemici.some(inPiedi)) { cs.finito = true; cs.vinto = true; }
  return cs.finito;
}

/** Esegue un round completo: l'azione del giocatore al suo turno, i nemici al loro. */
export function round(cs: StatoCombattimento, azione: Azione, rng: Rng = Math.random): void {
  if (cs.finito) return;
  const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
  for (const id of cs.ordine) {
    const att = cs.combattenti.find((x) => x.id === id)!;
    if (!inPiedi(att)) continue;
    if (att.lato === 'pg') {
      if (azione.tipo === 'cura') {
        const disponibili = (cs.consumabili[azione.consumabile] ?? 0) - (cs.usati[azione.consumabile] ?? 0);
        const totUsati = Object.values(cs.usati).reduce((a, b) => a + b, 0);
        const cura = CURE[azione.consumabile] ?? 0;
        if (disponibili > 0 && totUsati < MAX_CONSUMABILI_IN_COMBATTIMENTO && cura > 0) {
          cs.usati[azione.consumabile] = (cs.usati[azione.consumabile] ?? 0) + 1;
          const prima = pg.pf;
          pg.pf = Math.min(pg.pfMax, pg.pf + cura);
          cs.log.push(`Usi ${azione.consumabile}: recuperi ${pg.pf - prima} PF.`);
        } else cs.log.push('Non hai niente da usare: perdi il momento.');
      } else {
        const bersaglio = cs.combattenti.find((x) => x.id === azione.bersaglio && inPiedi(x))
          ?? cs.combattenti.find((x) => x.lato === 'nemico' && inPiedi(x));
        if (!bersaglio) break;
        if (azione.tipo === 'attacco') attacca(att, bersaglio, rng, cs.log);
        else intimidisci(att, bersaglio, rng, cs.log);
      }
    } else {
      attacca(att, pg, rng, cs.log);
    }
    if (controllaFine(cs)) break;
  }
  for (const x of cs.combattenti) {
    if (x.malusRound > 0 && --x.malusRound === 0) x.malus = 0;
  }
  cs.round++;
  if (!cs.finito && cs.round > ROUND_MAX) { cs.finito = true; cs.vinto = false; cs.log.push('Lo scontro si trascina fino allo sfinimento.'); }
}

/** Ferite a fine combattimento (6.6). */
export function feriteDopo(cs: StatoCombattimento, feriteSconfitta: number): number {
  const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
  if (!cs.vinto) return feriteSconfitta;
  const quota = pg.pf / pg.pfMax;
  if (quota >= 0.8) return 0;
  if (quota >= 0.4) return 0.5;
  return 1;
}

/** Strategia automatica per il simulatore: attacca il nemico più malconcio. */
function azioneAutomatica(cs: StatoCombattimento): Azione {
  const bersaglio = cs.combattenti.filter((x) => x.lato === 'nemico' && inPiedi(x)).sort((a, b) => a.pf - b.pf)[0];
  return { tipo: 'attacco', bersaglio: bersaglio?.id ?? '' };
}

export function probabilitaVittoria(pg: Combattente, sc: TScontro, c: TContenuti, prove = 2000, seme = 1): number {
  const rng = rngConSeme(seme);
  let vinte = 0;
  for (let i = 0; i < prove; i++) {
    const cs = iniziaCombattimento(pg, sc, c, {}, rng);
    while (!cs.finito) round(cs, azioneAutomatica(cs), rng);
    if (cs.vinto) vinte++;
  }
  return vinte / prove;
}

export function etichettaCombattimento(p: number): string {
  return ETICHETTE_COMBATTIMENTO.find((e) => p >= e.min)!.etichetta;
}
