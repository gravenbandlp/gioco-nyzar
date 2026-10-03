// Costanti di regolamento (Regolamento v0.4). Tutti i numeri del gioco stanno qui.

export const ATTRIBUTI = ['fisico', 'sociale', 'mentale'] as const;
export type Attributo = (typeof ATTRIBUTI)[number];

export const ABILITA: Record<Attributo, readonly string[]> = {
  fisico: ['rissa', 'armi-da-mischia', 'armi-da-distanza', 'resistenza', 'atletica', 'acrobazia', 'furtivita', 'cavalcare'],
  sociale: ['conoscenze-della-strada', 'galateo', 'persuasione', 'intimidire', 'ingannare', 'empatia', 'espressivita', 'addestrare-animali'],
  mentale: ['accademiche', 'percezione', 'politica-ed-economia', 'tecnologia', 'magia', 'medicina', 'natura', 'resilienza'],
};

export const TUTTE_LE_ABILITA: string[] = ATTRIBUTI.flatMap((a) => [...ABILITA[a]]);

export function attributoDi(abilita: string): Attributo {
  for (const a of ATTRIBUTI) if (ABILITA[a].includes(abilita)) return a;
  throw new Error(`Abilità sconosciuta: ${abilita}`);
}

export const NOMI: Record<string, string> = {
  fisico: 'Fisico', sociale: 'Sociale', mentale: 'Mentale',
  rissa: 'Rissa', 'armi-da-mischia': 'Armi da mischia', 'armi-da-distanza': 'Armi da distanza', resistenza: 'Resistenza',
  atletica: 'Atletica', acrobazia: 'Acrobazia', furtivita: 'Furtività', cavalcare: 'Cavalcare',
  'conoscenze-della-strada': 'Conoscenze della strada', galateo: 'Galateo', persuasione: 'Persuasione', intimidire: 'Intimidire',
  ingannare: 'Ingannare', empatia: 'Empatia', espressivita: 'Espressività', 'addestrare-animali': 'Addestrare animali',
  accademiche: 'Accademiche', percezione: 'Percezione', 'politica-ed-economia': 'Politica ed economia', tecnologia: 'Tecnologia',
  magia: 'Magia', medicina: 'Medicina', natura: 'Natura', resilienza: 'Resilienza',
};

export const MAX_GIOCATORE = 5;

// Prove: successi richiesti per etichetta (4.)
export const DIFFICOLTA = {
  'Molto facile': 1,
  Facile: 2,
  Media: 3,
  Difficile: 4,
  'Molto difficile': 5,
  Impossibile: 7,
} as const;
export type Difficolta = keyof typeof DIFFICOLTA;
export const ETICHETTE_DIFFICOLTA = Object.keys(DIFFICOLTA) as Difficolta[];

// Crescita (3.5)
export const SOGLIE_PE = [20, 40, 70, 110, 160]; // da 0→1, 1→2, … 4→5
export const QUOTA_ATTRIBUTO = 0.25;
export function peDaProbabilita(p: number): number {
  if (p >= 0.9) return 1;
  if (p >= 0.7) return 2;
  if (p >= 0.4) return 3;
  if (p >= 0.2) return 4;
  if (p >= 0.05) return 3;
  return 1;
}

// Statistiche negative (5.)
export const NEGATIVE = ['ferite', 'scandalo', 'sospetto', 'tormento', 'contaminazione'] as const;
export const MAX_NEGATIVA = 8;
export const SOGLIA_PERICOLO = 5;

// Reputazione (9.5)
export const REPUTAZIONE_MIN = -5;
export const REPUTAZIONE_MAX = 10;

// Rintocchi e mazzo (9.2, 9.3). Fino al 2 ottobre 2026 si chiamavano candele.
export const RINTOCCHI_MAX = 40; // ne torna uno ogni 10 minuti, e basta: nessuna ricarica
export const MINUTI_PER_RINTOCCO = 10;
export const MANO_MAX = 3;
export const CODA_MAX = 6;
export const MINUTI_PER_CARTA = 10;

// Combattimento (6.)
export const ETICHETTE_COMBATTIMENTO: { min: number; etichetta: string }[] = [
  { min: 0.9, etichetta: 'Molto facile' },
  { min: 0.7, etichetta: 'Facile' },
  { min: 0.4, etichetta: 'Medio' },
  { min: 0.2, etichetta: 'Difficile' },
  { min: 0.05, etichetta: 'Molto difficile' },
  { min: 0, etichetta: 'Impossibile' },
];
export const MAX_CONSUMABILI_IN_COMBATTIMENTO = 3;
export const ROUND_MAX = 60; // sicurezza per le simulazioni
