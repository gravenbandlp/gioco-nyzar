// Le voci delle abilità dentro la prosa, alla Disco Elysium (ottobre 2026).
// Un paragrafo che comincia con un segno fra graffe è la voce di un'abilità, con un check passivo:
//   {percezione Media} Sul vetro qualcuno ha inciso ...          compare se il check riesce
//   {resilienza Facile fallita} Hai freddo. Lo sapevi già ...    compare se il check fallisce
// Il check non tira dadi, così il testo resta lo stesso a ogni ridisegno: riesce se, con i dadi di attributo e
// abilità, la prova avrebbe almeno metà delle probabilità di riuscire.
import { ABILITA, ATTRIBUTI, DIFFICOLTA, NOMI, type Attributo, type Difficolta } from './regole';
import { probabilita } from './dadi';
import { abilitaEffettiva, type Stato } from './personaggio';
import type { TContenuti } from './contenuto';

const DIFF = '(Molto facile|Facile|Media|Difficile|Molto difficile)';
export const RX_VOCE = new RegExp(`^\\{([a-z-]+) ${DIFF}( fallita)?\\}\\s*`);

export interface Voce { abilita: string; attributo: Attributo; difficolta: Difficolta; seFallita: boolean }

export function attributoDi(abilita: string): Attributo | undefined {
  return ATTRIBUTI.find((a) => (ABILITA[a] as readonly string[]).includes(abilita));
}

/** Il segno all'inizio di un paragrafo, se c'è; `null` se il paragrafo è prosa normale. */
export function leggiVoce(paragrafo: string): (Voce & { testo: string }) | null {
  const m = RX_VOCE.exec(paragrafo);
  if (!m) return null;
  const attributo = attributoDi(m[1]!);
  if (!attributo) return null;
  return { abilita: m[1]!, attributo, difficolta: m[2] as Difficolta, seFallita: !!m[3], testo: paragrafo.slice(m[0].length) };
}

/** Il check passivo: riesce se la prova avrebbe almeno metà delle probabilità di riuscire. */
export function checkPassivo(s: Stato, c: TContenuti, v: Pick<Voce, 'abilita' | 'attributo' | 'difficolta'>): boolean {
  const pool = s.attributi[v.attributo] + abilitaEffettiva(s, v.abilita, c);
  return probabilita(pool, DIFFICOLTA[v.difficolta]) >= 0.5;
}

/** Errori nei segni delle voci di un testo, per il controllo dei contenuti. */
export function erroriVoci(testo: string): string[] {
  const errori: string[] = [];
  for (const p of testo.trim().split(/\n\s*\n/)) {
    const t = p.trim();
    if (!t.startsWith('{')) continue;
    const m = /^\{([^}]*)\}/.exec(t);
    if (!m) { errori.push(`graffa aperta e mai chiusa: "${t.slice(0, 40)}"`); continue; }
    const v = leggiVoce(t);
    if (!v) errori.push(`voce non valida "{${m[1]}}": serve {abilità Difficoltà} o {abilità Difficoltà fallita}`);
    else if (!v.testo.trim()) errori.push(`voce senza testo "{${m[1]}}"`);
  }
  return errori;
}

/** Il testo senza i segni delle voci (per il controllo di stile e per le prime frasi). */
export const senzaSegni = (testo: string) => testo.replace(new RegExp(`(^|\\n)\\s*\\{[a-z-]+ ${DIFF}( fallita)?\\}\\s*`, 'g'), '$1');

export const nomeVoce = (abilita: string) => (NOMI[abilita] ?? abilita).toUpperCase();
