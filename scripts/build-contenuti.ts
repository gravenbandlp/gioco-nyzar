// Legge tutti i file YAML in contenuti/, li valida (schema + controlli incrociati)
// e scrive src/generato/contenuti.json. Se qualcosa non torna, il build si ferma
// con un elenco di errori leggibili: meglio qui che a metà partita.
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { Contenuti, COSTI_PROPRIETA, DIFETTI, type TContenuti } from '../src/motore/contenuto';
import { ATTRIBUTI, TUTTE_LE_ABILITA } from '../src/motore/regole';
import { parseRequisito } from '../src/motore/personaggio';

const RADICE = new URL('..', import.meta.url).pathname;
const CARTELLA = join(RADICE, 'contenuti');
const USCITA = join(RADICE, 'src', 'generato', 'contenuti.json');

const CHIAVI = ['aree', 'storylet', 'quality', 'nemici', 'scontri', 'armi', 'armature', 'negozi', 'origini', 'frammenti', 'incantesimi', 'scudi', 'oggetti'] as const;

function fileYaml(dir: string): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((f) => {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) return fileYaml(p);
      return /\.ya?ml$/.test(f) ? [p] : [];
    });
}

export function caricaContenuti(opzioni: { tavole?: boolean } = {}): { contenuti: TContenuti; errori: string[]; avvisi: string[] } {
  const grezzo: Record<string, unknown[]> = Object.fromEntries(CHIAVI.map((k) => [k, []]));
  const errori: string[] = [];
  const avvisi: string[] = [];

  for (const file of fileYaml(CARTELLA)) {
    const nome = relative(RADICE, file);
    let doc: unknown;
    try {
      doc = parse(readFileSync(file, 'utf8'));
    } catch (e) {
      errori.push(`${nome}: YAML non valido — ${(e as Error).message}`);
      continue;
    }
    if (doc == null) continue;
    if (typeof doc !== 'object' || Array.isArray(doc)) {
      errori.push(`${nome}: la radice deve essere una mappa (aree:, storylet:, …)`);
      continue;
    }
    for (const [k, v] of Object.entries(doc as Record<string, unknown>)) {
      if (!(CHIAVI as readonly string[]).includes(k)) { errori.push(`${nome}: sezione sconosciuta "${k}"`); continue; }
      if (!Array.isArray(v)) { errori.push(`${nome}: "${k}" deve essere una lista`); continue; }
      grezzo[k]!.push(...v);
    }
  }

  const esito = Contenuti.safeParse(grezzo);
  if (!esito.success) {
    for (const i of esito.error.issues) {
      const [sezione, indice] = i.path;
      const voce = (grezzo[sezione as string]?.[indice as number] as { id?: string } | undefined)?.id;
      errori.push(`${i.path.join('.')}${voce ? ` (${voce})` : ''}: ${i.message}`);
    }
    return { contenuti: grezzo as unknown as TContenuti, errori, avvisi };
  }
  const c = esito.data;
  // Ogni incantesimo è anche una quality (incantesimo.<id>) usabile in requisiti ed effetti.
  for (const i of c.incantesimi) {
    c.quality.push({ id: `incantesimo.${i.id}`, nome: i.nome, categoria: 'incantesimo', descrizione: i.descrizione, immagine: i.immagine });
  }
  completaOggetti(c);
  errori.push(...controlliIncrociati(c, avvisi));
  if (opzioni.tavole !== false) errori.push(...controllaTavole(c));
  return { contenuti: c, errori, avvisi };
}

/**
 * Ogni arma, armatura e scudo di base è anche un oggetto comune con lo stesso id.
 * Ogni oggetto è una quality (oggetto.<id>); i reperti hanno cariche, guasto e decifrato.
 */
export function completaOggetti(c: TContenuti): void {
  const esiste = new Set(c.oggetti.map((o) => o.id));
  const vuoto = { affilata: 0, penetrante: 0, riserva: 0, rapida: 0, robusta: 0, assetata: false, schermata: false, lucida: false,
    ultimoRespiro: false, secondaScelta: false, ostinata: false, silenziosa: false, caricatore: false, talento: {}, chiave: [] };
  const aggiungi = (id: string, nome: string, slot: 'arma' | 'armatura' | 'scudo', dadi: number, prezzo?: number, immagine?: string) => {
    if (esiste.has(id)) return;
    c.oggetti.push({ id, nome, slot, base: id, grado: 0, dadi, proprieta: { ...vuoto }, difetti: [], prezzo, immagine });
  };
  for (const a of c.armi) aggiungi(a.id, a.nome, 'arma', a.qualita, a.prezzo, a.immagine);
  for (const a of c.armature) aggiungi(a.id, a.nome, 'armatura', a.qualita, a.prezzo, a.immagine);
  for (const a of c.scudi) aggiungi(a.id, a.nome, 'scudo', a.dadi, a.prezzo, a.immagine);
  for (const o of c.oggetti) {
    c.quality.push({ id: `oggetto.${o.id}`, nome: o.nome, categoria: 'equipaggiamento', descrizione: o.descrizione, immagine: o.immagine });
    if (o.reperto) {
      c.quality.push({ id: `cariche.${o.id}`, nome: `Cariche: ${o.nome}`, categoria: 'stato', nascosta: true });
      c.quality.push({ id: `guasto.${o.id}`, nome: `${o.nome} guasto`, categoria: 'stato', nascosta: true });
      c.quality.push({ id: `decifrato.${o.id}`, nome: `${o.nome} decifrato`, categoria: 'stato', nascosta: true });
    }
  }
}

export function controlliIncrociati(c: TContenuti, avvisi: string[]): string[] {
  const errori: string[] = [];
  const ids = (xs: { id: string }[]) => new Set(xs.map((x) => x.id));
  const aree = ids(c.aree), storylet = ids(c.storylet), quality = ids(c.quality);
  const nemici = ids(c.nemici), scontri = ids(c.scontri), armi = ids(c.armi), armature = ids(c.armature), negozi = ids(c.negozi);

  // id duplicati
  for (const k of CHIAVI) {
    const visti = new Set<string>();
    for (const x of c[k] as { id: string }[]) {
      if (visti.has(x.id)) errori.push(`${k}: id duplicato "${x.id}"`);
      visti.add(x.id);
    }
  }

  const chiaviOggetti = c.oggetti.flatMap((o) => o.proprieta.chiave.map((k) => `chiave.${k}`));
  const tratti = [...Object.keys(COSTI_PROPRIETA), ...DIFETTI].map((k) => `indossa.${k}`);
  const leggibili = new Set<string>([...ATTRIBUTI, ...TUTTE_LE_ABILITA, 'candele', ...quality, ...chiaviOggetti, ...tratti]);
  const requisiti = (dove: string, reqs: string[] | undefined) => {
    for (const r of reqs ?? []) {
      try {
        const { chiave } = parseRequisito(r);
        if (!leggibili.has(chiave)) errori.push(`${dove}: requisito su chiave sconosciuta "${chiave}"`);
      } catch (e) {
        errori.push(`${dove}: ${(e as Error).message}`);
      }
    }
  };
  const effetti = (dove: string, eff: Record<string, number> | undefined) => {
    for (const k of Object.keys(eff ?? {})) {
      if (!quality.has(k)) errori.push(`${dove}: effetto su quality sconosciuta "${k}"`);
      else if (Math.abs((eff![k]! * 2) % 1) > 1e-9) errori.push(`${dove}: "${k}" deve variare a mezzi punti`);
    }
  };
  const esito = (dove: string, e?: { effetti?: Record<string, number>; vai?: string; segue?: string }) => {
    if (!e) return;
    effetti(dove, e.effetti);
    if (e.vai && !aree.has(e.vai)) errori.push(`${dove}: "vai" verso area sconosciuta "${e.vai}"`);
    if (e.segue && !storylet.has(e.segue)) errori.push(`${dove}: "segue" verso storylet sconosciuto "${e.segue}"`);
  };

  for (const a of c.aree) {
    requisiti(`area ${a.id}`, a.accesso);
    for (const n of a.negozi) if (!negozi.has(n)) errori.push(`area ${a.id}: negozio sconosciuto "${n}"`);
  }

  for (const st of c.storylet) {
    const dove = `storylet ${st.id}`;
    if (!aree.has(st.area)) errori.push(`${dove}: area sconosciuta "${st.area}"`);
    requisiti(dove, st.requisiti);
    if (st.tipo === 'fisso' && !st.ripetibile && !st.requisiti.some((r) => r.startsWith('pista.') || /==\s*0\s*$/.test(r))) {
      avvisi.push(`${dove}: non è ripetibile ma nessun requisito lo chiude dopo la prima volta (serve una pista o un "== 0")`);
    }
    st.opzioni.forEach((o, i) => {
      const d = `${dove}, opzione ${i + 1}`;
      requisiti(d, o.requisiti);
      if (o.prova) {
        const lista = Array.isArray(o.prova.abilita) ? o.prova.abilita : [o.prova.abilita];
        for (const a of lista) if (!TUTTE_LE_ABILITA.includes(a)) errori.push(`${d}: abilità sconosciuta "${a}"`);
      }
      if (o.combattimento && !scontri.has(o.combattimento)) errori.push(`${d}: scontro sconosciuto "${o.combattimento}"`);
      if (o.incantesimo && !c.incantesimi.some((i) => i.id === o.incantesimo)) errori.push(`${d}: incantesimo sconosciuto "${o.incantesimo}"`);
      esito(`${d} (successo)`, o.successo);
      esito(`${d} (fallimento)`, o.fallimento);
      esito(`${d} (vittoria)`, o.vittoria);
      esito(`${d} (sconfitta)`, o.sconfitta);
      esito(`${d} (esito)`, o.esito);
    });
  }

  for (const i of c.incantesimi) {
    for (const k of Object.keys(i.prezzo ?? {})) if (!quality.has(k)) errori.push(`incantesimo ${i.id}: prezzo su quality sconosciuta "${k}"`);
    if (i.tradizione === 'precuriane' && !i.prezzo) errori.push(`incantesimo ${i.id}: le formule precuriane hanno sempre un prezzo`);
  }
  // Origini: gli incantesimi di partenza devono rispettare il livello di Magia.
  for (const o of c.origini) {
    for (const k of Object.keys(o.quality).filter((q) => q.startsWith('incantesimo.'))) {
      const inc = c.incantesimi.find((i) => `incantesimo.${i.id}` === k);
      if (inc && inc.livello > (o.abilita['magia'] ?? 0)) errori.push(`origine ${o.id}: ${inc.nome} richiede Magia ${inc.livello}`);
    }
  }

  // Oggetti
  const scudiIds = new Set(c.scudi.map((x) => x.id));
  for (const o of c.oggetti) {
    const d = `oggetto ${o.id}`;
    if (o.base) {
      const ok = o.slot === 'arma' ? armi.has(o.base) : o.slot === 'armatura' ? armature.has(o.base) : o.slot === 'scudo' ? scudiIds.has(o.base) : false;
      if (!ok) errori.push(`${d}: base "${o.base}" non valida per lo slot ${o.slot}`);
    }
    if (o.usa) {
      const st = c.storylet.find((x) => x.id === o.usa);
      if (!st) errori.push(`${d}: storylet "usa" sconosciuto "${o.usa}"`);
      else if (st.tipo !== 'oggetto') errori.push(`${d}: lo storylet "${o.usa}" deve avere tipo: oggetto`);
    }
    if (o.reperto && !c.storylet.some((x) => x.id === o.reperto!.decifra && x.tipo === 'oggetto')) errori.push(`${d}: storylet di decifrazione "${o.reperto.decifra}" mancante o non di tipo oggetto`);
    for (const k of Object.keys(o.proprieta.talento)) if (!TUTTE_LE_ABILITA.includes(k)) errori.push(`${d}: talento su abilità sconosciuta "${k}"`);
  }
  for (const st of c.storylet) st.opzioni.forEach((op, i) => {
    if (op.reperto && !c.oggetti.some((o) => o.id === op.reperto && o.reperto)) errori.push(`storylet ${st.id}, opzione ${i + 1}: reperto sconosciuto "${op.reperto}"`);
  });

  for (const f of c.frammenti) if (f.area && !aree.has(f.area)) errori.push(`frammento ${f.id}: area sconosciuta "${f.area}"`);

  for (const sc of c.scontri) for (const n of sc.nemici) if (!nemici.has(n)) errori.push(`scontro ${sc.id}: nemico sconosciuto "${n}"`);

  for (const a of c.armi) if (!TUTTE_LE_ABILITA.includes(a.abilita)) errori.push(`arma ${a.id}: abilità sconosciuta "${a.abilita}"`);
  for (const a of c.armature) {
    for (const k of Object.keys(a.penalita)) if (!TUTTE_LE_ABILITA.includes(k)) errori.push(`armatura ${a.id}: penalità su abilità sconosciuta "${k}"`);
  }

  for (const n of c.negozi) {
    for (const v of n.compra) if (!quality.has(v.quality)) errori.push(`negozio ${n.id}: compra quality sconosciuta "${v.quality}"`);
    for (const v of n.vende) {
      if (!quality.has(v.quality)) errori.push(`negozio ${n.id}: vende quality sconosciuta "${v.quality}"`);
    }
  }

  // Origini: regola di creazione (3.3) — attributi 1 + 2 punti (max 3), abilità 10 punti (max 3, al più due a 3).
  for (const o of c.origini) {
    const d = `origine ${o.id}`;
    const attr = ATTRIBUTI.map((a) => o.attributi[a] ?? 1);
    if (attr.reduce((a, b) => a + b, 0) !== 5) errori.push(`${d}: gli attributi devono sommare 5 (ora ${attr.join('+')})`);
    const ab = Object.entries(o.abilita);
    for (const [k] of ab) if (!TUTTE_LE_ABILITA.includes(k)) errori.push(`${d}: abilità sconosciuta "${k}"`);
    const somma = ab.reduce((a, [, v]) => a + v, 0);
    if (somma !== 10) errori.push(`${d}: le abilità devono sommare 10 (ora ${somma})`);
    if (ab.filter(([, v]) => v === 3).length > 2) errori.push(`${d}: al massimo due abilità a 3`);
    effetti(d, o.quality);
    const og = (id: string) => c.oggetti.find((x) => x.id === id);
    if (og(o.arma)?.slot !== 'arma') errori.push(`${d}: arma sconosciuta "${o.arma}"`);
    if (og(o.armatura)?.slot !== 'armatura') errori.push(`${d}: armatura sconosciuta "${o.armatura}"`);
  }

  return errori;
}

/** Ogni tavola citata deve essere già stata importata (npm run tavole). */
export function controllaTavole(c: TContenuti): string[] {
  const errori: string[] = [];
  for (const t of tavoleCitate(c)) {
    for (const taglio of ['s', 'l']) {
      if (!existsSync(join(RADICE, 'public', 'tavole', `${t}-${taglio}.webp`))) {
        errori.push(`tavola "${t}" non importata: esegui npm run tavole`);
        break;
      }
    }
  }
  return errori;
}

/** Tutte le tavole citate nei contenuti (campo `immagine` a qualsiasi profondità). */
export function tavoleCitate(dati: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(dati)) dati.forEach((x) => tavoleCitate(x, out));
  else if (dati && typeof dati === 'object') {
    for (const [k, v] of Object.entries(dati)) {
      if (k === 'immagine' && typeof v === 'string') out.add(v);
      else tavoleCitate(v, out);
    }
  }
  return out;
}

// ---------------------------------------------------------------- esecuzione diretta
if (import.meta.url === `file://${process.argv[1]}`) {
  const { contenuti, errori, avvisi } = caricaContenuti();
  for (const a of avvisi) console.warn(`avviso: ${a}`);
  if (errori.length) {
    console.error(`\n${errori.length} errori nei contenuti:\n`);
    for (const e of errori) console.error(`  • ${e}`);
    process.exit(1);
  }
  mkdirSync(join(RADICE, 'src', 'generato'), { recursive: true });
  writeFileSync(USCITA, JSON.stringify(contenuti, null, 1));
  console.log(
    `Contenuti validi: ${contenuti.storylet.length} storylet, ${contenuti.aree.length} aree, ` +
      `${contenuti.quality.length} quality, ${contenuti.scontri.length} scontri, ${contenuti.origini.length} origini.`,
  );
}
