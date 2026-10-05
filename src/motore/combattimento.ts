// Combattimento a round (Regolamento, sezioni 6 e 7) e simulatore delle etichette.
import { tira, rngConSeme, type Rng, type Tiro } from './dadi';
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

/** `appena`: messo da chi lo porta durante il suo turno, che quindi non conta (Benedizione vale per i 2 turni dopo). */
export interface Effetto extends TModifica { fonte: string; appena?: boolean }
export interface Veleno { valore: number; round: number; fonte: string }

/**
 * Quello che succede in una riga del registro, per l'interfaccia che lo mette in scena: chi agisce, contro chi, i dadi
 * dei due tiri, l'esito, e i PF di ogni combattente (nell'ordine di `combattenti`) subito dopo.
 */
export interface Evento {
  riga: number;
  round: number;
  tipo: 'info' | 'attacco' | 'intimidire' | 'magia' | 'reperto' | 'effetto' | 'cura' | 'veleno' | 'dissonanza' | 'fermo';
  chi?: string;
  contro?: string;
  nome?: string; // incantesimo o reperto
  tiro?: number[];
  fissi?: number; // successi fissi degli incantesimi automatici
  difesa?: number[];
  colpo?: boolean;
  danno?: number;
  cura?: number;
  caduto?: boolean;
  fuga?: boolean;
  pf: number[];
  energia: number;
}

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
  eventi?: Evento[]; // assenti nei salvataggi di prima del 5 ottobre 2026
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
  const cs: StatoCombattimento = {
    scontro: sc.id,
    nome: sc.nome,
    combattenti,
    ordine: tiri.map((t) => t.id),
    round: 1,
    log: [],
    finito: false,
    vinto: false,
    consumabili,
    usati: {},
    incantesimi: incantesimi.filter((i) => i.uso.includes('combattimento')),
    costi: {},
    reperti: reperti.map((r) => ({ ...r })),
    eventi: [],
  };
  annota(cs, `Iniziativa: ${tiri.map((t) => combattenti.find((x) => x.id === t.id)!.nome).join(' → ')}.`);
  return cs;
}

// ---------------------------------------------------------------- azioni

/** Annota una riga del registro e l'evento che la accompagna, con i PF di tutti subito dopo. */
function annota(cs: StatoCombattimento, testo: string, ev: Omit<Evento, 'riga' | 'round' | 'pf' | 'energia'> = { tipo: 'info' }): void {
  cs.log.push(testo);
  (cs.eventi ??= []).push({
    ...ev, riga: cs.log.length - 1, round: cs.round,
    pf: cs.combattenti.map((x) => x.pf), energia: cs.combattenti.find((x) => x.lato === 'pg')?.energia ?? 0,
  });
}

function infliggi(cs: StatoCombattimento, dif: Combattente, danno: number, prefisso: string, ev: Omit<Evento, 'riga' | 'round' | 'pf' | 'energia'>): void {
  dif.pf = Math.max(0, dif.pf - danno);
  const e = { ...ev, contro: dif.id, danno, colpo: true };
  if (dif.pf === 0 && dif.ultimoRespiro) {
    dif.pf = 1;
    dif.ultimoRespiro = false;
    annota(cs, `${prefisso}, ${danno} ${danno === 1 ? 'danno' : 'danni'}. Stai per cadere, ma resti in piedi (Ultimo respiro).`, e);
    return;
  }
  const fuori = dif.pf === 0 ? (dif.lato === 'pg' ? ' Crolli a terra.' : ` ${dif.nome} è fuori combattimento.`) : '';
  annota(cs, `${prefisso}, ${danno} ${danno === 1 ? 'danno' : 'danni'}.${fuori}`, { ...e, caduto: dif.pf === 0 });
}

function attacca(cs: StatoCombattimento, att: Combattente, dif: Combattente, rng: Rng): void {
  const ta = tira(pool(att.attacco, modifica(att, 'attacco')), rng);
  const td = tira(pool(dif.difesa, modifica(dif, 'difesa')), rng);
  const a = ta.successi, d = td.successi;
  const ev = { tipo: 'attacco' as const, chi: att.id, contro: dif.id, tiro: ta.facce, difesa: td.facce };
  const soggetto = att.lato === 'pg' ? 'Colpisci' : `${att.nome} colpisce`;
  const oggetto = dif.lato === 'pg' ? 'te' : dif.nome;
  if (a === 0 && att.inceppamento) {
    aggiungiEffetto(att, { tipo: 'salta', valore: 0, round: 1 }, 'inceppamento');
    annota(cs, `${att.lato === 'pg' ? "L'arma" : `L'arma di ${att.nome}`} si inceppa: perdi il prossimo round per sbloccarla.`, { tipo: 'info', chi: att.id });
  }
  if (a > d) {
    const rid = Math.max(0, dif.riduzione + modifica(dif, 'riduzione') - att.ignora);
    const ostinata = att.ostinata && att.pf < att.pfMax / 2 ? 2 : 0;
    infliggi(cs, dif, Math.max(1, a - d + att.danno + ostinata - rid), `${soggetto} ${oggetto}: ${a} contro ${d}`, ev);
    if (att.assetata && att.pf < att.pfMax) { att.pf += 1; annota(cs, 'L\'arma beve: recuperi 1 PF.', { tipo: 'cura', chi: att.id, contro: att.id, cura: 1 }); }
  } else {
    annota(cs, att.lato === 'pg' ? `Attacchi ${oggetto}: ${a} contro ${d}, parato.` : `${att.nome} attacca ${oggetto}: ${a} contro ${d}, schivato.`, { ...ev, colpo: false });
  }
}

/**
 * Lo stesso effetto non si somma a se stesso: si rinnova. La durata si conta in turni di chi lo porta, e scala alla
 * fine di ciascuno; un effetto che ti dai da solo parte dal turno dopo.
 */
function aggiungiEffetto(c: Combattente, m: TModifica, fonte: string, suSeStesso = false): void {
  c.effetti = (c.effetti ?? []).filter((e) => e.fonte !== fonte);
  c.effetti.push({ ...m, fonte, ...(suSeStesso ? { appena: true } : {}) });
}

function scalaEffetti(c: Combattente): void {
  for (const e of c.effetti ?? []) {
    if (e.tipo === 'salta') continue;
    if (e.appena) delete e.appena;
    else e.round--;
  }
  c.effetti = (c.effetti ?? []).filter((e) => e.tipo === 'salta' || e.round > 0);
}

function intimidisci(cs: StatoCombattimento, att: Combattente, dif: Combattente, rng: Rng): void {
  const ta = tira(pool(att.intimidire, modifica(att, 'sociale')), rng);
  const td = tira(pool(dif.difesaMentale, modifica(dif, 'mentale')), rng);
  const a = ta.successi, d = td.successi;
  const ev = { tipo: 'intimidire' as const, chi: att.id, contro: dif.id, tiro: ta.facce, difesa: td.facce };
  if (a > d) {
    if (a - d >= 3 && dif.puoFuggire) {
      dif.fuggito = true;
      annota(cs, `Intimidisci ${dif.nome}: ${a} contro ${d}. Scappa.`, { ...ev, colpo: true, fuga: true });
    } else {
      aggiungiEffetto(dif, { tipo: 'attacco', valore: -1, round: 2 }, 'intimidire');
      annota(cs, `Intimidisci ${dif.nome}: ${a} contro ${d}. Esita: −1 dado in attacco per 2 round.`, { ...ev, colpo: true });
    }
  } else annota(cs, `Provi a intimidire ${dif.nome}: ${a} contro ${d}. Non si lascia impressionare.`, { ...ev, colpo: false });
}

function tiroDifesa(dif: Combattente, tipo: 'acrobazia' | 'resilienza' | 'resistenza', rng: Rng): Tiro {
  if (tipo === 'resilienza') return tira(pool(dif.difesaMentale, modifica(dif, 'mentale')), rng);
  if (tipo === 'resistenza') return tira(pool(dif.difesaFisica, modifica(dif, 'fisica')), rng);
  return tira(pool(dif.difesa, modifica(dif, 'difesa')), rng);
}

/** I dadi di difesa contro un incantesimo, per l'anteprima dei bottoni. */
export function dadiDifesaContro(dif: Combattente, tipo: 'acrobazia' | 'resilienza' | 'resistenza' | undefined): number {
  if (tipo === 'resilienza') return pool(dif.difesaMentale, modifica(dif, 'mentale'));
  if (tipo === 'resistenza') return pool(dif.difesaFisica, modifica(dif, 'fisica'));
  return pool(dif.difesa, modifica(dif, 'difesa'));
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
  const motivo = perchéNonLanciabile(cs, inc, bersaglio);
  if (motivo) { annota(cs, `${inc.nome}: ${motivo}`, { tipo: 'info', chi: att.id }); return; }
  att.energia -= inc.livello;
  for (const [k, v] of Object.entries(inc.prezzo ?? {})) cs.costi[k] = (cs.costi[k] ?? 0) + v;
  const t = tira(pool(att.magia, modifica(att, 'magia')), rng);
  const s = t.successi;
  const base = { chi: att.id, nome: inc.nome, tiro: t.facce };
  if (s === 0) {
    cs.costi['tormento'] = (cs.costi['tormento'] ?? 0) + (att.dissonanza ?? 0.5);
    annota(cs, `${inc.nome}: nessun successo, il Mana ti torna indietro (Dissonanza).`, { ...base, tipo: 'dissonanza' });
    return;
  }
  const nemiciVivi = cs.combattenti.filter((x) => x.lato !== att.lato && inPiedi(x));
  const bers = bersaglio && inPiedi(bersaglio) ? bersaglio : nemiciVivi[0];
  switch (inc.tipo) {
    case 'attacco':
    case 'automatico': {
      if (!bers) return;
      const a = inc.tipo === 'automatico' ? inc.successi! : s;
      const td = tiroDifesa(bers, inc.difesa!, rng);
      const d = td.successi;
      const ev = { ...base, tipo: 'magia' as const, contro: bers.id, difesa: td.facce, ...(inc.tipo === 'automatico' ? { tiro: undefined, fissi: a } : {}) };
      if (a > d) {
        let danno = a - d + inc.danno;
        if (inc.doppioContro.some((tr) => bers.tratti.includes(tr))) danno *= 2;
        infliggi(cs, bers, Math.max(1, danno), `${inc.nome} su ${bers.nome}: ${a} contro ${d}`, ev);
        if (inc.veleno && bers.pf > 0) bers.veleni.push({ ...inc.veleno, fonte: inc.id });
      } else annota(cs, `${inc.nome} su ${bers.nome}: ${a} contro ${d}, senza effetto.`, { ...ev, colpo: false });
      break;
    }
    case 'area': {
      for (const b of nemiciVivi) {
        const td = tiroDifesa(b, inc.difesa!, rng);
        const d = td.successi;
        const ev = { ...base, tipo: 'magia' as const, contro: b.id, difesa: td.facce };
        if (s > d) infliggi(cs, b, Math.max(1, s - d + inc.danno), `${inc.nome} su ${b.nome}: ${s} contro ${d}`, ev);
        else annota(cs, `${inc.nome} su ${b.nome}: ${s} contro ${d}, senza effetto.`, { ...ev, colpo: false });
        if (controllaFine(cs)) break;
      }
      break;
    }
    case 'potenziamento':
      aggiungiEffetto(att, inc.modifica!, inc.id, true);
      annota(cs, `${inc.nome}: ${descriviModifica(inc.modifica!)}.`, { ...base, tipo: 'effetto', contro: att.id, colpo: true });
      break;
    case 'indebolimento': {
      if (!bers) return;
      const td = tiroDifesa(bers, inc.difesa!, rng);
      const d = td.successi;
      const ev = { ...base, tipo: 'magia' as const, contro: bers.id, difesa: td.facce };
      if (s > d) { aggiungiEffetto(bers, inc.modifica!, inc.id); annota(cs, `${inc.nome} su ${bers.nome}: ${s} contro ${d}, ${descriviModifica(inc.modifica!)}.`, { ...ev, colpo: true }); }
      else annota(cs, `${inc.nome} su ${bers.nome}: ${s} contro ${d}, resiste.`, { ...ev, colpo: false });
      break;
    }
    case 'cura': {
      const prima = att.pf;
      att.pf = Math.min(att.pfMax, att.pf + s);
      annota(cs, `${inc.nome}: recuperi ${att.pf - prima} PF.`, { ...base, tipo: 'cura', contro: att.id, cura: att.pf - prima });
      break;
    }
    case 'fuga': {
      if (!bers) return;
      const td = tiroDifesa(bers, inc.difesa!, rng);
      const d = td.successi;
      const ev = { ...base, tipo: 'magia' as const, contro: bers.id, difesa: td.facce };
      if (s - d >= (inc.margineFuga ?? 2)) { bers.fuggito = true; annota(cs, `${inc.nome}: ${bers.nome} si calma e se ne va.`, { ...ev, colpo: true, fuga: true }); }
      else annota(cs, `${inc.nome} su ${bers.nome}: ${s} contro ${d}, non basta.`, { ...ev, colpo: false });
      break;
    }
    default:
      annota(cs, `${inc.nome} non ha effetto in combattimento.`, { tipo: 'info', chi: att.id });
  }
}

function usaReperto(att: Combattente, rid: string, bersaglio: Combattente | undefined, cs: StatoCombattimento, rng: Rng): void {
  const r = (cs.reperti ?? []).find((x) => x.id === rid);
  if (!r || r.cariche <= 0) { annota(cs, 'Il reperto non ha cariche.', { tipo: 'info', chi: att.id }); return; }
  const t = tira(pool(att.tecnologia ?? 0, modifica(att, 'tecnologia')), rng);
  const s = t.successi;
  const base = { tipo: 'reperto' as const, chi: att.id, nome: r.nome, tiro: t.facce };
  if (s === 0) {
    cs.costi[`guasto.${r.id}`] = 1;
    cs.reperti = (cs.reperti ?? []).filter((x) => x.id !== r.id);
    annota(cs, `${r.nome}: nessun successo. Il reperto emette un sibilo e si spegne (guasto).`, { ...base, tipo: 'dissonanza' });
    return;
  }
  r.cariche--;
  cs.costi[`cariche.${r.id}`] = (cs.costi[`cariche.${r.id}`] ?? 0) - 1;
  if (r.tipo === 'attacco') {
    const b = bersaglio && inPiedi(bersaglio) ? bersaglio : cs.combattenti.find((x) => x.lato === 'nemico' && inPiedi(x));
    if (!b) return;
    const td = tira(pool(b.difesa, modifica(b, 'difesa')), rng);
    const d = td.successi;
    const ev = { ...base, contro: b.id, difesa: td.facce };
    if (s > d) {
      const rid = Math.max(0, b.riduzione + modifica(b, 'riduzione') - r.ignora);
      infliggi(cs, b, Math.max(1, s - d + r.danno - rid), `${r.nome} su ${b.nome}: ${s} contro ${d}`, ev);
    } else annota(cs, `${r.nome} su ${b.nome}: ${s} contro ${d}, mancato.`, { ...ev, colpo: false });
  } else if (r.tipo === 'difesa' && r.modifica) {
    aggiungiEffetto(att, r.modifica, r.id, true);
    annota(cs, `${r.nome}: ${descriviModifica(r.modifica)}.`, { ...base, tipo: 'effetto', contro: att.id, colpo: true });
  } else if (r.tipo === 'cura') {
    const prima = att.pf;
    att.pf = Math.min(att.pfMax, att.pf + r.cura);
    annota(cs, `${r.nome}: recuperi ${att.pf - prima} PF.`, { ...base, tipo: 'cura', contro: att.id, cura: att.pf - prima });
  }
}

function usaConsumabile(cs: StatoCombattimento, pg: Combattente, k: string): void {
  const disponibili = (cs.consumabili[k] ?? 0) - (cs.usati[k] ?? 0);
  const totUsati = Object.values(cs.usati).reduce((a, b) => a + b, 0);
  const eff = CONSUMABILI[k];
  if (!eff || disponibili <= 0 || totUsati >= MAX_CONSUMABILI_IN_COMBATTIMENTO) { annota(cs, 'Non hai niente da usare e perdi il momento.', { tipo: 'info', chi: pg.id }); return; }
  cs.usati[k] = (cs.usati[k] ?? 0) + 1;
  if (eff.pf) { const prima = pg.pf; pg.pf = Math.min(pg.pfMax, pg.pf + eff.pf); annota(cs, `Usi ${k}: recuperi ${pg.pf - prima} PF.`, { tipo: 'cura', chi: pg.id, contro: pg.id, cura: pg.pf - prima }); }
  if (eff.energia) { pg.energia += eff.energia; annota(cs, `Usi ${k}: recuperi ${eff.energia} Energia.`, { tipo: 'cura', chi: pg.id, contro: pg.id }); }
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
      annota(cs, att.lato === 'pg' ? 'Non riesci a muoverti e perdi il turno.' : `${att.nome} non riesce a muoversi.`, { tipo: 'fermo', chi: att.id });
      scalaEffetti(att);
      continue;
    }
    if (att.lato === 'pg') {
      const scelto = 'bersaglio' in azione && azione.bersaglio ? cs.combattenti.find((x) => x.id === azione.bersaglio && inPiedi(x)) : undefined;
      const b = scelto ?? cs.combattenti.find((x) => x.lato === 'nemico' && inPiedi(x));
      if (azione.tipo === 'cura') usaConsumabile(cs, pg, azione.consumabile);
      else if (azione.tipo === 'incantesimo') {
        const inc = cs.incantesimi.find((i) => i.id === azione.incantesimo);
        if (inc) lancia(att, inc, b, cs, rng);
        else annota(cs, 'Quell\'incantesimo non è nel tuo repertorio.');
      } else if (azione.tipo === 'reperto') {
        usaReperto(att, azione.reperto, b, cs, rng);
      } else if (b) {
        if (azione.tipo === 'attacco') {
          if (att.ricaricando) { att.ricaricando = false; annota(cs, 'Ricarichi l\'arma.', { tipo: 'fermo', chi: att.id }); }
          else { attacca(cs, att, b, rng); if (att.ricarica) att.ricaricando = true; }
        } else intimidisci(cs, att, b, rng);
      }
    } else {
      attacca(cs, att, pg, rng);
    }
    scalaEffetti(att);
    if (controllaFine(cs)) break;
  }
  // fine round: veleni (gli effetti scalano alla fine del turno di chi li porta)
  for (const x of cs.combattenti) {
    if (!inPiedi(x) || cs.finito) continue;
    for (const v of x.veleni ?? []) {
      infliggi(cs, x, v.valore, `Il veleno lavora su ${x.lato === 'pg' ? 'di te' : x.nome}`, { tipo: 'veleno' });
      v.round--;
    }
    x.veleni = (x.veleni ?? []).filter((v) => v.round > 0);
    if (controllaFine(cs)) break;
  }
  cs.round++;
  if (!cs.finito && cs.round > ROUND_MAX) { cs.finito = true; cs.vinto = false; annota(cs, 'Lo scontro si trascina fino allo sfinimento.'); }
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
