// Crisi, aree di penalità e mutazioni (Regolamento 5.3–5.5 e docs/regolamento-crisi.md).
import type { TContenuti, TMutazione, TStorylet } from './contenuto';
import { requisitiSoddisfatti, requisitiMancanti, parseRequisito, type Stato } from './personaggio';

export const inPenalita = (s: Stato, c: TContenuti) => !!c.aree.find((a) => a.id === s.area)?.penalita;

/**
 * Lo storylet che si apre da solo adesso, se c'è: prima il prologo, poi la crisi.
 * Nelle aree di penalità le crisi aspettano l'uscita.
 */
export function crisiAttiva(s: Stato, c: TContenuti): TStorylet | undefined {
  const prologo = c.storylet.find((st) => st.tipo === 'prologo' && requisitiSoddisfatti(s, st.requisiti, c));
  if (prologo) return prologo;
  if (inPenalita(s, c)) return undefined;
  return c.storylet.find((st) => st.tipo === 'crisi' && requisitiSoddisfatti(s, st.requisiti, c));
}

/** Semplice hash di una stringa, per scelte a caso ripetibili. */
export function hash(t: string): number {
  let x = 2166136261;
  for (let i = 0; i < t.length; i++) x = Math.imul(x ^ t.charCodeAt(i), 16777619);
  return x >>> 0;
}

/** Un requisito che dipende dalla trama (piste, flag di stato, origine), non da qualcosa che si procura. */
export function diTrama(r: string, c: TContenuti): boolean {
  const { chiave } = parseRequisito(r);
  if (chiave.startsWith('pista.') || chiave.startsWith('origine.')) return true;
  const cat = c.quality.find((q) => q.id === chiave)?.categoria;
  return cat === 'stato' || cat === 'pista';
}

/**
 * Indici delle opzioni da mostrare. Con `mostra: N` si vedono solo N opzioni fra quelle disponibili,
 * scelte a caso ma sempre le stesse finché lo stato del personaggio non cambia.
 */
export function opzioniVisibili(s: Stato, st: TStorylet, c: TContenuti): number[] {
  // le opzioni con `quando` non soddisfatto non compaiono, e nemmeno quelle chiuse da un fatto della trama (una
  // pista, un flag di stato, l'origine): mostrarle chiuse svelerebbe cosa succederà. Si vedono chiuse solo quelle
  // che chiedono cose da procurarsi (abilità, monete, merci, reputazione, oggetti). Se così non resta niente, si
  // vedono tutte.
  const indici = st.opzioni.map((_, i) => i).filter((i) => requisitiSoddisfatti(s, st.opzioni[i]!.quando, c));
  const senzaTrama = indici.filter((i) => !requisitiMancanti(s, st.opzioni[i]!.requisiti, c).some((r) => diTrama(r, c)));
  const tutte = senzaTrama.length ? senzaTrama : indici;
  if (!st.mostra) return tutte;
  const disponibili = tutte.filter((i) => requisitiSoddisfatti(s, st.opzioni[i]!.requisiti, c));
  const seme = hash(`${s.nome}|${st.id}|${mutazioniDi(s, c).map((m) => m.id).join(',')}`);
  return disponibili
    .map((i) => ({ i, k: hash(`${seme}|${i}`) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, st.mostra)
    .map((x) => x.i)
    .sort((a, b) => a - b);
}

export function mutazioniDi(s: Stato, c: TContenuti): TMutazione[] {
  return c.mutazioni.filter((m) => (s.quality[`mutazione.${m.id}`] ?? 0) >= 1);
}

/** Somma di un modificatore numerico delle mutazioni del personaggio. */
export function sommaMutazioni(s: Stato, c: TContenuti, campo: 'energia' | 'riduzione' | 'pf' | 'dannoManiNude' | 'magiaFuori' | 'dissonanza'): number {
  return mutazioniDi(s, c).reduce((a, m) => a + m[campo], 0);
}

export function mutazioniAbilita(s: Stato, c: TContenuti, abilita: string): number {
  return mutazioniDi(s, c).reduce((a, m) => a + (m.abilita[abilita] ?? 0), 0);
}

export function mutazioneSchermata(s: Stato, c: TContenuti): boolean {
  return mutazioniDi(s, c).some((m) => m.schermata);
}

/** Tormento dato da una Dissonanza: ½, più quanto aggiungono le mutazioni. */
export function tormentoDissonanza(s: Stato, c: TContenuti): number {
  return 0.5 + sommaMutazioni(s, c, 'dissonanza');
}
