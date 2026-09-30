// Schema dei contenuti (Regolamento v0.4, 9.8). Usato dal validatore in fase di build
// e come fonte dei tipi per motore e interfaccia.
import { z } from 'zod';
import { ATTRIBUTI, ETICHETTE_DIFFICOLTA } from './regole';

const Id = z.string().regex(/^[a-z0-9][a-z0-9.-]*$/, 'id in minuscolo, con trattini o punti');

/** Area speciale per le carte che valgono ovunque (tranne che nelle aree di penalità). */
export const OVUNQUE = 'ovunque';

/** Tavola del Codex: "collezione/slug", es. "ambientazione/pignatta-grassa". */
export const Immagine = z.string().regex(/^[a-z]+\/[a-z0-9-]+$/, 'immagine nel formato collezione/slug');

/** Effetti: chiave → variazione numerica ("+1", -2, 0.5). */
export const Effetti = z.record(z.string(), z.number());

export const Esito = z.object({
  immagine: Immagine.optional(),
  titolo: z.string().optional(), // intestazione dell'esito, alla Fallen London
  testo: z.string(),
  imposta: z.record(z.string(), z.number()).optional(), // fissa un valore (quality o pe.<abilità>), es. { ferite: 3 }
  pe: z.record(z.string(), z.number().min(0)).optional(), // PE regalati a un'abilità, es. { resistenza: 10 }
  effetti: Effetti.optional(),
  vai: Id.optional(), // cambia area
  segue: Id.optional(), // apre subito un altro storylet (concatenazione)
});

export const Prova = z.object({
  attributo: z.enum(ATTRIBUTI),
  abilita: z.union([z.string(), z.array(z.string()).min(1)]),
  difficolta: z.enum(ETICHETTE_DIFFICOLTA as [string, ...string[]]),
});

export const Opzione = z
  .object({
    immagine: Immagine.optional(),
    testo: z.string(),
    descrizione: z.string().optional(),
    incantesimo: Id.optional(), // l'opzione richiede questo incantesimo e ne applica Dissonanza e prezzo
    reperto: Id.optional(), // l'opzione usa questo reperto: con zero successi si guasta
    requisiti: z.array(z.string()).optional(),
    costo: z.number().int().min(0).max(3).optional(), // candele, default 1
    prova: Prova.optional(),
    successo: Esito.optional(),
    fallimento: Esito.optional(),
    combattimento: Id.optional(),
    vittoria: Esito.optional(),
    sconfitta: Esito.optional(),
    esito: Esito.optional(),
  })
  .superRefine((o, ctx) => {
    const tipi = [o.prova ? 1 : 0, o.combattimento ? 1 : 0].reduce((a, b) => a + b, 0);
    if (tipi > 1) ctx.addIssue({ code: 'custom', message: 'un\'opzione ha una prova oppure un combattimento, non entrambi' });
    if (o.prova && (!o.successo || !o.fallimento)) ctx.addIssue({ code: 'custom', message: 'la prova richiede successo e fallimento' });
    if (o.combattimento && (!o.vittoria || !o.sconfitta)) ctx.addIssue({ code: 'custom', message: 'il combattimento richiede vittoria e sconfitta' });
    if (!o.prova && !o.combattimento && !o.esito) ctx.addIssue({ code: 'custom', message: 'un\'opzione senza prova né combattimento richiede esito' });
    if (o.incantesimo) {
      const ab = o.prova ? (Array.isArray(o.prova.abilita) ? o.prova.abilita : [o.prova.abilita]) : [];
      if (!o.prova || o.prova.attributo !== 'mentale' || ab.join() !== 'magia') {
        ctx.addIssue({ code: 'custom', message: 'un\'opzione con incantesimo richiede una prova di Mentale + Magia' });
      }
    }
  });

export const Storylet = z.object({
  id: Id,
  immagine: Immagine.optional(),
  titolo: z.string(),
  sommario: z.string().optional(), // una riga, mostrata nell'elenco
  area: Id,
  // oggetto: si apre dagli Averi; seguito: si apre solo da un altro storylet (segue)
  // prologo: si apre da solo a inizio partita, come le crisi
  tipo: z.enum(['fisso', 'carta', 'crisi', 'penalita', 'oggetto', 'seguito', 'prologo']).default('fisso'),
  ripetibile: z.boolean().default(false),
  luogo: z.string().optional(), // sottotitolo: dove avviene
  requisiti: z.array(z.string()).default([]),
  testo: z.string(),
  opzioni: z.array(Opzione).min(1),
  mostra: z.number().int().min(1).optional(), // mostra solo N opzioni disponibili, scelte a caso
});

export const Area = z.object({
  id: Id,
  immagine: Immagine.optional(),
  nome: z.string(),
  testo: z.string(),
  accesso: z.array(z.string()).default([]),
  gabella: z.number().int().min(0).default(0),
  negozi: z.array(Id).default([]),
  penalita: z.boolean().default(false), // area di penalità: nascosta dalla mappa, si esce solo con le storie
  // spedizione: luogo fuori città o sotterraneo. Ci si entra da uno storylet, i ripetibili sono stanze
  // mostrate a caso, la profondità sale con le stanze superate e si azzera quando si esce.
  spedizione: z.object({
    ritorno: Id, // dove porta la ritirata
    soglia: z.number().int().min(1), // profondità a cui si apre il cuore della spedizione (per la barra)
    stanze: z.number().int().min(1).default(3), // quante stanze si vedono alla volta
  }).optional(),
});

export const Quality = z.object({
  id: Id,
  nome: z.string(),
  immagine: Immagine.optional(),
  categoria: z.enum(['moneta', 'bene', 'pista', 'negativa', 'reputazione', 'accesso', 'consumabile', 'equipaggiamento', 'stato', 'incantesimo', 'mutazione']),
  descrizione: z.string().optional(),
  valore: z.number().optional(), // valore in monete (beni)
  famiglia: z.string().optional(), // famiglia di beni: cristalli, informazioni, reliquie
  nascosta: z.boolean().optional(),
});

export const Nemico = z.object({
  id: Id,
  nome: z.string(),
  immagine: Immagine.optional(),
  descrizione: z.string().optional(),
  attacco: z.number().int().min(0),
  difesa: z.number().int().min(0),
  difesaMentale: z.number().int().min(0),
  pf: z.number().int().min(1),
  danno: z.number().int().min(0),
  riduzione: z.number().int().min(0).default(0),
  iniziativa: z.number().int().min(0),
  puoFuggire: z.boolean().default(false),
  tratti: z.array(z.string()).default([]), // es. animale, non-morto, eco
});

export const Scontro = z.object({
  id: Id,
  nome: z.string(),
  nemici: z.array(Id).min(1),
  feriteSconfitta: z.number().min(2).max(4).default(2),
});

export const Arma = z.object({
  id: Id,
  nome: z.string(),
  immagine: Immagine.optional(),
  abilita: z.string(), // armi-da-mischia, armi-da-distanza, rissa
  danno: z.number().int(),
  qualita: z.number().int().min(0).max(5).default(0),
  proprieta: z.array(z.string()).default([]),
  prezzo: z.number().int().min(0).optional(),
});

export const Armatura = z.object({
  id: Id,
  nome: z.string(),
  immagine: Immagine.optional(),
  riduzione: z.number().int().min(0),
  qualita: z.number().int().min(0).max(5).default(0),
  penalita: z.record(z.string(), z.number()).default({}),
  prezzo: z.number().int().min(0).optional(),
});

/** Modifica a tempo sui tiri di un combattente. `tutti` vale per ogni tiro; `salta` fa perdere il turno. */
export const Modifica = z.object({
  tipo: z.enum(['attacco', 'difesa', 'riduzione', 'tutti', 'salta']),
  valore: z.number().int(),
  round: z.number().int().min(1),
});

export const Scudo = z.object({
  id: Id,
  nome: z.string(),
  immagine: Immagine.optional(),
  dadi: z.number().int().min(1).max(3), // dadi in difesa
  penalita: z.record(z.string(), z.number()).default({}),
  prezzo: z.number().int().min(0).optional(),
});

// ---------------------------------------------------------------- oggetti (Regolamento 8.7–8.9)

export const DIFETTI = ['pesante', 'rumorosa', 'riconoscibile', 'inquieta', 'stancante', 'inceppamento', 'legata'] as const;
export const NOMI_DIFETTI: Record<(typeof DIFETTI)[number], string> = {
  pesante: 'Pesante', rumorosa: 'Rumorosa', riconoscibile: 'Riconoscibile', inquieta: 'Inquieta',
  stancante: 'Stancante', inceppamento: 'Inceppamento', legata: 'Legata',
};

/** Proprietà degli oggetti magici e il loro costo in punti di grado. */
export const COSTI_PROPRIETA = {
  affilata: 1, penetrante: 1, riserva: 1, rapida: 1, robusta: 2, assetata: 2, schermata: 2, lucida: 2,
  ultimoRespiro: 2, secondaScelta: 3, ostinata: 1, silenziosa: 1, caricatore: 1,
} as const;

export const Proprieta = z.object({
  affilata: z.number().int().min(0).default(0), // +N danno
  penetrante: z.number().int().min(0).default(0), // ignora N armatura
  riserva: z.number().int().min(0).default(0), // +2 Energia per punto
  rapida: z.number().int().min(0).default(0), // +N dadi iniziativa
  robusta: z.number().int().min(0).default(0), // +N riduzione (armature)
  assetata: z.boolean().default(false), // 1 PF ogni colpo a segno
  schermata: z.boolean().default(false), // Contaminazione dimezzata
  lucida: z.boolean().default(false), // Tormento dimezzato
  ultimoRespiro: z.boolean().default(false), // a 0 PF resti a 1, una volta per scontro
  secondaScelta: z.boolean().default(false), // ripeti una prova fallita per esito
  ostinata: z.boolean().default(false), // +2 danno sotto metà PF
  silenziosa: z.boolean().default(false), // niente penalità di Furtività
  caricatore: z.boolean().default(false), // ignora Ricarica
  talento: z.record(z.string(), z.number().int().min(1)).default({}), // +N dadi a un'abilità fuori dal combattimento
  chiave: z.array(z.string()).default([]), // apre opzioni negli storylet (chiave.<nome>)
});

export const Reperto = z.object({
  tipo: z.enum(['attacco', 'difesa', 'cura', 'passivo']),
  cariche: z.number().int().min(0), // cariche massime (0 per i passivi)
  danno: z.number().int().default(0), // attacco: si somma al margine
  ignora: z.number().int().default(0), // attacco: armatura ignorata
  modifica: Modifica.optional(), // difesa
  cura: z.number().int().default(0), // PF in combattimento
  decifra: Id, // storylet che lo decifra
});

export const Oggetto = z
  .object({
    id: Id,
    nome: z.string(),
    descrizione: z.string().optional(),
    immagine: Immagine.optional(),
    slot: z.enum(['arma', 'armatura', 'scudo', 'accessorio', 'nessuno']),
    base: Id.optional(), // arma, armatura o scudo di base
    grado: z.number().int().min(0).max(5).default(0),
    dadi: z.number().int().min(0).max(5).default(0), // in attacco (armi) o in difesa (armature e scudi)
    proprieta: Proprieta.default({}),
    difetti: z.array(z.enum(DIFETTI)).default([]),
    usa: Id.optional(), // storylet aperto dal pulsante "Usa"
    reperto: Reperto.optional(),
    prezzo: z.number().int().min(0).optional(),
  })
  .superRefine((o, ctx) => {
    if (['arma', 'armatura', 'scudo'].includes(o.slot) && !o.base) ctx.addIssue({ code: 'custom', message: `un oggetto nello slot ${o.slot} richiede una base` });
    if (o.slot === 'accessorio' && (o.dadi > 0 || o.grado > 3)) ctx.addIssue({ code: 'custom', message: 'gli accessori arrivano a +3 e non danno dadi' });
    const p = o.proprieta;
    let punti = o.dadi + Object.values(p.talento).reduce((a, b) => a + b, 0);
    for (const [k, costo] of Object.entries(COSTI_PROPRIETA)) {
      const v = p[k as keyof typeof COSTI_PROPRIETA];
      punti += typeof v === 'boolean' ? (v ? costo : 0) : (v as number) * costo;
    }
    if (o.base && o.grado === 0 && punti - o.dadi > 0) ctx.addIssue({ code: 'custom', message: 'le proprietà richiedono un grado' });
    if (o.grado > 0 && punti > o.grado + o.difetti.length) ctx.addIssue({ code: 'custom', message: `troppi punti: ${punti} su ${o.grado} + ${o.difetti.length} difetti` });
  });

export const Negozio = z.object({
  id: Id,
  nome: z.string(),
  immagine: Immagine.optional(),
  testo: z.string(),
  compra: z.array(z.object({ quality: Id, prezzo: z.number().int().min(1) })).default([]), // il negozio compra dal giocatore
  vende: z.array(z.object({ quality: Id, prezzo: z.number().int().min(1) })).default([]), // il giocatore compra
});

export const Origine = z.object({
  id: Id,
  nome: z.string(),
  immagine: Immagine.optional(),
  testo: z.string(),
  attributi: z.record(z.enum(ATTRIBUTI), z.number().int().min(1).max(3)),
  abilita: z.record(z.string(), z.number().int().min(0).max(3)),
  quality: z.record(z.string(), z.number()).default({}),
  arma: Id,
  armatura: Id,
});


// ---------------------------------------------------------------- incantesimi (Regolamento, sezione 7)

export const TRADIZIONI = ['cristalli', 'albero', 'respiro', 'precuriane'] as const;
export const NOMI_TRADIZIONI: Record<(typeof TRADIZIONI)[number], string> = {
  cristalli: 'Arte dei cristalli',
  albero: "Liturgia dell'Albero",
  respiro: 'Via del Respiro',
  precuriane: 'Formule precuriane',
};

export const Incantesimo = z
  .object({
    id: Id,
    nome: z.string(),
    tradizione: z.enum(TRADIZIONI),
    livello: z.number().int().min(1).max(5),
    uso: z.array(z.enum(['combattimento', 'storie'])).min(1),
    descrizione: z.string(),
    immagine: Immagine.optional(),
    // effetto in combattimento
    tipo: z.enum(['attacco', 'automatico', 'area', 'potenziamento', 'indebolimento', 'cura', 'fuga', 'nessuno']).default('nessuno'),
    difesa: z.enum(['acrobazia', 'resilienza', 'resistenza']).optional(),
    danno: z.number().int().default(0), // si somma al margine
    successi: z.number().int().optional(), // incantesimi automatici
    modifica: Modifica.optional(), // potenziamento (su di te) o indebolimento (sul bersaglio)
    veleno: z.object({ valore: z.number().int(), round: z.number().int() }).optional(),
    doppioContro: z.array(z.string()).default([]), // tratti del nemico che subiscono danno doppio
    solo: z.array(z.string()).default([]), // tratti richiesti al bersaglio (es. Richiamo: animale)
    margineFuga: z.number().int().optional(),
    prezzo: z.record(z.string(), z.number()).optional(), // formule proibite: costo a ogni lancio
  })
  .superRefine((x, ctx) => {
    const combatte = x.uso.includes('combattimento');
    if (combatte && x.tipo === 'nessuno') ctx.addIssue({ code: 'custom', message: 'un incantesimo da combattimento richiede un tipo' });
    if (['attacco', 'automatico', 'area', 'indebolimento', 'fuga'].includes(x.tipo) && !x.difesa) ctx.addIssue({ code: 'custom', message: `il tipo ${x.tipo} richiede la difesa` });
    if (x.tipo === 'automatico' && !x.successi) ctx.addIssue({ code: 'custom', message: 'un incantesimo automatico richiede i successi fissi' });
    if ((x.tipo === 'potenziamento' || x.tipo === 'indebolimento') && !x.modifica) ctx.addIssue({ code: 'custom', message: `il tipo ${x.tipo} richiede la modifica` });
  });

// ---------------------------------------------------------------- mutazioni (Regolamento 5.5)

export const Mutazione = z.object({
  id: Id,
  nome: z.string(),
  descrizione: z.string(), // come si vede e si sente
  vantaggio: z.string(),
  svantaggio: z.string(),
  immagine: Immagine.optional(),
  abilita: z.record(z.string(), z.number().int()).default({}), // ±N alle abilità, sempre
  energia: z.number().int().default(0),
  riduzione: z.number().int().default(0),
  pf: z.number().int().default(0),
  dannoManiNude: z.number().int().default(0),
  magiaFuori: z.number().int().default(0), // dadi a Magia fuori dal combattimento
  schermata: z.boolean().default(false), // Contaminazione per esposizione dimezzata
  dissonanza: z.number().default(0), // Tormento in più a ogni Dissonanza
});

/** Frammenti del Codex: brevi voci di ambientazione mostrate a margine. Solo informazioni pubbliche. */
export const Frammento = z.object({
  id: Id,
  titolo: z.string(),
  testo: z.string(),
  immagine: Immagine.optional(),
  area: Id.optional(), // se presente, compare solo in quell'area
});

// Glossario: le voci che compaiono come tooltip sui nomi nei testi (personaggi, luoghi, fazioni…).
export const TIPI_VOCE = ['personaggio', 'luogo', 'fazione', 'creatura', 'cosa'] as const;
export const Voce = z.object({
  id: Id,
  nome: z.string(), // la forma che si cerca nei testi
  alias: z.array(z.string()).default([]), // altre forme (solo il cognome, il nome breve…)
  tipo: z.enum(TIPI_VOCE),
  sottotitolo: z.string().optional(), // una riga: ruolo, quartiere
  testo: z.string(), // 25–70 parole, senza segreti
  requisiti: z.array(z.string()).default([]), // se non soddisfatti, il nome resta testo semplice
});

export const Contenuti = z.object({
  aree: z.array(Area),
  storylet: z.array(Storylet),
  quality: z.array(Quality),
  nemici: z.array(Nemico),
  scontri: z.array(Scontro),
  armi: z.array(Arma),
  armature: z.array(Armatura),
  negozi: z.array(Negozio),
  origini: z.array(Origine),
  frammenti: z.array(Frammento).default([]),
  incantesimi: z.array(Incantesimo).default([]),
  scudi: z.array(Scudo).default([]),
  mutazioni: z.array(Mutazione).default([]),
  oggetti: z.array(Oggetto).default([]),
  glossario: z.array(Voce).default([]),
});

export type TEffetti = z.infer<typeof Effetti>;
export type TEsito = z.infer<typeof Esito>;
export type TProva = z.infer<typeof Prova>;
export type TOpzione = z.infer<typeof Opzione>;
export type TStorylet = z.infer<typeof Storylet>;
export type TArea = z.infer<typeof Area>;
export type TQuality = z.infer<typeof Quality>;
export type TNemico = z.infer<typeof Nemico>;
export type TScontro = z.infer<typeof Scontro>;
export type TArma = z.infer<typeof Arma>;
export type TArmatura = z.infer<typeof Armatura>;
export type TNegozio = z.infer<typeof Negozio>;
export type TOrigine = z.infer<typeof Origine>;
export type TMutazione = z.infer<typeof Mutazione>;
export type TOggetto = z.infer<typeof Oggetto>;
export type TScudo = z.infer<typeof Scudo>;
export type TIncantesimo = z.infer<typeof Incantesimo>;
export type TModifica = z.infer<typeof Modifica>;
export type TFrammento = z.infer<typeof Frammento>;
export type TVoce = z.infer<typeof Voce>;
export type TContenuti = z.infer<typeof Contenuti>;
