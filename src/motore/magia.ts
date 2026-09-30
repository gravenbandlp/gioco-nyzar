// Incantesimi conosciuti e repertorio da combattimento (Regolamento, sezione 7).
import type { TContenuti, TIncantesimo } from './contenuto';
import type { Stato } from './personaggio';

export const chiaveIncantesimo = (id: string) => `incantesimo.${id}`;

export function incantesimiConosciuti(s: Stato, c: TContenuti): TIncantesimo[] {
  return c.incantesimi.filter((i) => (s.quality[chiaveIncantesimo(i.id)] ?? 0) >= 1);
}

/** In combattimento si portano al massimo Magia + 2 incantesimi. */
export function limiteRepertorio(s: Stato): number {
  return (s.abilita['magia'] ?? 0) + 2;
}

/**
 * Il repertorio effettivo. Se il giocatore non ha ancora scelto, vale l'ordine in cui
 * ha imparato gli incantesimi da combattimento, fino al limite.
 */
export function repertorio(s: Stato, c: TContenuti): TIncantesimo[] {
  const daCombattimento = incantesimiConosciuti(s, c).filter((i) => i.uso.includes('combattimento'));
  const scelti = (s.repertorio ?? []).map((id) => daCombattimento.find((i) => i.id === id)).filter((i): i is TIncantesimo => !!i);
  const haScelto = (s.repertorio ?? []).length > 0; // ['-'] = ha scelto di non portarne nessuno
  return (haScelto ? scelti : daCombattimento).slice(0, limiteRepertorio(s));
}

/** Aggiunge o toglie un incantesimo dal repertorio. Restituisce false se il limite è già pieno. */
export function cambiaRepertorio(s: Stato, id: string, c: TContenuti): boolean {
  const attuale = repertorio(s, c).map((i) => i.id);
  if (attuale.includes(id)) { s.repertorio = attuale.filter((x) => x !== id); if (!s.repertorio.length) s.repertorio = ['-']; return true; }
  if (attuale.length >= limiteRepertorio(s)) return false;
  s.repertorio = [...attuale, id];
  return true;
}
