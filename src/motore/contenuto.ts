// Schema dei contenuti (Regolamento v0.4, 9.8). Usato dal validatore in fase di build
// e come fonte dei tipi per motore e interfaccia.
import { z } from 'zod';
import { ATTRIBUTI, ETICHETTE_DIFFICOLTA } from './regole';

const Id = z.string().regex(/^[a-z0-9][a-z0-9.-]*$/, 'id in minuscolo, con trattini o punti');

/** Tavola del Codex: "collezione/slug", es. "ambientazione/pignatta-grassa". */
export const Immagine = z.string().regex(/^[a-z]+\/[a-z0-9-]+$/, 'immagine nel formato collezione/slug');

/** Effetti: chiave → variazione numerica ("+1", -2, 0.5). */
export const Effetti = z.record(z.string(), z.number());

export const Esito = z.object({
  immagine: Immagine.optional(),
  titolo: z.string().optional(), // intestazione dell'esito, alla Fallen London
  testo: z.string(),
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
  });

export const Storylet = z.object({
  id: Id,
  immagine: Immagine.optional(),
  titolo: z.string(),
  sommario: z.string().optional(), // una riga, mostrata nell'elenco
  area: Id,
  tipo: z.enum(['fisso', 'carta', 'crisi', 'penalita']).default('fisso'),
  ripetibile: z.boolean().default(false),
  luogo: z.string().optional(), // sottotitolo: dove avviene
  requisiti: z.array(z.string()).default([]),
  testo: z.string(),
  opzioni: z.array(Opzione).min(1),
});

export const Area = z.object({
  id: Id,
  immagine: Immagine.optional(),
  nome: z.string(),
  testo: z.string(),
  accesso: z.array(z.string()).default([]),
  gabella: z.number().int().min(0).default(0),
  negozi: z.array(Id).default([]),
});

export const Quality = z.object({
  id: Id,
  nome: z.string(),
  immagine: Immagine.optional(),
  categoria: z.enum(['moneta', 'bene', 'pista', 'negativa', 'reputazione', 'accesso', 'consumabile', 'equipaggiamento', 'stato']),
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

/** Frammenti del Codex: brevi voci di ambientazione mostrate a margine. Solo informazioni pubbliche. */
export const Frammento = z.object({
  id: Id,
  titolo: z.string(),
  testo: z.string(),
  immagine: Immagine.optional(),
  area: Id.optional(), // se presente, compare solo in quell'area
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
export type TFrammento = z.infer<typeof Frammento>;
export type TContenuti = z.infer<typeof Contenuti>;
