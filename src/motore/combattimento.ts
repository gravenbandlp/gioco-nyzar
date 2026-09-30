// Combattimento a round (Regolamento, sezioni 6 e 7) e simulatore delle etichette.
import { tira, rngConSeme, type Rng } from './dadi';
import { ETICHETTE_COMBATTIMENTO, MAX_CONSUMABILI_IN_COMBATTIMENTO, ROUND_MAX } from './regole';
import type { TContenuti, TIncantesimo, TNemico, TScontro, TModifica } from './contenuto';
import { abilitaEffettiva, type Stato } from './personaggio';
import { baseArma, baseArmatura, dadiDifesa, dadiIniziativa, energiaExtra, haProprieta, repertiAttivi } from './oggetti';
import { sommaMutazioni, tormentoDissonanza } from './crisi';

/** Consumabili usabili in combattimento e il loro effetto. */
export const CONSUMABILI: Record<string, { pf?: number; energia?: number }> = {
  bende: { pf: 2 },
  tonico: { pf: 4 },
  'estratto-di-energia': { energia: 3 },
};

export interface Effetto extends TModifica { fonte: string }
export interface Veleno { valore: number; round: number; fonte: string }

export interface Combattente {
  id: string;
  nome: string;
  lato: 'pg' | 'nemico';
  attacco: number;
  difesa: number; // Fisico + Acrobazia
  difesaMentale: number; // Mentale + Resilienza
  difesaFisica: number; // Fisico + Resistenza
  intimidire: number;
  magia: number; // Mentale + Magia
  energia: number;
  energiaMax: number;
  pf: number;
  pfMax: number;
  danno: number;
  riduzione: number;
  ignora: number;
  iniziativa: number;
  sommaIniziativa: number;
  puoFuggire: boolean;
  tratti: string[];
  effetti: Effetto[];
  veleni: Veleno[];
  fuggito: boolean;
  tecnologia?: number; // Mentale + Tecnologia, per i reperti
  // proprietà e difetti degli oggetti
  ultimoRespiro?: boolean;
  ostinata?: boolean;
  assetata?: boolean;
  inceppamento?: boolean;
  ricarica?: boolean;
  ricaricando?: boolean;
  portata?: boolean;
  dissonanza?: number; // Tormento dato da una Dissonanza (½, di più con certe mutazioni)
}

export interface RepertoInCombattimento {
  id: string;
  nome: string;
  tipo: 'attacco' | 'difesa' | 'cura';
  cariche: number;
  danno: number;
  ignora: number;
  cura: number;
  modifica?: TModifica;
}

export type Azione =
  | { tipo: 'attacco'; bersaglio: string }
  | { tipo: 'intimidire'; bersaglio: string }
  | { tipo: 'incantesimo'; incantesimo: string; bersaglio?: string }
  | { tipo: 'reperto'; reperto: string; bersaglio?: string }
  | { tipo: 'cura'; consumabile: string }; // usare un consumabile

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
  incantesimi: TIncantesimo[]; // il repertorio portato nello scontro
  costi: Record<string, number>; // Dissonanza, prezzi delle formule, cariche e guasti: applicati alla fine
  reperti?: RepertoInCombattimento[];
}

export const inPiedi = (c: Combattente) => c.pf > 0 && !c.fuggito;

type TipoTiro = 'attacco' | 'difesa' | 'riduzione' | 'magia' | 'mentale' | 'fisica' | 'sociale' | 'tecnologia';

/** Somma delle modifiche attive per un tiro. Le modifiche "tutti" valgono per ogni tiro tranne la riduzione. */
export function modifica(c: Combattente, tipo: TipoTiro): number {
  let tot = 0;
  for (const e of c.effetti ?? []) {
    if (e.tipo === tipo) tot += e.valore;
    else if (e.tipo === 'tutti' && tipo !== 'riduzione') tot += e.valore;
  }
  return tot;
}
const pool = (base: number, mod: number) => Math.max(0, base + mod);

export function combattenteDaStato(s: Stato, c: TContenuti): Combattente {
  const { arma, og: ogArma } = baseArma(s, c);
  const { armatura, og: ogArm } = baseArmatura(s, c);
  const abilArma = arma?.abilita ?? 'rissa';
  const pa = ogArma?.proprieta;
  const ignora = (arma?.proprieta.includes('Perforante') ? 2 : 0) + (arma?.proprieta.includes('Contundente') ? 1 : 0) + (pa?.penetrante ?? 0);
  const eff = (a: string) => abilitaEffettiva(s, a, c);
  const energia = s.attributi.mentale + (s.abilita['magia'] ?? 0) + energiaExtra(s, c) + sommaMutazioni(s, c, 'energia');
  const pf = Math.max(1, 5 + s.attributi.fisico + (s.abilita['resistenza'] ?? 0) + sommaMutazioni(s, c, 'pf'));
  const maniNude = !arma || arma.id === 'mani-nude' ? sommaMutazioni(s, c, 'dannoManiNude') : 0;
  return {
    id: 'pg',
    nome: s.nome,
    lato: 'pg',
    attacco: s.attributi.fisico + eff(abilArma) + (ogArma?.dadi ?? 0),
    difesa: s.attributi.fisico + eff('acrobazia') + dadiDifesa(s, c),
    difesaMentale: s.attributi.mentale + eff('resilienza'),
    difesaFisica: s.attributi.fisico + eff('resistenza'),
    intimidire: s.attributi.sociale + eff('intimidire'),
    magia: s.attributi.mentale + (s.abilita['magia'] ?? 0),
    energia,
    energiaMax: energia,
    pf,
    pfMax: pf,
    danno: (arma?.danno ?? 0) + (pa?.affilata ?? 0) + maniNude,
    riduzione: (armatura?.riduzione ?? 0) + (ogArm?.proprieta.robusta ?? 0) + sommaMutazioni(s, c, 'riduzione'),
    ignora,
    iniziativa: eff('atletica') + eff('percezione') + dadiIniziativa(s, c),
    sommaIniziativa: eff('atletica') + eff('percezione'),
    puoFuggire: false,
    tratti: [],
    effetti: [],
    veleni: [],
    fuggito: false,
    tecnologia: s.attributi.mentale + eff('tecnologia'),
    ultimoRespiro: haProprieta(s, c, 'ultimoRespiro'),
    ostinata: !!pa?.ostinata,
    assetata: !!pa?.assetata,
    inceppamento: !!ogArma?.difetti.includes('inceppamento'),
    ricarica: !!arma?.proprieta.includes('Ricarica') && !pa?.caricatore,
    portata: !!arma?.proprieta.includes('Portata'),
    dissonanza: tormentoDissonanza(s, c),
  };
}

/** I reperti decifrati e carichi che si possono usare in combattimento. */
export function repertiDaStato(s: Stato, c: TContenuti): RepertoInCombattimento[] {
  return repertiAttivi(s, c)
    .filter((o) => o.reperto!.tipo !== 'passivo' && (s.quality[`cariche.${o.id}`] ?? 0) > 0)
    .map((o) => ({
      id: o.id, nome: o.nome, tipo: o.reperto!.tipo as 'attacco' | 'difesa' | 'cura', cariche: s.quality[`cariche.${o.id}`] ?? 0,
      danno: o.reperto!.danno, ignora: o.reperto!.ignora, cura: o.reperto!.cura, modifica: o.reperto!.modifica,
    }));
}

export function combattenteDaNemico(n: TNemico, indice: number): Combattente {
  return {
    id: `${n.id}#${indice}`,
    nome: n.nome,
    lato: 'nemico',
    attacco: n.attacco,
    difesa: n.difesa,
    difesaMentale: n.difesaMentale,
    difesaFisica: n.difesa,
    intimidire: 0,
    magia: 0,
    energia: 0,
    energiaMax: 0,
    pf: n.pf,
    pfMax: n.pf,
    danno: n.danno,
    riduzione: n.riduzione,
    ignora: 0,
    iniziativa: n.iniziativa,
    sommaIniziativa: n.iniziativa,
    puoFuggire: n.puoFuggire,
    tratti: n.tratti ?? [],
    effetti: [],
    veleni: [],
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
  for (const id of Object.keys(conta)) {
    if (conta[id]! > 1) lista.filter((x) => x.id.startsWith(id + '#')).forEach((x, i) => (x.nome = `${x.nome} ${i + 1}`));
  }
  return lista;
}

export function iniziaCombattimento(
  pg: Combattente, sc: TScontro, c: TContenuti, consumabili: Record<string, number>, rng: Rng = Math.random,
  incantesimi: TIncantesimo[] = [], reperti: RepertoInCombattimento[] = [],
): StatoCombattimento {
  const combattenti = [{ ...pg, effetti: [], veleni: [] }, ...nemiciDelloScontro(sc, c)];
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
    incantesimi: incantesimi.filter((i) => i.uso.includes('combattimento')),
    costi: {},
    reperti: reperti.map((r) => ({ ...r })),
  };
}

// ---------------------------------------------------------------- azioni

function infliggi(dif: Combattente, danno: number, log: string[], prefisso: string): void {
  dif.pf = Math.max(0, dif.pf - danno);
  if (dif.pf === 0 && dif.ultimoRespiro) {
    dif.pf = 1;
    dif.ultimoRespiro = false;
    log.push(`${prefisso}, ${danno} ${danno === 1 ? 'danno' : 'danni'}. Stai per cadere, ma resti in piedi (Ultimo respiro).`);
    return;
  }
  const fuori = dif.pf === 0 ? (dif.lato === 'pg' ? ' Crolli a terra.' : ` ${dif.nome} è fuori combattimento.`) : '';
  log.push(`${prefisso}, ${danno} ${danno === 1 ? 'danno' : 'danni'}.${fuori}`);
}

function attacca(att: Combattente, dif: Combattente, rng: Rng, log: string[]): void {
  const a = tira(pool(att.attacco, modifica(att, 'attacco')), rng).successi;
  const d = tira(pool(dif.difesa, modifica(dif, 'difesa')), rng).successi;
  const soggetto = att.lato === 'pg' ? 'Colpisci' : `${att.nome} colpisce`;
  const oggetto = dif.lato === 'pg' ? 'te' : dif.nome;
  if (a === 0 && att.inceppamento) {
    aggiungiEffetto(att, { tipo: 'salta', valore: 0, round: 1 }, 'inceppamento');
    log.push(`${att.lato === 'pg' ? "L'arma" : `L'arma di ${att.nome}`} si inceppa: perdi il prossimo round per sbloccarla.`);
  }
  if (a > d) {
    const rid = Math.max(0, dif.riduzione + modifica(dif, 'riduzione') - att.ignora);
    const ostinata = att.ostinata && att.pf < att.pfMax / 2 ? 2 : 0;
    infliggi(dif, Math.max(1, a - d + att.danno + ostinata - rid), log, `${soggetto} ${oggetto}: ${a} contro ${d}`);
    if (att.assetata && att.pf < att.pfMax) { att.pf += 1; log.push('L\'arma beve: recuperi 1 PF.'); }
  } else {
    log.push(att.lato === 'pg' ? `Attacchi ${oggetto}: ${a} contro ${d}, parato.` : `${att.nome} attacca ${oggetto}: ${a} contro ${d}, schivato.`);
  }
}

/** Lo stesso effetto non si somma a se stesso: si rinnova. */
function aggiungiEffetto(c: Combattente, m: TModifica, fonte: string): void {
  c.effetti = (c.effetti ?? []).filter((e) => e.fonte !== fonte);
  c.effetti.push({ ...m, fonte });
}

function intimidisci(att: Combattente, dif: Combattente, rng: Rng, log: string[]): void {
  const a = tira(pool(att.intimidire, modifica(att, 'sociale')), rng).successi;
  const d = tira(pool(dif.difesaMentale, modifica(dif, 'mentale')), rng).successi;
  if (a > d) {
    if (a - d >= 3 && dif.puoFuggire) {
      dif.fuggito = true;
      log.push(`Intimidisci ${dif.nome}: ${a} contro ${d}. Scappa.`);
    } else {
      aggiungiEffetto(dif, { tipo: 'attacco', valore: -1, round: 2 }, 'intimidire');
      log.push(`Intimidisci ${dif.nome}: ${a} contro ${d}. Esita: −1 dado in attacco per 2 round.`);
    }
  } else log.push(`Provi a intimidire ${dif.nome}: ${a} contro ${d}. Non si lascia impressionare.`);
}

function tiroDifesa(dif: Combattente, tipo: 'acrobazia' | 'resilienza' | 'resistenza', rng: Rng): number {
  if (tipo === 'resilienza') return tira(pool(dif.difesaMentale, modifica(dif, 'mentale')), rng).successi;
  if (tipo === 'resistenza') return tira(pool(dif.difesaFisica, modifica(dif, 'fisica')), rng).successi;
  return tira(pool(dif.difesa, modifica(dif, 'difesa')), rng).successi;
}

/** Motivo per cui l'incantesimo non si può lanciare adesso, o null. */
export function perchéNonLanciabile(cs: StatoCombattimento, inc: TIncantesimo, bersaglio?: Combattente): string | null {
  const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
  if (pg.energia < inc.livello) return 'Non hai abbastanza Energia.';
  if (inc.solo.length && bersaglio && !inc.solo.some((t) => bersaglio.tratti.includes(t))) return `Funziona solo su: ${inc.solo.join(', ')}.`;
  return null;
}

export function descriviModifica(m: TModifica): string {
  if (m.tipo === 'salta') return 'salta il prossimo round';
  const segno = m.valore > 0 ? '+' : '−';
  const quanto = Math.abs(m.valore);
  const dove = { attacco: 'in attacco', difesa: 'in difesa', tutti: 'a tutti i tiri', riduzione: 'di riduzione' }[m.tipo];
  const unita = m.tipo === 'riduzione' ? '' : quanto === 1 ? ' dado' : ' dadi';
  return `${segno}${quanto}${unita} ${dove} per ${m.round} round`;
}

function lancia(att: Combattente, inc: TIncantesimo, bersaglio: Combattente | undefined, cs: StatoCombattimento, rng: Rng): void {
  const log = cs.log;
  const motivo = perchéNonLanciabile(cs, inc, bersaglio);
  if (motivo) { log.push(`${inc.nome}: ${motivo}`); return; }
  att.energia -= inc.livello;
  for (const [k, v] of Object.entries(inc.prezzo ?? {})) cs.costi[k] = (cs.costi[k] ?? 0) + v;
  const s = tira(pool(att.magia, modifica(att, 'magia')), rng).successi;
  if (s === 0) {
    cs.costi['tormento'] = (cs.costi['tormento'] ?? 0) + (att.dissonanza ?? 0.5);
    log.push(`${inc.nome}: nessun successo, il Mana ti torna indietro (Dissonanza).`);
    return;
  }
  const nemiciVivi = cs.combattenti.filter((x) => x.lato !== att.lato && inPiedi(x));
  const bers = bersaglio && inPiedi(bersaglio) ? bersaglio : nemiciVivi[0];
  switch (inc.tipo) {
    case 'attacco':
    case 'automatico': {
      if (!bers) return;
      const a = inc.tipo === 'automatico' ? inc.successi! : s;
      const d = tiroDifesa(bers, inc.difesa!, rng);
      if (a > d) {
        let danno = a - d + inc.danno;
        if (inc.doppioContro.some((t) => bers.tratti.includes(t))) danno *= 2;
        infliggi(bers, Math.max(1, danno), log, `${inc.nome} su ${bers.nome}: ${a} contro ${d}`);
        if (inc.veleno && bers.pf > 0) bers.veleni.push({ ...inc.veleno, fonte: inc.id });
      } else log.push(`${inc.nome} su ${bers.nome}: ${a} contro ${d}, senza effetto.`);
      break;
    }
    case 'area': {
      for (const b of nemiciVivi) {
        const d = tiroDifesa(b, inc.difesa!, rng);
        if (s > d) infliggi(b, Math.max(1, s - d + inc.danno), log, `${inc.nome} su ${b.nome}: ${s} contro ${d}`);
        else log.push(`${inc.nome} su ${b.nome}: ${s} contro ${d}, senza effetto.`);
        if (controllaFine(cs)) break;
      }
      break;
    }
    case 'potenziamento':
      aggiungiEffetto(att, inc.modifica!, inc.id);
      log.push(`${inc.nome}: ${descriviModifica(inc.modifica!)}.`);
      break;
    case 'indebolimento': {
      if (!bers) return;
      const d = tiroDifesa(bers, inc.difesa!, rng);
      if (s > d) { aggiungiEffetto(bers, inc.modifica!, inc.id); log.push(`${inc.nome} su ${bers.nome}: ${s} contro ${d}, ${descriviModifica(inc.modifica!)}.`); }
      else log.push(`${inc.nome} su ${bers.nome}: ${s} contro ${d}, resiste.`);
      break;
    }
    case 'cura': {
      const prima = att.pf;
      att.pf = Math.min(att.pfMax, att.pf + s);
      log.push(`${inc.nome}: recuperi ${att.pf - prima} PF.`);
      break;
    }
    case 'fuga': {
      if (!bers) return;
      const d = tiroDifesa(bers, inc.difesa!, rng);
      if (s - d >= (inc.margineFuga ?? 2)) { bers.fuggito = true; log.push(`${inc.nome}: ${bers.nome} si calma e se ne va.`); }
      else log.push(`${inc.nome} su ${bers.nome}: ${s} contro ${d}, non basta.`);
      break;
    }
    default:
      log.push(`${inc.nome} non ha effetto in combattimento.`);
  }
}

function usaReperto(att: Combattente, rid: string, bersaglio: Combattente | undefined, cs: StatoCombattimento, rng: Rng): void {
  const r = (cs.reperti ?? []).find((x) => x.id === rid);
  if (!r || r.cariche <= 0) { cs.log.push('Il reperto non ha cariche.'); return; }
  const s = tira(pool(att.tecnologia ?? 0, modifica(att, 'tecnologia')), rng).successi;
  if (s === 0) {
    cs.costi[`guasto.${r.id}`] = 1;
    cs.reperti = (cs.reperti ?? []).filter((x) => x.id !== r.id);
    cs.log.push(`${r.nome}: nessun successo. Il reperto emette un sibilo e si spegne (guasto).`);
    return;
  }
  r.cariche--;
  cs.costi[`cariche.${r.id}`] = (cs.costi[`cariche.${r.id}`] ?? 0) - 1;
  if (r.tipo === 'attacco') {
    const b = bersaglio && inPiedi(bersaglio) ? bersaglio : cs.combattenti.find((x) => x.lato === 'nemico' && inPiedi(x));
    if (!b) return;
    const d = tira(pool(b.difesa, modifica(b, 'difesa')), rng).successi;
    if (s > d) {
      const rid = Math.max(0, b.riduzione + modifica(b, 'riduzione') - r.ignora);
      infliggi(b, Math.max(1, s - d + r.danno - rid), cs.log, `${r.nome} su ${b.nome}: ${s} contro ${d}`);
    } else cs.log.push(`${r.nome} su ${b.nome}: ${s} contro ${d}, mancato.`);
  } else if (r.tipo === 'difesa' && r.modifica) {
    aggiungiEffetto(att, r.modifica, r.id);
    cs.log.push(`${r.nome}: ${descriviModifica(r.modifica)}.`);
  } else if (r.tipo === 'cura') {
    const prima = att.pf;
    att.pf = Math.min(att.pfMax, att.pf + r.cura);
    cs.log.push(`${r.nome}: recuperi ${att.pf - prima} PF.`);
  }
}

function usaConsumabile(cs: StatoCombattimento, pg: Combattente, k: string): void {
  const disponibili = (cs.consumabili[k] ?? 0) - (cs.usati[k] ?? 0);
  const totUsati = Object.values(cs.usati).reduce((a, b) => a + b, 0);
  const eff = CONSUMABILI[k];
  if (!eff || disponibili <= 0 || totUsati >= MAX_CONSUMABILI_IN_COMBATTIMENTO) { cs.log.push('Non hai niente da usare e perdi il momento.'); return; }
  cs.usati[k] = (cs.usati[k] ?? 0) + 1;
  if (eff.pf) { const prima = pg.pf; pg.pf = Math.min(pg.pfMax, pg.pf + eff.pf); cs.log.push(`Usi ${k}: recuperi ${pg.pf - prima} PF.`); }
  if (eff.energia) { pg.energia += eff.energia; cs.log.push(`Usi ${k}: recuperi ${eff.energia} Energia.`); }
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
  cs.incantesimi ??= [];
  cs.costi ??= {};
  const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
  // Portata: nel primo round attacchi per primo
  const ordine = cs.round === 1 && pg.portata && azione.tipo === 'attacco' ? ['pg', ...cs.ordine.filter((x) => x !== 'pg')] : cs.ordine;
  for (const id of ordine) {
    const att = cs.combattenti.find((x) => x.id === id)!;
    if (!inPiedi(att)) continue;
    att.effetti ??= []; att.veleni ??= [];
    const paralisi = att.effetti.find((e) => e.tipo === 'salta');
    if (paralisi) {
      att.effetti = att.effetti.filter((e) => e !== paralisi);
      cs.log.push(att.lato === 'pg' ? 'Non riesci a muoverti e perdi il turno.' : `${att.nome} non riesce a muoversi.`);
      continue;
    }
    if (att.lato === 'pg') {
      const scelto = 'bersaglio' in azione && azione.bersaglio ? cs.combattenti.find((x) => x.id === azione.bersaglio && inPiedi(x)) : undefined;
      const b = scelto ?? cs.combattenti.find((x) => x.lato === 'nemico' && inPiedi(x));
      if (azione.tipo === 'cura') usaConsumabile(cs, pg, azione.consumabile);
      else if (azione.tipo === 'incantesimo') {
        const inc = cs.incantesimi.find((i) => i.id === azione.incantesimo);
        if (inc) lancia(att, inc, b, cs, rng);
        else cs.log.push('Quell\'incantesimo non è nel tuo repertorio.');
      } else if (azione.tipo === 'reperto') {
        usaReperto(att, azione.reperto, b, cs, rng);
      } else if (b) {
        if (azione.tipo === 'attacco') {
          if (att.ricaricando) { att.ricaricando = false; cs.log.push('Ricarichi l\'arma.'); }
          else { attacca(att, b, rng, cs.log); if (att.ricarica) att.ricaricando = true; }
        } else intimidisci(att, b, rng, cs.log);
      }
    } else {
      attacca(att, pg, rng, cs.log);
    }
    if (controllaFine(cs)) break;
  }
  // fine round: veleni e scadenza degli effetti
  for (const x of cs.combattenti) {
    if (!inPiedi(x) || cs.finito) continue;
    for (const v of x.veleni ?? []) {
      infliggi(x, v.valore, cs.log, `Il veleno lavora su ${x.lato === 'pg' ? 'di te' : x.nome}`);
      v.round--;
    }
    x.veleni = (x.veleni ?? []).filter((v) => v.round > 0);
    for (const e of x.effetti ?? []) if (e.tipo !== 'salta') e.round--;
    x.effetti = (x.effetti ?? []).filter((e) => e.tipo === 'salta' || e.round > 0);
    if (controllaFine(cs)) break;
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

// ---------------------------------------------------------------- simulatore

/** Strategia automatica: si cura se è malconcio, altrimenti sceglie l'attacco (arma o incantesimo) con più danno atteso. */
export function azioneAutomatica(cs: StatoCombattimento): Azione {
  const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
  const nemici = cs.combattenti.filter((x) => x.lato === 'nemico' && inPiedi(x)).sort((a, b) => a.pf - b.pf);
  const b = nemici[0];
  if (!b) return { tipo: 'attacco', bersaglio: '' };
  const lanciabili = (cs.incantesimi ?? []).filter((i) => pg.energia >= i.livello && !(i.solo.length && !i.solo.some((t) => b.tratti.includes(t))));
  if (pg.pf / pg.pfMax < 0.4) {
    const cura = lanciabili.find((i) => i.tipo === 'cura');
    if (cura) return { tipo: 'incantesimo', incantesimo: cura.id };
  }
  const difesa = (tipo?: string) => (tipo === 'resilienza' ? b.difesaMentale : tipo === 'resistenza' ? b.difesaFisica : b.difesa);
  let migliore: Azione = { tipo: 'attacco', bersaglio: b.id };
  let valore = pg.attacco / 2 - b.difesa / 2 + pg.danno - Math.max(0, b.riduzione - pg.ignora);
  for (const i of lanciabili) {
    let v = -Infinity;
    if (i.tipo === 'attacco') v = pg.magia / 2 - difesa(i.difesa) / 2 + i.danno + (i.veleno ? i.veleno.valore * i.veleno.round : 0);
    else if (i.tipo === 'automatico') v = i.successi! - difesa(i.difesa) / 2 + i.danno;
    else if (i.tipo === 'area') v = (pg.magia / 2 - difesa(i.difesa) / 2 + i.danno) * nemici.length;
    if (i.doppioContro.some((t) => b.tratti.includes(t))) v *= 2;
    if (v > valore) { valore = v; migliore = { tipo: 'incantesimo', incantesimo: i.id, bersaglio: b.id }; }
  }
  return migliore;
}

export function probabilitaVittoria(
  pg: Combattente, sc: TScontro, c: TContenuti, prove = 2000, seme = 1, incantesimi: TIncantesimo[] = [],
): number {
  const rng = rngConSeme(seme);
  let vinte = 0;
  for (let i = 0; i < prove; i++) {
    const cs = iniziaCombattimento(pg, sc, c, {}, rng, incantesimi);
    while (!cs.finito) round(cs, azioneAutomatica(cs), rng);
    if (cs.vinto) vinte++;
  }
  return vinte / prove;
}

export function etichettaCombattimento(p: number): string {
  return ETICHETTE_COMBATTIMENTO.find((e) => p >= e.min)!.etichetta;
}
