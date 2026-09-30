// Inventario, slot e oggetti (Regolamento 8.1, 8.7–8.9 e docs/regolamento-oggetti.md).
// Un oggetto posseduto è la quality oggetto.<id>; gli slot stanno nello Stato.
import type { TArma, TArmatura, TContenuti, TOggetto, TScudo } from './contenuto';
import type { Stato } from './personaggio';

export const NIENTE_ARMA = 'mani-nude';
export const NIENTE_ARMATURA = 'nessuna';
export const MAX_ACCESSORI = 2;

export const chiaveOggetto = (id: string) => `oggetto.${id}`;
export const possiede = (s: Stato, id: string) => (s.quality[chiaveOggetto(id)] ?? 0) >= 1;

export function oggetto(c: TContenuti, id: string | undefined): TOggetto | undefined {
  return id ? c.oggetti.find((o) => o.id === id) : undefined;
}

/** Gli oggetti indossati negli slot (arma, armatura, scudo, accessori). */
export function indossati(s: Stato, c: TContenuti): TOggetto[] {
  return [s.arma, s.armatura, s.scudo, ...(s.accessori ?? [])]
    .map((id) => oggetto(c, id))
    .filter((o): o is TOggetto => !!o);
}

/** Reperti decifrati, non guasti, che si portano dietro (non occupano slot). */
export function repertiAttivi(s: Stato, c: TContenuti): TOggetto[] {
  return c.oggetti.filter((o) => o.reperto && possiede(s, o.id) && (s.quality[`decifrato.${o.id}`] ?? 0) >= 1 && !(s.quality[`guasto.${o.id}`] ?? 0));
}

/** Oggetti che contano per le proprietà passive: quelli indossati più i reperti passivi attivi. */
function attivi(s: Stato, c: TContenuti): TOggetto[] {
  return [...indossati(s, c), ...repertiAttivi(s, c).filter((o) => o.reperto!.tipo === 'passivo')];
}

export function baseArma(s: Stato, c: TContenuti): { arma: TArma | undefined; og: TOggetto | undefined } {
  const og = oggetto(c, s.arma);
  return { og, arma: c.armi.find((a) => a.id === (og?.base ?? s.arma)) ?? c.armi.find((a) => a.id === NIENTE_ARMA) };
}

export function baseArmatura(s: Stato, c: TContenuti): { armatura: TArmatura | undefined; og: TOggetto | undefined } {
  const og = oggetto(c, s.armatura);
  return { og, armatura: c.armature.find((a) => a.id === (og?.base ?? s.armatura)) };
}

export function baseScudo(s: Stato, c: TContenuti): { scudo: TScudo | undefined; og: TOggetto | undefined } {
  const og = oggetto(c, s.scudo);
  return { og, scudo: og ? c.scudi.find((x) => x.id === og.base) : undefined };
}

export function haProprieta(s: Stato, c: TContenuti, p: 'assetata' | 'schermata' | 'lucida' | 'ultimoRespiro' | 'secondaScelta' | 'ostinata' | 'caricatore'): boolean {
  return attivi(s, c).some((o) => o.proprieta[p]);
}

export function haDifetto(s: Stato, c: TContenuti, d: string): boolean {
  return indossati(s, c).some((o) => (o.difetti as string[]).includes(d));
}

/** Penalità alle abilità da armatura e scudo (anche fuori dal combattimento), più il difetto Rumorosa. */
export function penalita(s: Stato, c: TContenuti, abilita: string): number {
  const { armatura, og: ogArm } = baseArmatura(s, c);
  const { scudo } = baseScudo(s, c);
  let p = (armatura?.penalita[abilita] ?? 0) + (scudo?.penalita[abilita] ?? 0);
  if (abilita === 'furtivita') {
    if (ogArm?.proprieta.silenziosa) p -= armatura?.penalita['furtivita'] ?? 0;
    p -= indossati(s, c).filter((o) => o.difetti.includes('rumorosa')).length;
  }
  return p;
}

/** Talento: dadi in più a un'abilità fuori dal combattimento. Tra oggetti diversi vale il più alto. */
export function talento(s: Stato, c: TContenuti, abilita: string): number {
  return Math.max(0, ...attivi(s, c).map((o) => o.proprieta.talento[abilita] ?? 0));
}

/** Dadi in difesa da armatura e scudo: bonus di oggetti diversi allo stesso tiro non si sommano. */
export function dadiDifesa(s: Stato, c: TContenuti): number {
  const { og: arm } = baseArmatura(s, c);
  const { og: sc } = baseScudo(s, c);
  return Math.max(arm?.dadi ?? 0, sc?.dadi ?? 0);
}

/** Dadi in iniziativa: Leggera dell'arma o Rapida di un oggetto, il più alto. */
export function dadiIniziativa(s: Stato, c: TContenuti): number {
  const { arma } = baseArma(s, c);
  const leggera = arma?.proprieta.includes('Leggera') ? 1 : 0;
  return Math.max(leggera, ...attivi(s, c).map((o) => o.proprieta.rapida));
}

export function energiaExtra(s: Stato, c: TContenuti): number {
  return attivi(s, c).reduce((a, o) => a + o.proprieta.riserva * 2, 0);
}

/** Chiavi possedute (oggetti portati con sé, indossati o no). */
export function chiavi(s: Stato, c: TContenuti): Set<string> {
  return new Set(c.oggetti.filter((o) => possiede(s, o.id)).flatMap((o) => o.proprieta.chiave));
}

/** Valore delle chiavi di requisito speciali: chiave.<nome>, indossa.<proprietà o difetto>. */
export function valoreOggetti(s: Stato, c: TContenuti, k: string): number | undefined {
  if (k.startsWith('chiave.')) return chiavi(s, c).has(k.slice(7)) ? 1 : 0;
  if (k.startsWith('indossa.')) {
    const t = k.slice(8);
    return indossati(s, c).filter((o) => (o.difetti as string[]).includes(t) || Boolean((o.proprieta as Record<string, unknown>)[t])).length;
  }
  return undefined;
}

// ---------------------------------------------------------------- indossare

export function slotLiberoPer(s: Stato, o: TOggetto): 'arma' | 'armatura' | 'scudo' | 'accessorio' | null {
  return o.slot === 'nessuno' ? null : o.slot;
}

export function perchéNonIndossabile(s: Stato, c: TContenuti, id: string): string | null {
  const o = oggetto(c, id);
  if (!o || !possiede(s, id)) return 'Non lo possiedi.';
  if (o.slot === 'nessuno') return 'Non si indossa.';
  if (o.difetti.includes('pesante') && s.attributi.fisico < 3) return 'È troppo pesante: serve Fisico 3.';
  if (o.slot === 'scudo') {
    const { arma } = baseArma(s, c);
    if (arma?.proprieta.includes('Due mani')) return "Con un'arma a due mani non puoi portare uno scudo.";
  }
  if (o.slot === 'accessorio' && (s.accessori ?? []).includes(id)) return 'Lo indossi già.';
  if (o.slot === 'accessorio' && (s.accessori ?? []).length >= MAX_ACCESSORI) return `Porti già ${MAX_ACCESSORI} accessori.`;
  return null;
}

export function indossa(s: Stato, c: TContenuti, id: string): boolean {
  if (perchéNonIndossabile(s, c, id)) return false;
  const o = oggetto(c, id)!;
  if (o.slot === 'arma') {
    s.arma = id;
    const { arma } = baseArma(s, c);
    if (arma?.proprieta.includes('Due mani')) s.scudo = '';
  } else if (o.slot === 'armatura') s.armatura = id;
  else if (o.slot === 'scudo') s.scudo = id;
  else if (o.slot === 'accessorio') s.accessori = [...(s.accessori ?? []), id];
  return true;
}

export function togli(s: Stato, id: string): void {
  if (s.arma === id) s.arma = NIENTE_ARMA;
  if (s.armatura === id) s.armatura = NIENTE_ARMATURA;
  if (s.scudo === id) s.scudo = '';
  s.accessori = (s.accessori ?? []).filter((x) => x !== id);
}

export const indossato = (s: Stato, id: string) => [s.arma, s.armatura, s.scudo, ...(s.accessori ?? [])].includes(id);

/** Aggiunge un oggetto all'inventario; se lo slot è vuoto lo indossa subito. */
export function ricevi(s: Stato, c: TContenuti, id: string): void {
  s.quality[chiaveOggetto(id)] = (s.quality[chiaveOggetto(id)] ?? 0) + 1;
  const o = oggetto(c, id);
  if (!o) return;
  const vuoto = (o.slot === 'arma' && s.arma === NIENTE_ARMA) || (o.slot === 'armatura' && s.armatura === NIENTE_ARMATURA)
    || (o.slot === 'scudo' && !s.scudo) || (o.slot === 'accessorio' && (s.accessori ?? []).length < MAX_ACCESSORI);
  if (vuoto) indossa(s, c, id);
  if (o.reperto && (s.quality[`decifrato.${id}`] ?? 0) >= 1 && s.quality[`cariche.${id}`] === undefined) s.quality[`cariche.${id}`] = o.reperto.cariche;
}

/** Ricarica un reperto con una cella. */
export function ricaricaReperto(s: Stato, c: TContenuti, id: string): boolean {
  const o = oggetto(c, id);
  if (!o?.reperto || o.reperto.tipo === 'passivo' || (s.quality['cella'] ?? 0) < 1) return false;
  if ((s.quality[`cariche.${id}`] ?? 0) >= o.reperto.cariche) return false;
  s.quality['cella'] = (s.quality['cella'] ?? 0) - 1;
  s.quality[`cariche.${id}`] = (s.quality[`cariche.${id}`] ?? 0) + 1;
  return true;
}

/** Completa uno stato salvato con una versione precedente del gioco. */
export function migraOggetti(s: Stato): void {
  s.scudo ??= '';
  s.accessori ??= [];
  for (const id of [s.arma, s.armatura]) if (id && id !== NIENTE_ARMA && id !== NIENTE_ARMATURA) s.quality[chiaveOggetto(id)] ??= 1;
}
