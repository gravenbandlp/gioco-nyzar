// Piccoli aiuti di presentazione: testo sicuro, numeri a mezzi punti, requisiti leggibili.
import type { TContenuti } from '../motore/contenuto';
import { NOMI } from '../motore/regole';
import { nomeDi, parseRequisito, valore, type Stato } from '../motore/personaggio';

export function h(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 0.5 → "½", 1.5 → "1½", 3 → "3". Valori già a mezzi punti. */
export function mezzi(n: number): string {
  const intero = Math.trunc(n);
  const resto = Math.abs(n - intero) >= 0.25;
  if (!resto) return String(intero);
  if (intero === 0) return n < 0 ? '−½' : '½';
  return `${intero < 0 ? '−' : ''}${Math.abs(intero)}½`;
}

export function segno(n: number): string {
  if (n > 0) return `+${mezzi(n)}`;
  if (n < 0) return `−${mezzi(-n)}`;
  return '0';
}

export function durata(ms: number): string {
  const tot = Math.ceil(ms / 1000);
  const m = Math.floor(tot / 60);
  const s = tot % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Il tempo di gioco, in ore e minuti. */
export function tempoGiocato(ms: number): string {
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'meno di un minuto';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}

export function percentuale(p: number): string {
  if (p > 0 && p < 0.01) return '<1%';
  if (p < 1 && p > 0.99) return '>99%';
  return `${Math.round(p * 100)}%`;
}

export function nome(chiave: string, c: TContenuti): string {
  return NOMI[chiave] ?? nomeDi(chiave, c);
}

/** "monete >= 10" → "Monete di lyssan: almeno 10 (ne hai 3)". */
export function requisitoLeggibile(r: string, s: Stato, c: TContenuti): string {
  const { chiave, op, n } = parseRequisito(r);
  const q = c.quality.find((x) => x.id === chiave);
  const nm = nome(chiave, c);
  const hai = valore(s, chiave);
  if (q?.categoria === 'pista') return 'La storia non è ancora a questo punto.';
  if (op === '==' && n === 0) return `Non devi avere: ${nm}.`;
  if (q?.categoria === 'accesso' && op === '>=' && n === 1) return `Serve: ${nm}.`;
  if (q?.nascosta && op === '>=' && n === 1) return `${nm}.`; // le condizioni nascoste hanno un nome che si legge da solo
  const verbo: Record<string, string> = {
    '>=': `almeno ${mezzi(n)}`, '>': `più di ${mezzi(n)}`, '<=': `al massimo ${mezzi(n)}`,
    '<': `meno di ${mezzi(n)}`, '==': `esattamente ${mezzi(n)}`, '!=': `diverso da ${mezzi(n)}`,
  };
  return `${nm}: ${verbo[op]} (hai ${mezzi(hai)}).`;
}
