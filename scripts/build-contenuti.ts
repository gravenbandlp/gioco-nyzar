// Legge tutti i file YAML in contenuti/, li valida (schema + controlli incrociati)
// e scrive src/generato/contenuti.json. Se qualcosa non torna, il build si ferma
// con un elenco di errori leggibili: meglio qui che a metà partita.
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { parse } from 'yaml';
import { Contenuti, COSTI_PROPRIETA, DIFETTI, OVUNQUE, type TContenuti } from '../src/motore/contenuto';
import { ATTRIBUTI, TUTTE_LE_ABILITA } from '../src/motore/regole';
import { parseRequisito } from '../src/motore/personaggio';

const RADICE = new URL('..', import.meta.url).pathname;
const CARTELLA = join(RADICE, 'contenuti');
const USCITA = join(RADICE, 'src', 'generato', 'contenuti.json');
const USCITA_ICONE = join(RADICE, 'src', 'generato', 'icone.json');

/** Prefisso delle icone di game-icons.net (CC BY 3.0): "icone/<nome>", disegnate in SVG e colorate dal CSS. */
export const ICONE = 'icone/';
let catalogoIcone: Record<string, { body: string }> | null = null;
function catalogo(): Record<string, { body: string }> {
  catalogoIcone ??= (createRequire(import.meta.url)('@iconify-json/game-icons/icons.json') as { icons: Record<string, { body: string }> }).icons;
  return catalogoIcone;
}
/** Le icone citate nei contenuti, con il loro disegno. */
/** Icone usate direttamente dall'interfaccia (ripieghi per le quality senza immagine). */
export const ICONE_INTERFACCIA = ['icone/scroll-quill', 'icone/stairs'];
export function iconeCitate(c: TContenuti): { icone: Record<string, string>; errori: string[] } {
  const icone: Record<string, string> = {}; const errori: string[] = [];
  for (const t of [...tavoleCitate(c), ...ICONE_INTERFACCIA]) {
    if (!t.startsWith(ICONE)) continue;
    const nome = t.slice(ICONE.length);
    const ic = catalogo()[nome];
    if (ic) icone[nome] = ic.body; else errori.push(`icona "${nome}" non trovata in game-icons.net`);
  }
  return { icone, errori };
}

const CHIAVI = ['aree', 'storylet', 'quality', 'nemici', 'scontri', 'armi', 'armature', 'negozi', 'origini', 'frammenti', 'incantesimi', 'scudi', 'oggetti', 'mutazioni', 'glossario', 'luoghi', 'tracce', 'colonna'] as const;

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
  for (const a of c.aree) if (a.spedizione) c.quality.push({ id: `profondita.${a.id}`, nome: `Profondità: ${a.nome}`, categoria: 'stato' });
  for (const m of c.mutazioni) c.quality.push({ id: `mutazione.${m.id}`, nome: m.nome, categoria: 'mutazione', descrizione: m.descrizione, immagine: m.immagine });
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
    if (k === 'colonna') continue; // le voci della colonna sonora si riconoscono da contesto e id
    const visti = new Set<string>();
    for (const x of c[k] as { id: string }[]) {
      if (visti.has(x.id)) errori.push(`${k}: id duplicato "${x.id}"`);
      visti.add(x.id);
    }
  }

  const chiaviOggetti = c.oggetti.flatMap((o) => o.proprieta.chiave.map((k) => `chiave.${k}`));
  const tratti = [...Object.keys(COSTI_PROPRIETA), ...DIFETTI].map((k) => `indossa.${k}`);
  const pe = TUTTE_LE_ABILITA.map((a) => `pe.${a}`);
  const origini = c.origini.map((o) => `origine.${o.id}`);
  const leggibili = new Set<string>([...ATTRIBUTI, ...TUTTE_LE_ABILITA, 'candele', ...quality, ...chiaviOggetti, ...tratti, ...pe, ...origini]);
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
  const esito = (dove: string, e?: { effetti?: Record<string, number>; vai?: string; segue?: string; imposta?: Record<string, number>; pe?: Record<string, number> }) => {
    if (!e) return;
    effetti(dove, e.effetti);
    if (e.vai && !aree.has(e.vai)) errori.push(`${dove}: "vai" verso area sconosciuta "${e.vai}"`);
    if (e.segue && !storylet.has(e.segue)) errori.push(`${dove}: "segue" verso storylet sconosciuto "${e.segue}"`);
    for (const k of Object.keys(e.imposta ?? {})) if (!quality.has(k) && !pe.includes(k)) errori.push(`${dove}: "imposta" su chiave sconosciuta "${k}"`);
    for (const k of Object.keys(e.pe ?? {})) if (!TUTTE_LE_ABILITA.includes(k)) errori.push(`${dove}: PE a un'abilità sconosciuta "${k}"`);
  };

  for (const a of c.aree) {
    requisiti(`area ${a.id}`, a.accesso);
    if (a.spedizione) {
      const r = c.aree.find((x) => x.id === a.spedizione!.ritorno);
      if (!r) errori.push(`area ${a.id}: ritorno verso area sconosciuta "${a.spedizione.ritorno}"`);
      else if (r.penalita || r.spedizione) errori.push(`area ${a.id}: il ritorno deve essere un'area della città`);
      if (a.penalita) errori.push(`area ${a.id}: un'area non può essere insieme di penalità e spedizione`);
    }
    for (const n of a.negozi) if (!negozi.has(n)) errori.push(`area ${a.id}: negozio sconosciuto "${n}"`);
  }

  for (const st of c.storylet) {
    const dove = `storylet ${st.id}`;
    if (!aree.has(st.area) && !(st.area === OVUNQUE && st.tipo === 'carta')) errori.push(`${dove}: area sconosciuta "${st.area}"`);
    if ((st.tipo === 'crisi' || st.tipo === 'prologo') && st.opzioni.some((o) => (o.costo ?? 1) !== 0)) errori.push(`${dove}: le opzioni di ${st.tipo === 'crisi' ? 'una crisi' : 'un prologo'} costano 0 candele`);
    requisiti(dove, st.requisiti);
    const areaSt = c.aree.find((a) => a.id === st.area);
    const inAreaPenalita = !!areaSt?.penalita || !!areaSt?.spedizione;
    if (st.tipo === 'fisso' && !st.ripetibile && !inAreaPenalita && !st.requisiti.some((r) => r.startsWith('pista.') || /==\s*\d+(\.\d+)?\s*$/.test(r))) {
      avvisi.push(`${dove}: non è ripetibile ma nessun requisito lo chiude dopo la prima volta (serve una pista o un "== n")`);
    }
    st.opzioni.forEach((o, i) => {
      const d = `${dove}, opzione ${i + 1}`;
      requisiti(d, o.requisiti);
      requisiti(d, o.quando);
      if (o.prova) {
        const lista = Array.isArray(o.prova.abilita) ? o.prova.abilita : [o.prova.abilita];
        for (const a of lista) if (!TUTTE_LE_ABILITA.includes(a)) errori.push(`${d}: abilità sconosciuta "${a}"`);
      }
      if (o.combattimento && !scontri.has(o.combattimento)) errori.push(`${d}: scontro sconosciuto "${o.combattimento}"`);
      if (o.incantesimo) {
        const inc = c.incantesimi.find((i) => i.id === o.incantesimo);
        if (!inc) errori.push(`${d}: incantesimo sconosciuto "${o.incantesimo}"`);
        else if (!inc.uso.includes('storie')) errori.push(`${d}: ${inc.nome} si usa solo in combattimento`);
      }
      esito(`${d} (successo)`, o.successo);
      esito(`${d} (fallimento)`, o.fallimento);
      esito(`${d} (vittoria)`, o.vittoria);
      esito(`${d} (sconfitta)`, o.sconfitta);
      esito(`${d} (esito)`, o.esito);
    });
  }

  // Luoghi (mini-hub): stanno in un'area della città, aprono botteghe di quell'area, raccolgono storylet della stessa area.
  for (const l of c.luoghi) {
    const dove = `luogo ${l.id}`;
    const a = c.aree.find((x) => x.id === l.area);
    if (!a) { errori.push(`${dove}: area sconosciuta "${l.area}"`); continue; }
    if (a.penalita || a.spedizione) errori.push(`${dove}: i luoghi stanno nelle aree della città, non in ${a.id}`);
    requisiti(dove, l.requisiti);
    for (const n of l.negozi) {
      if (!negozi.has(n)) errori.push(`${dove}: negozio sconosciuto "${n}"`);
      else if (!a.negozi.includes(n)) errori.push(`${dove}: il negozio "${n}" non è fra quelli di ${a.id}`);
    }
    const dentro = c.storylet.filter((st) => st.presso === l.id && st.tipo !== 'seguito').length + l.negozi.length;
    if (dentro < 2) avvisi.push(`${dove}: contiene solo ${dentro} ${dentro === 1 ? 'cosa' : 'cose'}, forse non serve un luogo a parte`);
  }
  for (const st of c.storylet) {
    if (!st.presso) continue;
    const l = c.luoghi.find((x) => x.id === st.presso);
    if (!l) errori.push(`storylet ${st.id}: luogo sconosciuto "${st.presso}"`);
    else if (l.area !== st.area) errori.push(`storylet ${st.id}: il luogo ${l.id} sta in ${l.area}, lo storylet in ${st.area}`);
    if (st.tipo === 'carta' || st.tipo === 'crisi' || st.tipo === 'prologo') errori.push(`storylet ${st.id}: ${st.tipo === 'carta' ? 'le occasioni' : st.tipo === 'crisi' ? 'le crisi' : 'i prologhi'} non stanno in un luogo`);
  }

  // Colonna sonora: tracce del tipo giusto, aree e luoghi esistenti, una voce per contesto.
  const voci = new Set<string>();
  for (const v of c.colonna) {
    const chiave = `${v.contesto}${v.id ? `:${v.id}` : ''}`;
    if (voci.has(chiave)) errori.push(`colonna: "${chiave}" compare due volte`);
    voci.add(chiave);
    if (v.contesto === 'area' && !aree.has(v.id!)) errori.push(`colonna ${chiave}: area sconosciuta`);
    if (v.contesto === 'luogo' && !c.luoghi.some((l) => l.id === v.id)) errori.push(`colonna ${chiave}: luogo sconosciuto`);
    for (const tipo of ['musica', 'ambiente'] as const) {
      const t = v[tipo];
      if (!t || (tipo === 'ambiente' && t === 'nessuno')) continue;
      const tr = c.tracce.find((x) => x.id === t);
      if (!tr) errori.push(`colonna ${chiave}: traccia sconosciuta "${t}"`);
      else if (tr.tipo !== tipo) errori.push(`colonna ${chiave}: "${t}" non è ${tipo === 'musica' ? 'una musica' : 'un ambiente'}`);
    }
  }

  // Glossario: ogni forma (nome o alias) appartiene a una sola voce; le voci mai citate sono sospette.
  const forme = new Map<string, string>();
  for (const v of c.glossario) {
    requisiti(`glossario ${v.id}`, v.requisiti);
    for (const f of [v.nome, ...v.alias]) {
      if (forme.has(f) && forme.get(f) !== v.id) errori.push(`glossario ${v.id}: "${f}" è già una forma di ${forme.get(f)}`);
      forme.set(f, v.id);
    }
  }
  if (c.glossario.length) {
    const tutto = testiNarrativi(c);
    for (const v of c.glossario) {
      if (![v.nome, ...v.alias].some((f) => new RegExp(`(?<![\\p{L}\\p{N}])${escapa(f)}(?![\\p{L}\\p{N}])`, 'u').test(tutto))) {
        avvisi.push(`glossario ${v.id}: "${v.nome}" non compare in nessun testo`);
      }
    }
  }

  for (const m of c.mutazioni) for (const k of Object.keys(m.abilita)) if (!TUTTE_LE_ABILITA.includes(k)) errori.push(`mutazione ${m.id}: abilità sconosciuta "${k}"`);

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
    for (const v of n.compra) {
      if (!quality.has(v.quality)) errori.push(`negozio ${n.id}: compra quality sconosciuta "${v.quality}"`);
      requisiti(`negozio ${n.id}, compra ${v.quality}`, v.requisiti);
    }
    for (const v of n.vende) {
      if (!quality.has(v.quality)) errori.push(`negozio ${n.id}: vende quality sconosciuta "${v.quality}"`);
      requisiti(`negozio ${n.id}, vende ${v.quality}`, v.requisiti);
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
  errori.push(...iconeCitate(c).errori);
  // l'audio è facoltativo: senza file la traccia resta muta, quindi è solo un avviso
  for (const t of c.tracce) {
    if (!existsSync(join(RADICE, 'public', 'audio', t.tipo, `${t.id}.mp3`))) console.warn(`avviso: traccia "${t.id}" non importata (npm run audio)`);
  }
  for (const t of tavoleCitate(c)) {
    if (t.startsWith(ICONE)) continue;
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
  writeFileSync(USCITA_ICONE, JSON.stringify(iconeCitate(contenuti).icone));
  console.log(
    `Contenuti validi: ${contenuti.storylet.length} storylet, ${contenuti.aree.length} aree, ` +
      `${contenuti.quality.length} quality, ${contenuti.scontri.length} scontri, ${contenuti.origini.length} origini.`,
  );
}

function escapa(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** Tutti i testi che il giocatore legge come prosa (dove compaiono i tooltip). */
export function testiNarrativi(c: TContenuti): string {
  const parti: string[] = [];
  for (const a of c.aree) parti.push(a.testo);
  for (const f of c.frammenti) parti.push(f.testo);
  for (const st of c.storylet) {
    parti.push(st.testo);
    for (const o of st.opzioni) for (const e of [o.successo, o.fallimento, o.vittoria, o.sconfitta, o.esito]) if (e) parti.push(e.testo);
  }
  return parti.join('\n').replace(/[ \t]*\n[ \t]*(?!\n)/g, ' '); // gli a capo dentro un paragrafo contano come spazi
}

